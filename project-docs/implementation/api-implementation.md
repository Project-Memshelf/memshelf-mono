# Memshelf API Implementation Plan

> **AI Agent Instructions**: You are tasked with implementing a complete REST API for Memshelf, a knowledge management system. This document provides comprehensive implementation details, including architecture patterns, authentication requirements, route specifications, and business logic organization. Follow the patterns established in the existing codebase and leverage the robust database services and Zod validation schemas already available.

## Project Context & Architecture

### Current State
** Completed Infrastructure:**
- Hono web server with middleware, CORS, logging, and error handling (`apps/api/src/http-server.ts`)
- Comprehensive database services extending `BaseDbService` with full CRUD operations
- Complete TypeORM entities with Zod integration for all data models
- Auto-generated Zod schemas and TypeScript types (`packages/database/src/entity-schema-types.ts`)
- Dependency injection container with TSyringe integration
- Structured error handling with HTTPException support

**=� Needs Implementation:**
- API key authentication middleware and user resolution
- Complete REST endpoints for all entities (Notes, Workspaces, Tags, Links, Diffs)
- Request/response validation using existing Zod schemas
- Business logic integration with database services
- Permission-based access control for workspace operations

### Key Architecture Principles
1. **Database-First**: All business logic resides in `packages/database/src/services/*DbService.ts` 
2. **Type Safety**: Use generated Zod schemas from `entity-schema-types.ts` for all validation
3. **Dependency Injection**: Leverage existing TSyringe container for service resolution
4. **Error Handling**: Use Hono's HTTPException for consistent error responses
5. **Middleware Pattern**: Implement authentication and validation as reusable middleware
6. **Permission-Based**: Workspace access controls using `UserPermissionEntity` relationships

## Phase 1: Authentication & Middleware

### 1.1 API Key Authentication Middleware

**File: `apps/api/src/middleware/auth.ts`**

Create authentication middleware that:
- Extracts API key from `Authorization: Bearer <key>` header
- Validates API key format (32-64 character string from database schema)
- Resolves `UserEntity` using `UsersDbService.findOne({ apiKey })`
- Adds resolved user to Hono context variables for downstream use
- Returns 401 with standard error format for invalid/missing keys

**Context Variables to Add:**
```typescript
type AuthEnv = {
    Variables: {
        requestId: string;
        currentUser: UserEntity; // Add authenticated user
    };
};
```

**Error Response Format:**
```json
{
    "error": {
        "code": 401,
        "message": "Invalid or missing API key",
        "timestamp": "2025-09-06T..."
    }
}
```

### 1.2 Permission Validation Middleware

**File: `apps/api/src/middleware/permissions.ts`**

Create workspace permission middleware that:
- Checks if current user has access to specified workspace
- Uses `UserPermissionEntity` relationships via database services
- Validates read vs write permissions based on operation type
- Returns 403 for insufficient permissions
- Supports both URL parameter and request body workspace resolution

**Usage Pattern:**
```typescript
// Read permission required
app.get('/api/v1/workspaces/:workspaceId/notes', 
    authMiddleware,
    requireWorkspacePermission('read'),
    notesController.listByWorkspace
);

// Write permission required  
app.post('/api/v1/notes',
    authMiddleware,
    requireWorkspacePermission('write'), // checks workspace in request body
    notesController.create
);
```

## Phase 2: Core API Routes

### 2.1 Notes API (`/api/v1/notes`)

**File: `apps/api/src/routes/notes.ts`**

**Business Logic**: Use `NotesDbService` with the following methods from `BaseDbService`:
- `findById()` - Get single note
- `findPaginated()` - List with pagination 
- `save()` - Create new note
- `update()` - Update existing note
- `softDelete()` - Soft delete note

**Key Implementation Details:**

**GET /api/v1/notes**
- Query parameters: `page`, `limit`, `workspaceId`, `search`, `tags`
- Use `NotesDbService.findPaginated()` with workspace filtering
- Return paginated response format from API schema
- Validate user has read access to requested workspace(s)

**GET /api/v1/notes/:id**
- Validate note exists using `NotesDbService.findById()`
- Check user has read permission for note's workspace
- Return complete note data with relationships

**POST /api/v1/notes**
- Validate request body using `NoteSchemas.create` from `entity-schema-types.ts`
- Check user has write permission for target workspace
- Use `NotesDbService.save()` to create note
- Auto-set initial version to 1
- Return created note with 201 status

**PUT /api/v1/notes/:id**
- Validate request body using `NoteSchemas.update`
- Check note exists and user has write permission
- Use `NotesDbService.update()` for content updates
- Handle version increment for content changes
- Return updated note data

**DELETE /api/v1/notes/:id**
- Validate note exists and user has write permission
- Use `NotesDbService.softDelete()` for soft deletion
- Return 204 No Content on success

### 2.2 Workspaces API (`/api/v1/workspaces`)

**File: `apps/api/src/routes/workspaces.ts`**

