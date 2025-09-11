# API Routes Refactor Plan - Iterative Approach

## Overview

This document outlines the iterative plan to refactor the API routes from a flat structure with manual workspace validation to a nested structure with middleware-based permission handling.

## Current State Issues

### 1. Inconsistent Route Patterns
- Notes endpoints use workspaceId as query parameter: `/notes?workspaceId=xxx`
- Some endpoints use workspaceId in path: `/workspaces/:workspaceId/tags`
- This creates confusion and inconsistent API design

### 2. Manual Permission Validation
- Each controller method manually calls `validateWorkspaceAccess()`
- Repetitive code across all controllers
- Error handling is scattered and inconsistent

### 3. Hallucinated Search Features
- Controllers reference search functionality that was never implemented
- TagsController has search filtering logic that shouldn't exist
- API documentation mentions search endpoints that don't exist

## Iterative Implementation Plan

### Phase 1: WorkspacesController & Routes ✅ IN PROGRESS

**Goal**: Get WorkspacesController fully functional with proper routes and tests

**Current Status**:
- ✅ WorkspacesController extends BaseController<WorkspaceEntity>
- ✅ Constructor properly injects WorkspacesDbService
- ✅ Uses `super(WorkspaceEntity, workspacesDbService)` pattern

**Remaining Tasks**:
- [ ] Create workspace routes in `apps/api/src/routes/v1/index.ts`
- [ ] Write integration tests for workspace CRUD operations
- [ ] Test workspace permission filtering in list endpoint
- [ ] Validate workspace create/update/delete operations

**Routes to Implement**:
```typescript
// Workspace routes
v1Routes.get('/workspaces', (c) => workspacesController.list(c));
v1Routes.get('/workspaces/:id', (c) => workspacesController.getById(c));
v1Routes.post('/workspaces', (c) => workspacesController.create(c));
v1Routes.put('/workspaces/:id', (c) => workspacesController.update(c));
v1Routes.delete('/workspaces/:id', (c) => workspacesController.delete(c));
```

**Success Criteria**:
- [ ] All workspace CRUD operations work via API endpoints
- [ ] Workspace listing respects user permissions
- [ ] Workspace validation works correctly
- [ ] Integration tests pass for all workspace operations

---

### Phase 2: WorkspaceNotesController & Routes (BLOCKED)

**Goal**: Create nested notes routes under workspaces with middleware

**Prerequisites**: Phase 1 complete

**Tasks**:
- [ ] Create WorkspaceNotesController extending BaseController<NoteEntity>
- [ ] Implement workspace middleware for permission validation
- [ ] Create nested routes: `/workspaces/:workspaceId/notes/*`
- [ ] Write integration tests for workspace-scoped notes
- [ ] Delete old NotesController

**Routes to Implement**:
```typescript
const workspaceRoutes = new Hono();
workspaceRoutes.use('/:workspaceId*', workspaceMiddleware('read'));

// Notes under workspace
workspaceRoutes.get('/notes', (c) => workspaceNotesController.list(c));
workspaceRoutes.get('/notes/:noteId', (c) => workspaceNotesController.getById(c));
workspaceRoutes.post('/notes', (c) => workspaceNotesController.create(c).use(workspaceMiddleware('write')));
workspaceRoutes.put('/notes/:noteId', (c) => workspaceNotesController.update(c).use(workspaceMiddleware('write')));
workspaceRoutes.delete('/notes/:noteId', (c) => workspaceNotesController.delete(c).use(workspaceMiddleware('write')));

v1Routes.route('/workspaces', workspaceRoutes);
```

---

### Phase 3: WorkspaceTagsController & Routes (BLOCKED)

**Goal**: Create nested tags routes under workspaces

**Prerequisites**: Phase 2 complete

**Tasks**:
- [ ] Create WorkspaceTagsController 
- [ ] Implement tag operations within workspace context
- [ ] Create nested routes for tags
- [ ] Write integration tests
- [ ] Delete old TagsController

---

### Phase 4: WorkspaceLinksController & Routes (BLOCKED)

**Goal**: Create nested links routes under workspaces

**Prerequisites**: Phase 3 complete

**Tasks**:
- [ ] Create WorkspaceLinksController
- [ ] Implement link operations within workspace context  
- [ ] Create nested routes for links
- [ ] Write integration tests
- [ ] Delete old LinksController

## Proposed Solution

### 1. Workspace Middleware (Phase 2)

Create `apps/api/src/middleware/workspace.ts` to handle:
- Extract workspaceId from route parameters
- Validate user permissions automatically
- Attach workspace info to request context
- Handle 404/403 errors consistently

```typescript
export const workspaceMiddleware = (requiredPermission: 'read' | 'write' = 'read') => {
  return async (c: Context, next: Next) => {
    const workspaceId = c.req.param('workspaceId');
    const user = c.get('currentUser');
    
    // Validate workspace exists and user has permissions
    // Attach workspace to context
    // Handle errors consistently
    
    await next();
  };
};
```

### 2. New Route Structure (Phase 2+)

**Current:**
```typescript
// Notes routes
v1Routes.get('/notes', (c) => notesController.list(c));
v1Routes.get('/notes/:id', (c) => notesController.getById(c));
```

