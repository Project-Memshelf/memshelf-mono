# OpenAPI Integration Plan for Memshelf API

> **Implementation Roadmap**: Comprehensive plan for integrating OpenAPI specification generation and interactive documentation

## Overview

This document outlines the strategy for enhancing the Memshelf API with auto-generated OpenAPI specifications, interactive documentation, and client SDK generation capabilities.

## Current State Analysis

### ✅ **Existing Foundation**
- **Hono Web Framework** - Modern, fast TypeScript framework
- **Zod Schema Validation** - Runtime validation with type inference
- **Generated Types** - Auto-generated TypeScript types from Zod schemas (`entity-schema-types.ts`)
- **Structured Controllers** - Clean separation with consistent response patterns
- **Bearer Authentication** - API key-based authentication middleware

### ✅ **Implementation-Ready Components**
- **Request/Response Validation** - All endpoints use Zod schemas
- **Consistent Response Format** - Standardized success/error/pagination responses
- **Type Safety** - Full TypeScript coverage with strict types
- **Error Handling** - Consistent HTTPException patterns

## Phase 1: OpenAPI Foundation Setup

### **1.1 Install Dependencies**
```bash
# Core OpenAPI integration
bun add @hono/zod-openapi @hono/swagger-ui

# Development utilities
bun add --dev openapi-types
```

### **1.2 Update Route Definitions**
Transform existing route handlers to include OpenAPI metadata.

**Current Pattern:**
```typescript
// Current implementation
v1Routes.get('/notes', (c) => notesController.list(c));
```

**OpenAPI Pattern:**
```typescript
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

const listNotesRoute = createRoute({
  method: 'get',
  path: '/notes',
  request: {
    query: z.object({
      workspaceId: z.string().uuid().openapi({
        description: 'UUID of the workspace',
        example: '00000000-0000-4000-8000-000000000011'
      }),
      page: z.string().optional().openapi({
        description: 'Page number for pagination',
        example: '1'
      }),
      limit: z.string().optional().openapi({
        description: 'Items per page',
        example: '10'
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PaginatedNotesResponseSchema.openapi({
            description: 'List of notes in workspace'
          }),
        },
      },
      description: 'Successfully retrieved notes',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Bad request - workspaceId required',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required',
    },
    403: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Forbidden - no workspace access',
    },
  },
  security: [{ bearerAuth: [] }],
  tags: ['Notes'],
});

// Register route with handler
app.openapi(listNotesRoute, (c) => notesController.list(c));
```

### **1.3 Create Response Schema Definitions**

**File: `apps/api/src/schemas/responses.ts`**
```typescript
import { z } from 'zod';
import { 
  NoteSchemas, 
  WorkspaceSchemas, 
  TagSchemas,
  LinkSchemas,
  DiffSchemas 
} from '@repo/database';

// Success response wrapper
const createSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
      version: z.string().default('1.0.0'),
    }),
  });

// Pagination response wrapper
const createPaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().positive(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    meta: z.object({
      timestamp: z.string().datetime(),
      version: z.string().default('1.0.0'),
    }),
  });

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    timestamp: z.string().datetime(),
  }),
});

// Specific response schemas
export const NoteResponseSchema = createSuccessSchema(NoteSchemas.full);
export const PaginatedNotesResponseSchema = createPaginatedSchema(NoteSchemas.full);
export const WorkspaceResponseSchema = createSuccessSchema(WorkspaceSchemas.full);
export const PaginatedWorkspacesResponseSchema = createPaginatedSchema(WorkspaceSchemas.full);
// ... additional schemas
```

### **1.4 Update Application Structure**

**File: `apps/api/src/app.ts`** (New OpenAPI app)
```typescript
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';

const app = new OpenAPIHono();

// Apply CORS and other middleware
app.use('*', cors());

// Security scheme definition
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'API Key',
  description: 'API key authentication using Bearer token',
});

// API info
app.doc('/api/v1/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Memshelf API',
    description: 'RESTful API for knowledge management and note organization',
    contact: {
      name: 'Memshelf API Support',
      url: 'https://github.com/memshelf/api',
    },
  },
  servers: [
    {
      url: 'http://localhost:4001',
      description: 'Development server',
    },
    {
      url: 'https://api.memshelf.com',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Notes', description: 'Note management operations' },
    { name: 'Workspaces', description: 'Workspace management operations' },
    { name: 'Tags', description: 'Tag management operations' },
    { name: 'Links', description: 'Inter-note link operations' },
    { name: 'Diffs', description: 'Version control and diff operations' },
  ],
});

// Swagger UI
app.get('/api/v1/docs', swaggerUI({ 
  url: '/api/v1/openapi.json',
  config: {
    persistAuthorization: true,
    tryItOutEnabled: true,
  },
}));

export { app };
```