**Business Logic**: Use `WorkspacesDbService` and `UserPermissionEntity` for access control.

**GET /api/v1/workspaces**
- Return only workspaces where current user has permissions
- Join with `UserPermissionEntity` to filter accessible workspaces
- Include permission level (read/write) in response

**POST /api/v1/workspaces** 
- Validate using `WorkspaceSchemas.create`
- Create workspace using `WorkspacesDbService.save()`
- Automatically create `UserPermissionEntity` with write access for creator
- Return created workspace with permissions

**GET /api/v1/workspaces/:id**
- Validate user has read access to workspace
- Return workspace details with user's permission level

**PUT /api/v1/workspaces/:id**
- Validate using `WorkspaceSchemas.update`
- Check user has write permission
- Update using `WorkspacesDbService.update()`

**DELETE /api/v1/workspaces/:id**
- Check user has write permission
- Use `WorkspacesDbService.softDelete()`
- Note: Cascade deletion will be handled by database constraints

### 2.3 Tags API (`/api/v1/tags`)

**File: `apps/api/src/routes/tags.ts`**

**Business Logic**: Use `TagsDbService` with workspace-scoped tag management.

**GET /api/v1/tags**
- Query parameter: `workspaceId` (optional)
- Return tags available in accessible workspaces
- Filter by `WorkspaceTagEntity` relationships if workspace specified

**GET /api/v1/workspaces/:workspaceId/tags**
- Return tags available in specific workspace
- Check user has read access to workspace
- Use `WorkspaceTagEntity` relationships

**POST /api/v1/tags**
- Validate using `TagSchemas.create`
- Create global tag using `TagsDbService.save()`
- Require admin permissions or workspace-specific creation

**POST /api/v1/workspaces/:workspaceId/tags**
- Create workspace-specific tag availability
- Create `WorkspaceTagEntity` relationship
- Check user has write permission for workspace

### 2.4 Note Tags API (`/api/v1/notes/:noteId/tags`)

**File: `apps/api/src/routes/note-tags.ts`**

**Business Logic**: Manage `NoteTagEntity` relationships.

**GET /api/v1/notes/:noteId/tags**
- Return tags applied to specific note
- Check user has read access to note's workspace

**POST /api/v1/notes/:noteId/tags**
- Request body: `{ tagId: string }`
- Validate tag exists and is available in note's workspace
- Create `NoteTagEntity` relationship
- Check user has write permission

**DELETE /api/v1/notes/:noteId/tags/:tagId**
- Remove `NoteTagEntity` relationship
- Check user has write permission for note

### 2.5 Links API (`/api/v1/links`)

**File: `apps/api/src/routes/links.ts`**

**Business Logic**: Use `LinksDbService` for inter-note relationships.

**GET /api/v1/notes/:noteId/links**
- Return both incoming and outgoing links for a note
- Filter by user's workspace access permissions

**POST /api/v1/links**
- Request body validated with `LinkSchemas.create`
- Validate both source and target notes exist and user has access
- Create link using `LinksDbService.save()`

**DELETE /api/v1/links/:linkId**
- Validate link exists and user has write access to source note
- Use `LinksDbService.softDelete()`

### 2.6 Diffs API (`/api/v1/notes/:noteId/diffs`)

**File: `apps/api/src/routes/diffs.ts`**

**Business Logic**: Use `DiffsDbService` for note version history.

**GET /api/v1/notes/:noteId/diffs**
- Return diff history for a note
- Support pagination for large histories
- Check user has read access to note

**POST /api/v1/notes/:noteId/diffs**
- Apply diff to note content
- Validate diff format using `DiffSchemas.create`
- Update note content and increment version
- Store diff record using `DiffsDbService.save()`

## Phase 3: Request/Response Validation

### 3.1 Validation Middleware

**File: `apps/api/src/middleware/validation.ts`**

Create reusable validation middleware that:
- Accepts Zod schema as parameter
- Validates request body, query parameters, or path parameters
- Returns 400 with validation errors in consistent format
- Integrates with existing Zod schemas from `entity-schema-types.ts`

**Usage Example:**
```typescript
app.post('/api/v1/notes',
    authMiddleware,
    validateBody(NoteSchemas.create),
    notesController.create
);
```

### 3.2 Response Formatting

**File: `apps/api/src/utils/responses.ts`**

Create response helper functions that:
- Format success responses with consistent structure
- Include pagination metadata when applicable  
- Add API version and timestamp to all responses
- Handle error responses with proper HTTP status codes

**Helper Functions:**
- `successResponse(data, meta?)` - Standard success format
- `paginatedResponse(data, pagination, meta?)` - Paginated data format
- `errorResponse(error, code, message, details?)` - Error format

## Phase 4: Business Logic Integration

### 4.1 Controller Pattern

**Directory: `apps/api/src/controllers/`**

Create controller classes that:
- Handle HTTP request/response logic only
- Delegate all business logic to database services
- Use dependency injection to resolve services
- Follow consistent error handling patterns