**New:**
```typescript
// Workspace-scoped routes
const workspaceRoutes = new Hono();
workspaceRoutes.use('/:workspaceId*', workspaceMiddleware('read'));

// Notes routes under workspace
workspaceRoutes.get('/notes', (c) => workspaceNotesController.list(c));
workspaceRoutes.get('/notes/:noteId', (c) => workspaceNotesController.getById(c));

// Register workspace routes
v1Routes.route('/workspaces', workspaceRoutes);
```

### 3. Controller Simplification (Phases 2-4)

**Current NotesController.list():**
```typescript
async list(c: Context) {
    const user = this.getCurrentUser(c);
    const { page, limit, workspaceId } = c.req.query();
    
    if (!workspaceId) {
        throw new HTTPException(400, { message: 'workspaceId is required' });
    }
    
    await this.validateWorkspaceAccess(user.id, workspaceId, 'read');
    
    // ... rest of logic
}
```

**New WorkspaceNotesController.list():**
```typescript
async list(c: Context) {
    const { page, limit } = c.req.query();
    const workspace = c.get('workspace'); // Set by middleware
    
    // ... rest of logic, no manual validation needed
}
```

## Updated Endpoint Mappings

| Current Endpoint | New Endpoint | Phase | Method |
|------------------|---------------|-------|--------|
| `GET /workspaces` | `GET /workspaces` | 1 | List workspaces |
| `GET /workspaces/:id` | `GET /workspaces/:id` | 1 | Get workspace |
| `POST /workspaces` | `POST /workspaces` | 1 | Create workspace |
| `PUT /workspaces/:id` | `PUT /workspaces/:id` | 1 | Update workspace |
| `DELETE /workspaces/:id` | `DELETE /workspaces/:id` | 1 | Delete workspace |
| `GET /notes?workspaceId=xxx` | `GET /workspaces/{workspaceId}/notes` | 2 | List notes |
| `GET /notes/:id` | `GET /workspaces/{workspaceId}/notes/{noteId}` | 2 | Get note |
| `POST /notes` | `POST /workspaces/{workspaceId}/notes` | 2 | Create note |
| `PUT /notes/:id` | `PUT /workspaces/{workspaceId}/notes/{noteId}` | 2 | Update note |
| `DELETE /notes/:id` | `DELETE /workspaces/{workspaceId}/notes/{noteId}` | 2 | Delete note |

## Benefits of This Refactor

### 1. Better REST Design
- Proper resource nesting reflects the data model
- Consistent hierarchical structure
- Clearer API semantics

### 2. Reduced Code Duplication
- No repetitive permission validation in controllers
- Centralized error handling
- Cleaner controller logic

### 3. Improved Security
- Consistent permission checking
- No accidental bypass of workspace validation
- Centralized security logic

### 4. Better Developer Experience
- Controllers focus on business logic
- Clear separation of concerns
- Easier to add new workspace-scoped endpoints

## Breaking Changes

### 1. URL Structure Changes
All workspace-scoped endpoints will change URLs:
- Old: `GET /notes?workspaceId=123`
- New: `GET /workspaces/123/notes`

### 2. Request Body Changes
Create operations no longer need workspaceId in body:
- Old: `{ "workspaceId": "123", "title": "Note" }`
- New: `{ "title": "Note" }`

### 3. Error Response Changes
More consistent error responses:
- 404 for workspace not found
- 403 for permission denied
- 400 for validation errors

## Success Criteria by Phase

### Phase 1 (Workspaces):
- [ ] All workspace CRUD operations work via API endpoints
- [ ] Workspace listing respects user permissions
- [ ] Workspace validation works correctly
- [ ] Integration tests pass for all workspace operations

### Phase 2 (Notes):
- [ ] All note operations work under workspace routes
- [ ] Workspace middleware validates permissions correctly
- [ ] No manual workspace validation in controllers
- [ ] Integration tests pass for workspace-scoped notes

### Phase 3 (Tags):
- [ ] All tag operations work under workspace routes
- [ ] Tag functionality works within workspace context
- [ ] Integration tests pass for workspace-scoped tags

### Phase 4 (Links):
- [ ] All link operations work under workspace routes
- [ ] Link functionality works within workspace context
- [ ] Integration tests pass for workspace-scoped links

## Files to Modify by Phase

### Phase 1:
- `apps/api/src/routes/v1/index.ts` - Add workspace routes
- `apps/api/tests/integration/workspaces.test.ts` - Create workspace tests

### Phase 2:
- `apps/api/src/middleware/workspace.ts` - Create workspace middleware
- `apps/api/src/controllers/WorkspaceNotesController.ts` - Create new controller
- `apps/api/src/routes/v1/index.ts` - Add nested routes
- `apps/api/tests/integration/notes.test.ts` - Update for new structure
- `apps/api/src/controllers/NotesController.ts` - Delete old controller

### Phase 3:
- `apps/api/src/controllers/WorkspaceTagsController.ts` - Create new controller
- `apps/api/src/routes/v1/index.ts` - Add tag routes
- `apps/api/tests/integration/tags.test.ts` - Update for new structure
- `apps/api/src/controllers/TagsController.ts` - Delete old controller

### Phase 4:
- `apps/api/src/controllers/WorkspaceLinksController.ts` - Create new controller
- `apps/api/src/routes/v1/index.ts` - Add link routes
- `apps/api/tests/integration/links.test.ts` - Update for new structure
- `apps/api/src/controllers/LinksController.ts` - Delete old controller