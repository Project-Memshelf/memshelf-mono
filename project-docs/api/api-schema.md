# Memshelf API Schema

## Overview

The Memshelf API is a **RESTful HTTP API** built with Hono and TypeScript. All requests and responses use JSON format with comprehensive validation via Zod schemas.

**Base URL**: `http://localhost:4001` (development) / `https://api.memshelf.com` (production)
**API Version**: `v1`
**Full Base URL**: `http://localhost:4001/api/v1` (development)

---

## Authentication

### API Key Authentication
All requests require an API key in the `Authorization` header:

```http
Authorization: Bearer <your-api-key>
```

**Error Response** (401 Unauthorized):
```json
{
  "error": {
    "code": 401,
    "message": "Authentication required",
    "timestamp": "2025-09-07T01:20:00.000Z"
  }
}
```

**Development API Keys** (for testing - replace YOUR_API_KEY in examples):
```
Admin User:    dev_admin_key_0123456789abcdef0123456789abcdef01234567
John Developer: dev_john_key_fedcba9876543210fedcba9876543210fedcba98
Jane Designer:  dev_jane_key_abcdef0123456789abcdef0123456789abcdef01
```

> **Note**: Replace `YOUR_API_KEY` in curl examples with one of the development keys above for testing.

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": 400,
    "message": "Human readable error message",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## Notes Endpoints

### GET /api/v1/notes
List notes in a workspace.

**Query Parameters:**
- `workspaceId` (required) - UUID of the workspace
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:4001/api/v1/notes?workspaceId=00000000-0000-4000-8000-000000000011" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000036",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null,
      "workspaceId": "00000000-0000-4000-8000-000000000011",
      "title": "Database Schema Design",
      "content": "# Database Schema Overview...",
      "version": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `400` - workspaceId is required
- `401` - Authentication required
- `403` - Forbidden (no workspace access)

### GET /api/v1/notes/:id
Retrieve a specific note by ID.

**Parameters:**
- `id` (path) - UUID of the note

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-4000-8000-000000000036",
    "createdAt": "2025-09-06T16:36:03.000Z",
    "updatedAt": "2025-09-06T16:36:03.000Z",
    "deletedAt": null,
    "workspaceId": "00000000-0000-4000-8000-000000000011",
    "title": "Database Schema Design",
    "content": "# Database Schema Overview...",
    "version": 1
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no workspace access)
- `404` - Note not found

---

### POST /api/v1/notes
Create a new note.

**Request Body:**
```json
{
  "workspaceId": "00000000-0000-4000-8000-000000000011",
  "title": "New Note Title",
  "content": "# Initial Content\n\nNote body here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-note-uuid",
    "workspaceId": "00000000-0000-4000-8000-000000000011",
    "title": "New Note Title",
    "content": "# Initial Content\n\nNote body here...",
    "version": 1,
    "createdAt": "2025-09-07T01:25:00.000Z",
    "updatedAt": "2025-09-07T01:25:00.000Z",
    "deletedAt": null
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing workspaceId, title, etc.)
- `401` - Authentication required  
- `403` - Forbidden (no write access to workspace)

### PUT /api/v1/notes/:id
Update an existing note.

**Parameters:**
- `id` (path) - UUID of the note

**Request Body:**
```json
{
  "title": "Updated Note Title",
  "content": "# Updated Content\n\nModified content here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "note-uuid",
    "title": "Updated Note Title", 
    "content": "# Updated Content\n\nModified content here...",
    "version": 2
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no write access)
- `404` - Note not found

### DELETE /api/v1/notes/:id
Soft delete a note.

**Parameters:**
- `id` (path) - UUID of the note

**Response:**
```
204 No Content
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no write access)
- `404` - Note not found

---

### GET /api/v1/notes/:noteId/diffs
List all diffs (version history) for a note.

**Parameters:**
- `noteId` (path) - UUID of the note
- `page` (query) - Page number (default: 1)
- `limit` (query) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "diff-uuid-1",
      "noteId": "note-uuid",
      "position": 45,
      "length": 12,
      "newText": "updated content",
      "createdAt": "2025-09-07T01:25:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### POST /api/v1/notes/:noteId/diffs
Apply a diff to update note content and increment version.

**Parameters:**
- `noteId` (path) - UUID of the note

**Request Body:**
```json
{
  "position": 45,
  "length": 12,
  "newText": "updated content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no write access)
- `404` - Note not found

---

## Workspaces Endpoints

### GET /api/v1/workspaces
List all workspaces accessible to the authenticated user.

**Example Request:**
```bash
curl -X GET "http://localhost:4001/api/v1/workspaces" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000011",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null,
      "name": "Default Workspace",
      "description": "Default workspace for development and testing"
    },
    {
      "id": "00000000-0000-4000-8000-000000000012",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null,
      "name": "Personal Notes",
      "description": "Personal knowledge management workspace"
    }
  ],
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### GET /api/v1/workspaces/:id
Retrieve a specific workspace.

**Parameters:**
- `id` (path) - UUID of the workspace

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-4000-8000-000000000011",
    "createdAt": "2025-09-06T16:36:03.000Z",
    "updatedAt": "2025-09-06T16:36:03.000Z", 
    "deletedAt": null,
    "name": "Default Workspace",
    "description": "Default workspace for development and testing"
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no workspace access)
- `404` - Workspace not found

### POST /api/v1/workspaces
Create a new workspace with automatic permission assignment.

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-workspace-uuid",
    "name": "New Workspace", 
    "description": "Optional description",
    "createdAt": "2025-09-07T01:25:00.000Z",
    "updatedAt": "2025-09-07T01:25:00.000Z",
    "deletedAt": null
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### PUT /api/v1/workspaces/:id
Update workspace details.

**Parameters:**
- `id` (path) - UUID of the workspace

**Request Body:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "workspace-uuid",
    "name": "Updated Workspace Name",
    "description": "Updated description"
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### DELETE /api/v1/workspaces/:id
Soft delete a workspace.

**Parameters:**
- `id` (path) - UUID of the workspace

**Response:**
```
204 No Content
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no write access)
- `404` - Workspace not found