## Phase 2: Route Migration Strategy

### **2.1 Migration Priority Order**
1. **Notes endpoints** (5 routes) - Core functionality
2. **Workspaces endpoints** (5 routes) - Workspace management  
3. **Tags endpoints** (3 routes) - Tagging system
4. **Note-Tags endpoints** (3 routes) - Relationship management
5. **Links endpoints** (3 routes) - Inter-note relationships
6. **Diffs endpoints** (2 routes) - Version control

### **2.2 Route Definition Pattern**

**Template for each endpoint:**
```typescript
const routeDefinition = createRoute({
  method: 'get|post|put|delete',
  path: '/endpoint-path',
  request: {
    // Path parameters
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Resource UUID',
        example: '00000000-0000-4000-8000-000000000001'
      }),
    }).optional(),
    
    // Query parameters
    query: z.object({
      workspaceId: z.string().uuid().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }).optional(),
    
    // Request body
    body: {
      content: {
        'application/json': {
          schema: CreateResourceSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ResourceResponseSchema,
        },
      },
      description: 'Operation successful',
    },
    // ... error responses
  },
  security: [{ bearerAuth: [] }],
  tags: ['ResourceType'],
});
```

### **2.3 Schema Integration Points**

**Leverage Existing Zod Schemas:**
```typescript
// Import from existing entity schemas
import {
  validateCreateNote,
  validateUpdateNote,
  NoteSchemas,
} from '@repo/database';

// Use in route definitions
const createNoteRoute = createRoute({
  // ...
  request: {
    body: {
      content: {
        'application/json': {
          schema: NoteSchemas.create, // Direct usage
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: createSuccessSchema(NoteSchemas.full),
        },
      },
    },
  },
});
```

## Phase 3: Enhanced Documentation Features

### **3.1 Interactive Documentation**

**Swagger UI Configuration:**
```typescript
app.get('/api/v1/docs', swaggerUI({ 
  url: '/api/v1/openapi.json',
  config: {
    // Enhanced UI features
    persistAuthorization: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    
    // Custom styling
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2196F3; }
    `,
  },
}));
```

### **3.2 Code Examples Generation**

**Add examples to schema definitions:**
```typescript
const NoteCreateExample = {
  workspaceId: '00000000-0000-4000-8000-000000000011',
  title: 'Meeting Notes - Project Alpha',
  content: '# Meeting Summary\n\n- Discussed project roadmap\n- Next steps defined',
};

const createNoteSchema = NoteSchemas.create.openapi({
  description: 'Note creation data',
  example: NoteCreateExample,
});
```

### **3.3 Response Examples**

**Add realistic response examples:**
```typescript
const listNotesRoute = createRoute({
  // ...
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PaginatedNotesResponseSchema,
          example: {
            success: true,
            data: [
              {
                id: '00000000-0000-4000-8000-000000000036',
                workspaceId: '00000000-0000-4000-8000-000000000011',
                title: 'Database Schema Design',
                content: '# Database Schema Overview...',
                version: 1,
                createdAt: '2025-09-06T16:36:03.000Z',
                updatedAt: '2025-09-06T16:36:03.000Z',
                deletedAt: null,
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 3,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            meta: {
              timestamp: '2025-09-07T01:25:00.000Z',
              version: '1.0.0',
            },
          },
        },
      },
      description: 'Successfully retrieved notes',
    },
  },
});
```

## Phase 4: Client SDK Generation

### **4.1 SDK Generation Setup**

**Install SDK generators:**
```bash
# OpenAPI client generators
bun add --dev @openapitools/openapi-generator-cli

# Alternative: swagger-codegen
npm install -g swagger-codegen-cli
```

### **4.2 SDK Generation Scripts**

**File: `scripts/generate-clients.sh`**
```bash
#!/bin/bash

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:4001/api/v1/openapi.json \
  -g typescript-fetch \
  -o clients/typescript \
  --additional-properties=typescriptThreePlus=true

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:4001/api/v1/openapi.json \
  -g python \
  -o clients/python \
  --additional-properties=packageName=memshelf_client

# Generate Go client
openapi-generator-cli generate \
  -i http://localhost:4001/api/v1/openapi.json \
  -g go \
  -o clients/go \
  --additional-properties=packageName=memshelf
