# Memshelf API Schema

## Overview

The Memshelf API is a **RESTful HTTP API** built with Hono and TypeScript. All requests and responses use JSON format with comprehensive validation via Zod schemas.

**Base URL**: `https://api.memshelf.com` (or your self-hosted instance)
**API Version**: `v1`
**Full Base URL**: `https://api.memshelf.com/api/v1`

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
  "error": "unauthorized",
  "message": "Invalid or missing API key",
  "code": "AUTH_001"
}
```

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-09-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "error_type",
  "message": "Human readable error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "meta": {
    "timestamp": "2025-09-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-09-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

---

## Notes Endpoints

### GET /api/v1/notes/:id
Retrieve a specific note by ID.

**Parameters:**
- `id` (path) - UUID of the note

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes - Project Alpha",
    "content": "# Meeting Summary\n\n- Discussed roadmap...",
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "tags": ["meeting", "project-alpha"],
    "workspace_tags": ["work", "2025"],
    "created_at": "2025-09-01T10:00:00Z",
    "updated_at": "2025-09-01T11:30:00Z",
    "version": 3
  }
}
```

**Error Codes:**
- `NOTE_001` - Note not found
- `NOTE_002` - Access denied to workspace

---

### POST /api/v1/notes
Create a new note.

**Request Body:**
```json
{
  "title": "New Note Title",
  "content": "# Initial Content\n\nNote body here...",
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "New Note Title",
    "content": "# Initial Content\n\nNote body here...",
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "tags": ["tag1", "tag2"],
    "workspace_tags": ["work", "2025"],
    "created_at": "2025-09-01T12:00:00Z",
    "updated_at": "2025-09-01T12:00:00Z",
    "version": 1
  }
}
```

**Validation Rules:**
- `title`: 1-500 characters, required
- `content`: 0-1,000,000 characters, optional (defaults to empty)
- `workspace_id`: Valid UUID, required
- `tags`: Array of valid tag names, optional

**Error Codes:**
- `NOTE_003` - Invalid workspace ID
- `NOTE_004` - Workspace access denied
- `VALIDATION_001` - Invalid request data

---

### PATCH /api/v1/notes/:id/diff
Apply a diff to an existing note.

**Parameters:**
- `id` (path) - UUID of the note

**Request Body:**
```json
{
  "position": 45,
  "length": 12,
  "new_text": "updated content",
  "version": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes - Project Alpha",
    "content": "# Meeting Summary\n\n- Discussed updated content...",
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "tags": ["meeting", "project-alpha"],
    "workspace_tags": ["work", "2025"],
    "created_at": "2025-09-01T10:00:00Z",
    "updated_at": "2025-09-01T12:15:00Z",
    "version": 4,
    "diff_applied": {
      "id": "diff-uuid-here",
      "position": 45,
      "length": 12,
      "new_text": "updated content",
      "created_at": "2025-09-01T12:15:00Z"
    }
  }
}
```

**Validation Rules:**
- `position`: Integer >= 0, required
- `length`: Integer >= 0, required  
- `new_text`: String, optional (defaults to empty for deletion)
- `version`: Integer, required for conflict detection

**Error Codes:**
- `NOTE_005` - Version conflict (note updated since last fetch)
- `NOTE_006` - Invalid diff position/length
- `NOTE_007` - Diff would exceed content limits

---

### GET /api/v1/notes/:id/diffs
List all diffs for a note.

**Parameters:**
- `id` (path) - UUID of the note
- `page` (query) - Page number (default: 1)
- `limit` (query) - Items per page (default: 50, max: 200)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "diff-uuid-1",
      "position": 45,
      "length": 12,
      "new_text": "updated content",
      "created_at": "2025-09-01T12:15:00Z",
      "applied_at": "2025-09-01T12:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### DELETE /api/v1/notes/:id
Delete a note and all its associated data.

**Parameters:**
- `id` (path) - UUID of the note

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "note_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Workspaces Endpoints

### GET /api/v1/workspaces
List all workspaces accessible to the authenticated user.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Project Alpha",
      "description": "Main project workspace",
      "tags": ["work", "2025"],
      "permissions": {
        "can_write": true
      },
      "created_at": "2025-08-01T10:00:00Z",
      "updated_at": "2025-09-01T09:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/v1/workspaces/:id
Retrieve a specific workspace.

**Parameters:**
- `id` (path) - UUID of the workspace

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Project Alpha",
    "description": "Main project workspace",
    "tags": ["work", "2025"],
    "permissions": {
      "can_write": true
    },
    "stats": {
      "note_count": 47,
      "total_size": 1048576
    },
    "created_at": "2025-08-01T10:00:00Z",
    "updated_at": "2025-09-01T09:00:00Z"
  }
}
```

---

### POST /api/v1/workspaces
Create a new workspace.

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Optional description",
  "tags": ["tag1", "tag2"]
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
    "tags": ["tag1", "tag2"],
    "permissions": {
      "can_write": true
    },
    "created_at": "2025-09-01T12:00:00Z",
    "updated_at": "2025-09-01T12:00:00Z"
  }
}
```

---

### GET /api/v1/workspaces/:id/notes
List all notes in a workspace.

**Parameters:**
- `id` (path) - UUID of the workspace
- `page` (query) - Page number (default: 1)
- `limit` (query) - Items per page (default: 20, max: 100)
- `sort` (query) - Sort order: `created_at`, `updated_at`, `title` (default: `updated_at`)
- `order` (query) - Sort direction: `asc`, `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "note-uuid",
      "title": "Note Title",
      "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
      "tags": ["tag1"],
      "workspace_tags": ["work", "2025"],
      "created_at": "2025-09-01T10:00:00Z",
      "updated_at": "2025-09-01T11:30:00Z",
      "content_preview": "First 200 characters of content..."
    }
  ],
  "pagination": { ... }
}
```

