# Error Handling Standards

## Overview

Memshelf implements **consistent, informative error handling** across all API endpoints using standardized response formats, detailed error codes, and comprehensive logging for debugging and monitoring.

---

## Standard Error Response Format

### Error Response Structure
```json
{
  "success": false,
  "error": "error_type",
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation details",
    "context": "additional context"
  },
  "meta": {
    "timestamp": "2025-09-01T12:00:00Z",
    "version": "1.0.0",
    "request_id": "req_1234567890abcdef"
  }
}
```

### Response Fields
- **success**: Always `false` for error responses
- **error**: Short error type identifier (snake_case)
- **message**: Human-readable error description
- **code**: Unique error code for programmatic handling
- **details**: Optional object with additional error context
- **meta**: Request metadata including timestamp and request ID

---

## HTTP Status Code Standards

### Success Codes
- **200 OK**: Successful GET, PATCH operations
- **201 Created**: Successful POST operations
- **204 No Content**: Successful DELETE operations

### Client Error Codes (4xx)
- **400 Bad Request**: Invalid request format or validation errors
- **401 Unauthorized**: Authentication required or invalid API key
- **403 Forbidden**: Authenticated but insufficient permissions
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource conflict (version mismatch, duplicate)
- **422 Unprocessable Entity**: Valid format but semantic errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes (5xx)
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: External service unavailable
- **503 Service Unavailable**: Temporary service outage
- **504 Gateway Timeout**: External service timeout

---

## Error Code Categories

### Authentication Errors (AUTH_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| AUTH_001 | 401 | Invalid or missing API key | Check Authorization header format |
| AUTH_002 | 401 | API key expired | Generate new API key |
| AUTH_003 | 401 | API key revoked | Contact administrator |
| AUTH_004 | 403 | Insufficient permissions | Request access to resource |

### Validation Errors (VALIDATION_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| VALIDATION_001 | 400 | Invalid request data | Check request format |
| VALIDATION_002 | 400 | Missing required field | Include all required fields |
| VALIDATION_003 | 400 | Invalid field format | Check field constraints |
| VALIDATION_004 | 400 | Invalid UUID format | Use valid UUID v4 format |
| VALIDATION_005 | 413 | Request too large | Reduce content size |

### Note Errors (NOTE_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| NOTE_001 | 404 | Note not found | Verify note ID exists |
| NOTE_002 | 403 | Access denied to workspace | Request workspace access |
| NOTE_003 | 400 | Invalid workspace ID | Use valid workspace UUID |
| NOTE_004 | 403 | Workspace access denied | Contact workspace owner |
| NOTE_005 | 409 | Version conflict | Fetch latest version and retry |
| NOTE_006 | 400 | Invalid diff position/length | Check diff boundaries |
| NOTE_007 | 413 | Content size limit exceeded | Reduce content size |

### Workspace Errors (WORKSPACE_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| WORKSPACE_001 | 404 | Workspace not found | Verify workspace ID |
| WORKSPACE_002 | 403 | Workspace access denied | Request access |
| WORKSPACE_003 | 409 | Workspace name exists | Use unique workspace name |
| WORKSPACE_004 | 400 | Invalid workspace data | Check required fields |

### Search Errors (SEARCH_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| SEARCH_001 | 503 | Search service unavailable | Try again later |
| SEARCH_002 | 400 | Invalid search query | Check query format |
| SEARCH_003 | 400 | Invalid search filters | Verify filter syntax |

### Rate Limiting Errors (RATE_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| RATE_001 | 429 | Rate limit exceeded | Wait for reset time |
| RATE_002 | 429 | Too many concurrent requests | Reduce concurrency |

### Server Errors (SERVER_xxx)
| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| SERVER_001 | 500 | Internal server error | Contact support |
| SERVER_002 | 502 | Database unavailable | Try again later |
| SERVER_003 | 502 | Search service unavailable | Try again later |
| SERVER_004 | 504 | Request timeout | Retry with smaller request |

---

## Validation Error Details

