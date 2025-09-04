# API Improvements Suggestions

This document outlines suggested improvements for the `@repo/api` package to make it more robust, secure, and production-ready.

## Current State Analysis

The API is currently a minimal Hono-based server with:
- ✅ Proper TypeScript configuration with decorator support
- ✅ Dependency injection with shared services
- ✅ CORS middleware configured
- ✅ Basic logging middleware
- ❌ No error handling
- ❌ No health endpoints
- ❌ No security headers
- ❌ Empty routes structure

## Suggested Improvements

### 1. Error Handling & Middleware

**Priority: High**

```typescript
import { HTTPException } from 'hono/http-exception';
import { AppLogger } from '@repo/shared-services';

// Global error handler with consistent HTTPException handling
honoApp.onError((err, c) => {
  const logger = container.resolve(AppLogger);
  
  let httpException: HTTPException;
  
  if (err instanceof HTTPException) {
    httpException = err;
    logger.warn({ error: err }, 'HTTP Exception');
  } else {
    // Convert any error to HTTPException for consistent handling
    httpException = new HTTPException(500, { message: 'Internal server error' });
    logger.error({ error: err }, 'Unhandled error converted to HTTP Exception');
  }
  
  return c.json({
    error: {
      code: httpException.status,
      message: httpException.message,
      timestamp: new Date().toISOString()
    }
  }, httpException.status);
});

// Usage in routes:
// throw new HTTPException(400, { message: 'Invalid request data' });
// throw new HTTPException(404, { message: 'User not found' });
```

**Benefits:**
- Uses `hono/http-exception` for consistent error handling
- Always converts to HTTPException for uniform response structure
- Single response format - no conditional response bodies
- Simpler logging with complete error object
- Prevents crashes from unhandled errors
- Improves debugging with proper logging using DI container logger

### 2. Health & Monitoring Endpoints

**Priority: High**

```typescript
// Simple health check endpoint
honoApp.get('/health', async (c) => {
  const logger = container.resolve(AppLogger);
  logger.debug('Health check requested');
  
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'memshelf-api'
  });
});
```

**Benefits:**
- Simple health check for basic service monitoring
- Essential for container orchestration health checks
- Uses logger from DI container

**Note:** `/ready` and `/metrics` endpoints are not included as they don't provide value for this specific use case.

### 3. Security Enhancements

**Priority: High**

```typescript
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono/rate-limiter';

// Security headers
honoApp.use('*', secureHeaders({
  contentSecurityPolicy: "default-src 'self'",
  crossOriginEmbedderPolicy: false, // Adjust based on needs
}));

// Rate limiting
honoApp.use('*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
}));
```

**Benefits:**
- Protects against common web vulnerabilities
- Prevents abuse and DoS attacks
- Adds security headers automatically

### 4. Logging Improvements

**Priority: Medium**

```typescript
// Enhanced structured logging middleware using DI container logger
// This replaces hono/logger middleware for consistent logging
honoApp.use('*', async (c, next) => {
  const logger = container.resolve(AppLogger);
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  c.set('requestId', requestId);
  
  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('user-agent'),
  }, 'Request started');

  await next();

  const duration = Date.now() - start;
  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  }, 'Request completed');
});
```

**Benefits:**
- Uses logger from DI container for consistency
- Structured logging for better observability
- Request correlation with unique IDs
- Performance monitoring with request timing
- **Note:** This replaces the basic `hono/logger` middleware - remove that when implementing this

### 5. API Structure & Organization

**Priority: Medium**

```typescript
// Organize routes with versioning
const apiV1 = new Hono();

// Group related routes
apiV1.route('/users', userRoutes);
apiV1.route('/auth', authRoutes);

// Mount versioned API
honoApp.route('/api/v1', apiV1);

// Add response schemas
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

// Validate responses (in development)
if (config.nodeEnv.isDevelopment) {
  honoApp.use('*', async (c, next) => {
    await next();
    // Validate response against schema
  });
}
```

**Benefits:**
- Better API organization and versioning
- Type-safe responses
- Easier maintenance and evolution

### 6. Configuration Enhancements

**Priority: Low**

**Extend existing `apiServer` configuration instead of creating new server config:**

```typescript
// Extend the existing apiServer configuration in createConfig.ts
apiServer: {
  hostname: process.env.API_SERVER_HOSTNAME ?? 'localhost',
  port: parseIntWithDefault(process.env.API_SERVER_PORT, 3000),
  timeout: parseIntWithDefault(process.env.API_SERVER_TIMEOUT, 30000),
  bodyLimit: parseIntWithDefault(process.env.API_SERVER_BODY_LIMIT, 1024 * 1024), // 1MB
  keepAliveTimeout: parseIntWithDefault(process.env.API_SERVER_KEEP_ALIVE_TIMEOUT, 5000),
  cors: {
    origins: parseCorsOrigins(process.env.API_SERVER_CORS_ORIGINS),
  },
  rateLimit: {
    windowMs: parseIntWithDefault(process.env.API_SERVER_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    maxRequests: parseIntWithDefault(process.env.API_SERVER_RATE_LIMIT_MAX_REQUESTS, 100),
  }
}
```