---

## Search Endpoints

### GET /api/v1/search
Search notes across accessible workspaces.

**Query Parameters:**
- `q` (required) - Search query string
- `workspace_ids` (optional) - Comma-separated workspace UUIDs to search within
- `tags` (optional) - Comma-separated tag names to filter by
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `highlight` (optional) - Include search highlights (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "note-uuid",
      "title": "Meeting Notes - Project Alpha",
      "workspace_id": "workspace-uuid",
      "tags": ["meeting", "project-alpha"],
      "workspace_tags": ["work", "2025"],
      "created_at": "2025-09-01T10:00:00Z",
      "updated_at": "2025-09-01T11:30:00Z",
      "content_preview": "...highlighted search terms...",
      "highlights": {
        "title": ["Meeting <mark>Notes</mark> - Project Alpha"],
        "content": ["...contains the search <mark>term</mark>..."]
      },
      "score": 0.95
    }
  ],
  "pagination": { ... },
  "search_meta": {
    "query": "search query",
    "total_time_ms": 15,
    "facets": {
      "tags": {
        "meeting": 12,
        "project-alpha": 8
      },
      "workspaces": {
        "workspace-uuid": 15
      }
    }
  }
}
```

---

## Tags Endpoints

### GET /api/v1/tags
List all tags accessible to the authenticated user.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50, max: 200)
- `search` (optional) - Filter tags by name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "name": "project-alpha",
      "display_name": "Project Alpha",
      "usage_count": 47,
      "created_at": "2025-08-01T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/v1/tags
Create a new tag.

**Request Body:**
```json
{
  "name": "new-tag",
  "display_name": "New Tag"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-tag-uuid",
    "name": "new-tag",
    "display_name": "New Tag",
    "usage_count": 0,
    "created_at": "2025-09-01T12:00:00Z"
  }
}
```

**Validation Rules:**
- `name`: Lowercase, hyphens only, 1-100 characters, must match `/^[a-z0-9-]+$/`
- `display_name`: 1-100 characters, human-readable format

---

## Links Endpoints

### GET /api/v1/notes/:id/links
Get all links from and to a specific note.

**Parameters:**
- `id` (path) - UUID of the note
- `direction` (query) - `outgoing`, `incoming`, or `both` (default: `both`)

**Response:**
```json
{
  "success": true,
  "data": {
    "outgoing": [
      {
        "id": "link-uuid",
        "target_note_id": "target-note-uuid",
        "target_note_title": "Linked Note Title",
        "link_text": "see this note",
        "position": 145,
        "created_at": "2025-09-01T10:00:00Z"
      }
    ],
    "incoming": [
      {
        "id": "link-uuid-2",
        "source_note_id": "source-note-uuid",
        "source_note_title": "Source Note Title",
        "link_text": "reference to this note",
        "position": 78,
        "created_at": "2025-09-01T09:00:00Z"
      }
    ]
  }
}
```

---

### POST /api/v1/links
Create a link between notes.

**Request Body:**
```json
{
  "source_note_id": "source-note-uuid",
  "target_note_id": "target-note-uuid",
  "link_text": "link display text",
  "position": 145
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-link-uuid",
    "source_note_id": "source-note-uuid",
    "target_note_id": "target-note-uuid",
    "link_text": "link display text",
    "position": 145,
    "created_at": "2025-09-01T12:00:00Z"
  }
}
```

---

## User Endpoints

### GET /api/v1/user/profile
Get current user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "AI Agent Name",
    "created_at": "2025-08-01T10:00:00Z",
    "permissions": {
      "workspaces": [
        {
          "workspace_id": "workspace-uuid",
          "workspace_name": "Project Alpha",
          "can_write": true
        }
      ]
    }
  }
}
```

---

## Rate Limiting

**Rate Limits:**
- **Read operations**: 1000 requests per hour per API key
- **Write operations**: 200 requests per hour per API key
- **Search operations**: 100 requests per hour per API key

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1693574400
```

**Rate Limit Exceeded (429):**
```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Try again in 3600 seconds.",
  "code": "RATE_001",
  "details": {
    "limit": 1000,
    "reset_at": "2025-09-01T13:00:00Z"
  }
}
```

---

## Error Codes Reference

### Authentication (AUTH_xxx)
- `AUTH_001` - Invalid or missing API key
- `AUTH_002` - API key expired
- `AUTH_003` - API key revoked

### Notes (NOTE_xxx)
- `NOTE_001` - Note not found
- `NOTE_002` - Access denied to workspace
- `NOTE_003` - Invalid workspace ID
- `NOTE_004` - Workspace access denied
- `NOTE_005` - Version conflict
- `NOTE_006` - Invalid diff position/length
- `NOTE_007` - Diff would exceed content limits

### Validation (VALIDATION_xxx)
- `VALIDATION_001` - Invalid request data
- `VALIDATION_002` - Missing required field
- `VALIDATION_003` - Invalid field format

### Rate Limiting (RATE_xxx)
- `RATE_001` - Rate limit exceeded

### Server (SERVER_xxx)
- `SERVER_001` - Internal server error
- `SERVER_002` - Database unavailable
- `SERVER_003` - Search service unavailable

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **JSON**: `GET /api/v1/openapi.json`
- **Interactive UI**: `GET /api/v1/docs` (Swagger UI)

This provides complete schema definitions, request/response examples, and an interactive API explorer.