```

### **4.3 Client Configuration**

**TypeScript Client Configuration:**
```json
{
  "generatorName": "typescript-fetch",
  "outputDir": "./clients/typescript",
  "inputSpec": "./openapi.json",
  "additionalProperties": {
    "typescriptThreePlus": true,
    "supportsES6": true,
    "npmName": "@memshelf/api-client",
    "npmVersion": "1.0.0"
  }
}
```

## Phase 5: Testing and Validation

### **5.1 Schema Validation Testing**

**Test OpenAPI spec generation:**
```typescript
// Test file: tests/openapi.test.ts
describe('OpenAPI Specification', () => {
  it('should generate valid OpenAPI 3.0 spec', async () => {
    const response = await app.request('/api/v1/openapi.json');
    const spec = await response.json();
    
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('Memshelf API');
    expect(spec.paths).toBeDefined();
  });

  it('should include all implemented endpoints', async () => {
    const response = await app.request('/api/v1/openapi.json');
    const spec = await response.json();
    
    // Verify all endpoints are documented
    expect(spec.paths['/notes']).toBeDefined();
    expect(spec.paths['/workspaces']).toBeDefined();
    expect(spec.paths['/tags']).toBeDefined();
    // ... additional assertions
  });
});
```

### **5.2 Client Generation Testing**

**Automated client testing:**
```bash
# Test script for client generation
#!/bin/bash

# Start API server
bun run dev &
API_PID=$!

# Wait for server to start
sleep 5

# Generate clients
./scripts/generate-clients.sh

# Test TypeScript client
cd clients/typescript
npm install
npm run build
npm run test

# Cleanup
kill $API_PID
```

## Phase 6: Deployment and Maintenance

### **6.1 CI/CD Integration**

**GitHub Actions workflow:**
```yaml
name: OpenAPI Documentation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Start API server
        run: bun run dev &
        
      - name: Generate OpenAPI spec
        run: |
          sleep 10
          curl http://localhost:4001/api/v1/openapi.json > openapi.json
          
      - name: Validate OpenAPI spec
        run: bun run validate-openapi
        
      - name: Generate client SDKs
        run: ./scripts/generate-clients.sh
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: api-clients
          path: clients/
```

### **6.2 Documentation Hosting**

**Options for hosting documentation:**

1. **GitHub Pages** - Host static Swagger UI
2. **Netlify/Vercel** - Deploy generated documentation
3. **Self-hosted** - Serve from API server at `/docs`

### **6.3 Versioning Strategy**

**API versioning considerations:**
```typescript
// Version-specific route groups
const v1Routes = new OpenAPIHono().basePath('/api/v1');
const v2Routes = new OpenAPIHono().basePath('/api/v2');

// Separate OpenAPI specs per version
app.doc('/api/v1/openapi.json', { 
  info: { version: '1.0.0' } 
});
app.doc('/api/v2/openapi.json', { 
  info: { version: '2.0.0' } 
});
```

## Implementation Timeline

### **Week 1: Foundation**
- Install dependencies
- Set up basic OpenAPI structure  
- Migrate 2-3 core endpoints (Notes, Workspaces)

### **Week 2: Route Migration**
- Complete all endpoint migrations
- Add comprehensive examples
- Set up Swagger UI

### **Week 3: Enhancement**
- Client SDK generation
- Testing infrastructure
- Documentation improvements

### **Week 4: Integration**
- CI/CD pipeline setup
- Performance optimization
- Production deployment

## Benefits After Implementation

### **Developer Experience**
- ✅ **Interactive Documentation** - Test endpoints directly in browser
- ✅ **Auto-generated Clients** - SDK generation for multiple languages
- ✅ **Type Safety** - Generated types match API exactly
- ✅ **Always Up-to-date** - Documentation synced with code

### **API Quality**
- ✅ **Contract-first Development** - Clear API contracts
- ✅ **Validation** - Request/response validation against schemas
- ✅ **Consistency** - Standardized response formats
- ✅ **Discoverability** - Self-documenting API

### **Integration Benefits**
- ✅ **AI Agent Friendly** - Machine-readable API specifications
- ✅ **Third-party Integration** - Easy SDK generation for partners
- ✅ **Testing** - Contract testing against OpenAPI spec
- ✅ **Monitoring** - API usage analytics and validation

## Migration Risks and Mitigation

### **Potential Issues**
- **Breaking Changes** - Existing integrations may break
- **Performance Impact** - Additional middleware overhead
- **Maintenance Overhead** - Need to maintain OpenAPI specs

### **Mitigation Strategies**
- **Gradual Migration** - Migrate routes incrementally
- **Backward Compatibility** - Keep existing routes during transition
- **Performance Testing** - Benchmark before/after migration
- **Automated Testing** - Ensure schemas stay in sync with code

## Conclusion

The OpenAPI integration will significantly enhance the Memshelf API's developer experience and integration capabilities. The phased approach ensures minimal disruption while maximizing benefits for both internal development and external API consumers.

The implementation leverages existing Zod schemas and TypeScript types, making the migration straightforward while providing powerful documentation and client generation capabilities.

---

**Next Steps:**
1. Review and approve this implementation plan
2. Set up development branch for OpenAPI integration
3. Begin Phase 1 implementation with core route migration
4. Iterate based on feedback and testing results