### Field-Level Validation
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Request validation failed",
  "code": "VALIDATION_001",
  "details": {
    "errors": [
      {
        "field": "title",
        "message": "Title must be between 1 and 500 characters",
        "received": "",
        "expected": "string(1-500)"
      },
      {
        "field": "workspace_id", 
        "message": "Invalid UUID format",
        "received": "invalid-uuid",
        "expected": "uuid"
      }
    ]
  }
}
```

### Zod Schema Validation
```typescript
import { z } from 'zod';

const CreateNoteSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().max(1_000_000).optional().default(''),
  workspace_id: z.string().uuid(),
  tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).optional()
});

function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError({
        code: 'VALIDATION_001',
        message: 'Request validation failed',
        details: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
            expected: err.expected
          }))
        }
      });
    }
    throw error;
  }
}
```

---

## Error Classes & Handling

### Custom Error Classes
```typescript
abstract class AppError extends Error {
  abstract code: string;
  abstract httpStatus: number;
  
  constructor(
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
  
  toResponse() {
    return {
      success: false,
      error: this.name.replace(/Error$/, '').toLowerCase(),
      message: this.message,
      code: this.code,
      details: this.details,
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
        request_id: this.getRequestId()
      }
    };
  }
  
  private getRequestId(): string {
    // Get request ID from async context or generate
    return Math.random().toString(36).substring(2, 15);
  }
}

class ValidationError extends AppError {
  code = 'VALIDATION_001';
  httpStatus = 400;
}

class AuthenticationError extends AppError {
  code = 'AUTH_001';
  httpStatus = 401;
}

class AuthorizationError extends AppError {
  code = 'AUTH_004';
  httpStatus = 403;
}

class NotFoundError extends AppError {
  code = 'NOTE_001';
  httpStatus = 404;
}

class ConflictError extends AppError {
  code = 'NOTE_005';
  httpStatus = 409;
}

class RateLimitError extends AppError {
  code = 'RATE_001';
  httpStatus = 429;
  
  constructor(
    message: string,
    public resetTime: Date,
    public limit: number,
    public remaining: number
  ) {
    super(message, {
      reset_at: resetTime.toISOString(),
      limit,
      remaining
    });
  }
}
```

### Global Error Handler
```typescript
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(error: Error, c: Context) {
  // Log error for debugging
  const requestId = c.get('requestId') || Math.random().toString(36);
  
  logger.error('Request error', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: c.req.path,
    method: c.req.method,
    user: c.get('user')?.id
  });
  
  // Handle known error types
  if (error instanceof AppError) {
    return c.json(error.toResponse(), error.httpStatus);
  }
  
  if (error instanceof HTTPException) {
    return c.json({
      success: false,
      error: 'http_exception',
      message: error.message,
      code: `HTTP_${error.status}`,
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
        request_id: requestId
      }
    }, error.status);
  }
  
  // Handle database errors
  if (error.name === 'QueryFailedError') {
    return handleDatabaseError(error, c, requestId);
  }
  
  // Generic server error
  return c.json({
    success: false,
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
    code: 'SERVER_001',
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
      request_id: requestId
    }
  }, 500);
}

function handleDatabaseError(error: any, c: Context, requestId: string) {
  // Map common database errors
  if (error.code === '23505') { // Unique constraint violation
    return c.json({
      success: false,
      error: 'conflict',
      message: 'Resource already exists',
      code: 'WORKSPACE_003',
      details: { constraint: error.constraint },
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
        request_id: requestId
      }
    }, 409);
  }
  
  if (error.code === '23503') { // Foreign key violation
    return c.json({
      success: false,
      error: 'not_found',
      message: 'Referenced resource not found',
      code: 'NOTE_003',
      details: { constraint: error.constraint },
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
        request_id: requestId
      }
    }, 404);
  }
  
  // Generic database error
  return c.json({
    success: false,
    error: 'database_error',
    message: 'Database operation failed',
    code: 'SERVER_002',
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
      request_id: requestId
    }
  }, 502);
}
```

---

This comprehensive error handling system ensures **consistent error responses**, **detailed debugging information**, and **robust error recovery** across all Memshelf API endpoints, providing excellent developer experience and system reliability.