**Additional Environment Variables:**
```bash
# API Server Configuration (extends existing)
API_SERVER_TIMEOUT=30000
API_SERVER_BODY_LIMIT=1048576  # 1MB in bytes
API_SERVER_KEEP_ALIVE_TIMEOUT=5000
API_SERVER_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
API_SERVER_RATE_LIMIT_MAX_REQUESTS=100
```

**Benefits:**
- Extends existing `apiServer` configuration rather than creating duplicate
- Keeps all API server settings in one place
- Maintains consistent naming convention
- Configurable server behavior

**Corrected Approach:** Use the existing `apiServer` configuration structure instead of creating a separate server configuration.

### 7. Development Experience

**Priority: Low**

**Note:** This section has significant overlap with "Logging Improvements" section. The structured logging middleware in section 4 already provides request/response logging. 

**Option 1: Enhanced Debug Mode (extends the logging middleware)**
```typescript
// Add debug details to the existing logging middleware when in development
if (config.nodeEnv.isDevelopment) {
  // Extend the logging middleware from section 4 to include:
  logger.debug({
    requestId,
    method: c.req.method,
    path: c.req.path,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    query: c.req.query(),
    userAgent: c.req.header('user-agent'),
  }, '🔍 Detailed request info');
}
```

**Option 2: Separate Debug Middleware**
```typescript
// Additional debug-only middleware for development
if (config.nodeEnv.isDevelopment) {
  honoApp.use('*', async (c, next) => {
    const logger = container.resolve(AppLogger);
    const requestId = c.get('requestId'); // Get from logging middleware
    
    logger.debug({
      requestId,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
      query: c.req.query(),
    }, '🔍 Debug request details');
    
    await next();
    
    logger.debug({
      requestId,
      responseHeaders: Object.fromEntries(c.res.headers.entries()),
    }, '📤 Debug response details');
  });
}
```

**Benefits:**
- Uses logger from DI container instead of console.*
- Development-specific detailed logging
- Can extend existing logging middleware or work as separate middleware
- Structured debug logging that respects log levels

**Recommendation:** Choose Option 1 to avoid duplicate middleware and keep things simple.

### 8. Production Readiness

**Priority: Medium**

```typescript
// Graceful shutdown handling
const server = serve({
  port,
  hostname,
  fetch: honoApp.fetch,
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.stop();
  process.exit(0);
});

// Startup dependency checks
async function validateDependencies() {
  try {
    // Test database connection
    const dataSource = container.resolve(DataSource);
    await dataSource.query('SELECT 1');
    
    // Test Redis connection  
    const redis = container.resolve(AppRedis);
    await redis.ping();
    
    logger.info('All dependencies validated successfully');
  } catch (error) {
    logger.error(error, 'Dependency validation failed');
    process.exit(1);
  }
}

await validateDependencies();
```

**Benefits:**
- Proper container lifecycle management
- Prevents startup with broken dependencies
- Graceful handling of shutdown signals

## Implementation Priority

1. **High Priority** (Essential for production):
   - Error handling & middleware
   - Health & monitoring endpoints
   - Security enhancements

2. **Medium Priority** (Improves maintainability):
   - Logging improvements (replaces hono/logger)
   - Production readiness

3. **Low Priority** (Nice to have):
   - Configuration enhancements (extend apiServer config)
   - Development experience improvements (avoid duplication with logging)
   - API structure & organization (implement after creating types)

## Dependencies to Add

```json
{
  "dependencies": {
    "@hono/zod-validator": "^0.2.0",
    "zod": "^3.22.0"
  }
}
```

## Files to Create/Modify

- `src/middleware/error-handler.ts` - Global error handling
- `src/middleware/security.ts` - Security middleware
- `src/middleware/logging.ts` - Structured logging middleware
- `src/routes/health.ts` - Health check endpoints
- `src/routes/api/v1/index.ts` - Versioned API routes
- `src/config.ts` - Extended configuration
- `src/index.ts` - Updated with graceful shutdown

## Notes

- These are suggestions - implement what makes sense for your specific use case
- Start with high-priority items for immediate production benefits
- Consider your deployment environment when implementing graceful shutdown
- Adjust security policies based on your API's specific requirements