**Example Controller Structure:**
```typescript
@singleton()
export class NotesController {
    constructor(
        @inject(NotesDbService) private notesService: NotesDbService,
        @inject(WorkspacesDbService) private workspacesService: WorkspacesDbService
    ) {}

    async create(c: Context) {
        const currentUser = c.get('currentUser');
        const noteData = c.req.valid('body'); // From validation middleware
        
        // Business logic through service
        const note = await this.notesService.save({
            ...noteData,
            version: 1
        });
        
        return c.json(successResponse(note), 201);
    }
}
```

### 4.2 Service Integration

**Key Service Methods to Use:**

**From BaseDbService (inherited by all services):**
- `findById(id, options?)` - Get single entity with optional relations
- `findPaginated(options)` - Paginated queries with filtering
- `save(entity)` - Create new entities
- `update(id, data)` - Update existing entities
- `softDelete(id)` - Soft deletion with `deletedAt` timestamp

**Custom Service Methods to Add:**

**NotesDbService additions:**
```typescript
async findByWorkspace(workspaceId: string, options?: PaginationOptions) {
    // Filter notes by workspace with pagination
}

async findWithTags(noteId: string) {
    // Get note with tag relationships loaded
}
```

**UsersDbService additions:**
```typescript
async findByApiKey(apiKey: string): Promise<UserEntity | null> {
    // User lookup for authentication
}

async getUserWorkspaces(userId: string) {
    // Get workspaces accessible to user
}
```

## Phase 5: Error Handling & Logging

### 5.1 Error Categories

**Validation Errors (400)**
- Invalid request body format
- Missing required fields
- Invalid data types or constraints

**Authentication Errors (401)**
- Missing API key
- Invalid API key format
- Expired or revoked API key

**Authorization Errors (403)**
- Insufficient workspace permissions
- Access denied for specific resources

**Not Found Errors (404)**
- Entity does not exist
- Invalid entity ID format

**Business Logic Errors (422)**
- Invalid state transitions
- Conflicting operations
- Data integrity violations

### 5.2 Logging Strategy

Use existing structured logging from `http-server.ts`:
- Request/response logging with request IDs
- Error logging with context information
- Debug logging for development troubleshooting
- Performance metrics (response times)

## Phase 6: Testing Strategy

### 6.1 Unit Tests
- Controller logic with mocked services
- Middleware functionality (auth, validation, permissions)
- Response formatting utilities
- Business logic in database services

### 6.2 Integration Tests  
- Full API endpoints with test database
- Authentication flows with test API keys
- Permission validation across workspaces
- Database transaction integrity

### 6.3 Test Data
Use existing seed data from migration `1757175127501-Seed.ts`:
- Test users with predictable API keys
- Sample workspaces with different permission levels
- Notes with various content types and relationships

## Implementation Checklist

### Phase 1: Foundation �
- [ ] Create authentication middleware with user resolution
- [ ] Create permission validation middleware  
- [ ] Extend Hono context types for authenticated user
- [ ] Create validation middleware for request bodies
- [ ] Create response formatting utilities

### Phase 2: Core Endpoints �
- [ ] Implement Notes API with full CRUD operations
- [ ] Implement Workspaces API with permission management
- [ ] Implement Tags API with workspace scoping
- [ ] Implement Note-Tags relationship management
- [ ] Implement Links API for inter-note relationships
- [ ] Implement Diffs API for version history

### Phase 3: Business Logic �
- [ ] Create controller classes with dependency injection
- [ ] Extend database services with API-specific methods
- [ ] Implement workspace permission checking logic
- [ ] Add comprehensive error handling and logging
- [ ] Validate all responses match API schema documentation

### Phase 4: Testing & Validation �
- [ ] Write unit tests for middleware and controllers
- [ ] Create integration tests for complete API flows
- [ ] Test authentication and authorization scenarios
- [ ] Validate API responses against schema documentation
- [ ] Performance testing with realistic data volumes

## Success Criteria

** Complete Implementation Includes:**
1. All REST endpoints from `api-schema.md` are functional
2. API key authentication works with existing seed data
3. Workspace permissions are properly enforced
4. All request/response data is validated with Zod schemas
5. Business logic is properly separated in database services
6. Comprehensive error handling with consistent response formats
7. Integration tests pass with 90%+ coverage
8. API responds within 200ms for typical operations
9. Proper logging and monitoring for production deployment
10. Complete documentation updates reflecting implementation

**=� Ready for Production:**
- API handles concurrent requests safely
- Database connections are properly managed
- Error scenarios return helpful, secure responses
- Performance meets specified requirements
- Code follows established patterns and conventions
- All tests pass in CI/CD pipeline

---

**Implementation Notes:**
- Follow existing code patterns in `apps/api/src/`
- Use TypeScript strict mode throughout
- Leverage existing database services and Zod schemas
- Maintain consistency with current middleware and error handling
- Test thoroughly with seed data before declaring complete