---

## Tags Endpoints

### GET /api/v1/tags
List tags for a specific workspace.

**Query Parameters:**
- `workspaceId` (required) - UUID of the workspace

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null,
      "name": "development",
      "displayName": "Development"
    }
  ],
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### GET /api/v1/workspaces/:workspaceId/tags
Alternative endpoint to get workspace tags.

**Parameters:**
- `workspaceId` (path) - UUID of the workspace

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null,
      "name": "development",
      "displayName": "Development"
    }
  ],
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### POST /api/v1/workspaces/:workspaceId/tags
Create a new tag in a workspace.

**Parameters:**
- `workspaceId` (path) - UUID of the workspace

**Request Body:**
```json
{
  "name": "new-tag",
  "displayName": "New Tag"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-tag-uuid",
    "name": "new-tag",
    "displayName": "New Tag",
    "createdAt": "2025-09-07T01:25:00.000Z",
    "updatedAt": "2025-09-07T01:25:00.000Z",
    "deletedAt": null
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

## Note-Tags Relationship Endpoints

### GET /api/v1/notes/:noteId/tags
Get all tags associated with a note.

**Parameters:**
- `noteId` (path) - UUID of the note

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "name": "development",
      "displayName": "Development",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### POST /api/v1/notes/:noteId/tags
Add a tag to a note.

**Parameters:**
- `noteId` (path) - UUID of the note

**Request Body:**
```json
{
  "tagId": "tag-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "noteId": "note-uuid",
    "tagId": "tag-uuid"
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### DELETE /api/v1/notes/:noteId/tags/:tagId
Remove a tag from a note.

**Parameters:**
- `noteId` (path) - UUID of the note
- `tagId` (path) - UUID of the tag

**Response:**
```
204 No Content
```

---

## Links Endpoints

### GET /api/v1/notes/:noteId/links
Get all links from and to a specific note.

**Parameters:**
- `noteId` (path) - UUID of the note

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "link-uuid",
      "createdAt": "2025-09-06T16:36:03.000Z",
      "updatedAt": "2025-09-06T16:36:03.000Z",
      "deletedAt": null,
      "sourceNoteId": "source-note-uuid",
      "targetNoteId": "target-note-uuid",
      "linkText": "see this note"
    }
  ],
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

### POST /api/v1/links
Create a link between two notes.

**Request Body:**
```json
{
  "sourceNoteId": "source-note-uuid",
  "targetNoteId": "target-note-uuid",
  "linkText": "link display text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-link-uuid",
    "sourceNoteId": "source-note-uuid",
    "targetNoteId": "target-note-uuid", 
    "linkText": "link display text",
    "createdAt": "2025-09-07T01:25:00.000Z",
    "updatedAt": "2025-09-07T01:25:00.000Z",
    "deletedAt": null
  },
  "meta": {
    "timestamp": "2025-09-07T01:25:00.000Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no write access to source workspace)
- `404` - Source or target note not found

### DELETE /api/v1/links/:linkId
Delete a link between notes.

**Parameters:**
- `linkId` (path) - UUID of the link

**Response:**
```
204 No Content
```

**Error Responses:**
- `401` - Authentication required
- `403` - Forbidden (no write access)
- `404` - Link not found

---

## Health Endpoint

### GET /health
Public health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-07T01:25:00.000Z",
  "service": "memshelf-api"
}
```

---

## Future Features (Planned)

### Search Endpoints (Not Implemented)
- Full-text search across notes
- Meilisearch integration
- Faceted search with filters

### User Management (Not Implemented)  
- User profile endpoints
- API key management
- Permission management

### Rate Limiting (Not Implemented)
- Per-API key rate limiting
- Configurable limits by operation type

### Additional Features (Not Implemented)
- Note templates
- Bulk operations
- Webhooks for note changes
- Export/import functionality

---

## HTTP Status Codes

### Success Codes
- `200 OK` - Request successful with data
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no response body

### Client Error Codes
- `400 Bad Request` - Invalid request data (validation errors)
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Access denied (insufficient permissions)
- `404 Not Found` - Resource not found

### Server Error Codes  
- `500 Internal Server Error` - Unexpected server error

## Common Error Patterns

### Authentication Required (401)
```json
{
  "error": {
    "code": 401,
    "message": "Authentication required",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

### Validation Error (400) 
```json
{
  "error": {
    "code": 400,
    "message": "workspaceId is required", 
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

### Permission Denied (403)
```json
{
  "error": {
    "code": 403,
    "message": "Forbidden",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

### Resource Not Found (404)
```json
{
  "error": {
    "code": 404,
    "message": "Note not found",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

---

## OpenAPI Specification (Planned)

Future implementation will include:
- **JSON Spec**: `GET /api/v1/openapi.json`
- **Interactive UI**: `GET /api/v1/docs` (Swagger UI)
- **Schema Definitions**: Auto-generated from Zod schemas
- **Client SDK Generation**: For multiple languages

See `project-docs/api/openapi-integration-plan.md` for implementation details.