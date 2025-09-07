# Authentication & Authorization

## Overview

Memshelf uses a **simple API key-based authentication system** designed specifically for AI agents and automated tools. This approach eliminates the complexity of token refresh cycles while maintaining security through key rotation and permission controls.

---

## Authentication Model

### API Key Authentication
Every request must include a valid API key in the `Authorization` header using the Bearer token format:

```http
Authorization: Bearer dev_admin_key_0123456789abcdef0123456789abcdef01234567
```

**API Key Format:**
- **Development Keys**: Prefixed with `dev_` for development/testing
- **Key Body**: 64 hexadecimal characters  
- **Total Length**: 68 characters (including prefix)
- **Example**: `dev_admin_key_0123456789abcdef0123456789abcdef01234567`

**Development API Keys:**
```
Admin User:     dev_admin_key_0123456789abcdef0123456789abcdef01234567
John Developer: dev_john_key_fedcba9876543210fedcba9876543210fedcba98
Jane Designer:  dev_jane_key_abcdef0123456789abcdef0123456789abcdef01
```

### API Key Properties
- **Long-lived**: No automatic expiration (unlike JWT tokens)
- **Revocable**: Can be instantly invalidated
- **Rotatable**: Users can generate new keys and phase out old ones
- **Scoped**: Each key is tied to a specific user with defined permissions

---

## User Model

### User Types
**AI Agents & Service Accounts**: Primary user type for automated systems
- Named entities (e.g., "GPT-4 Assistant", "Knowledge Sync Bot")
- API key-based authentication only
- Programmatic workspace access
- Designed for long-running processes

**Future Expansion**: Human users could be added with additional authentication methods while maintaining API key compatibility.

### User Properties
```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Admin User",
  "apiKey": "dev_admin_key_0123456789abcdef0123456789abcdef01234567",
  "createdAt": "2025-09-06T16:36:03.000Z",
  "updatedAt": "2025-09-06T16:36:03.000Z",
  "deletedAt": null
}
```

---

## Authorization Model

### Workspace-Based Permissions
Authorization in Memshelf is **workspace-centric**. Users are granted access to specific workspaces with defined permission levels.

### Permission Levels
**Read Access** (`can_write: false`):
- View notes and their content
- Search within the workspace
- List workspace notes and metadata
- View tags and links
- Cannot create, modify, or delete content

**Write Access** (`can_write: true`):
- All read permissions
- Create new notes
- Edit existing notes (apply diffs)
- Delete notes
- Create and manage tags
- Create links between notes

### Permission Inheritance
- **Notes inherit workspace permissions**: Access to a workspace grants access to all its notes
- **Tags inherit workspace context**: Workspace tags are automatically available to workspace members
- **Links respect workspace boundaries**: Can only create links between notes in accessible workspaces

---

## Permission Storage

### user_permissions Table
```sql
user_permissions (
  user_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id), 
  can_write BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
)
```

### Permission Queries
**Check workspace access**:
```sql
SELECT can_write FROM user_permissions 
WHERE user_id = ? AND workspace_id = ?
```

**List user workspaces**:
```sql
SELECT w.*, up.can_write FROM workspaces w
JOIN user_permissions up ON w.id = up.workspace_id
WHERE up.user_id = ?
```

---

## Authentication Flow

### 1. API Key Validation
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant DB
    
    Client->>API: Request with API key
    API->>Cache: Check key cache
    alt Cache hit
        Cache->>API: Return user data
    else Cache miss
        API->>DB: Validate API key
        DB->>API: Return user data
        API->>Cache: Store user data (5 min TTL)
    end
    API->>Client: Authenticated response
```

### 2. Authorization Check
```mermaid
sequenceDiagram
    participant API
    participant Cache
    participant DB
    
    API->>Cache: Check permission cache
    alt Cache hit
        Cache->>API: Return permissions
    else Cache miss
        API->>DB: Query user_permissions
        DB->>API: Return permissions
        API->>Cache: Store permissions (10 min TTL)
    end
    API->>API: Evaluate workspace access
```

---

## Caching Strategy

### API Key Caching (Valkey/Redis)
**Key Pattern**: `auth:api_key:{api_key_hash}`
**TTL**: 5 minutes
**Data**:
```json
{
  "user_id": "uuid",
  "name": "User Name",
  "valid": true
}
```

### Permission Caching
**Key Pattern**: `auth:permissions:{user_id}:{workspace_id}`
**TTL**: 10 minutes  
**Data**:
```json
{
  "can_write": true,
  "cached_at": "2025-09-01T12:00:00Z"
}
```

### Cache Invalidation
- **API key rotation**: Invalidate `auth:api_key:*` for user
- **Permission changes**: Invalidate `auth:permissions:{user_id}:*`
- **User deletion**: Invalidate all user-related cache entries

---

## Security Considerations

### API Key Security
**Generation**: Cryptographically secure random generation using Node.js `crypto.randomBytes()`
**Storage**: API keys are hashed using bcrypt before database storage
**Transmission**: Always transmitted over HTTPS
**Logging**: API keys are never logged in plaintext (redacted in logs)

### Rate Limiting
**Per API Key Limits**:
- Read operations: 1000/hour
- Write operations: 200/hour  
- Search operations: 100/hour

**Implementation**: Sliding window rate limiting using Valkey with key pattern: `rate:{api_key_hash}:{operation_type}`

### Request Validation
**Input Sanitization**: All inputs validated with Zod schemas
**SQL Injection Prevention**: TypeORM parameterized queries
**XSS Prevention**: Content sanitization for user-generated data
**CSRF Protection**: Not applicable (API-only, no browser cookies)

---

## API Key Management

### Key Rotation Process
1. **Generate new API key** for user
2. **Update applications** to use new key
3. **Monitor usage** to ensure old key is unused
4. **Revoke old key** when safe

### Key Revocation
**Immediate Effect**: Keys are checked on every request
**Cache Invalidation**: Revoked keys are immediately removed from cache
**Audit Trail**: All key operations are logged for security auditing

### Key Recovery
**No Recovery Mechanism**: Lost keys cannot be recovered
**Replacement Process**: Generate new key, revoke old key
**User Notification**: Inform user of key changes through configured channels

---

## Error Handling

### Authentication Errors
**Invalid API Key** (401):
```json
{
  "error": {
    "code": 401,
    "message": "Authentication required",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

**Missing API Key** (401):
```json
{
  "error": {
    "code": 401,
    "message": "Authentication required",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

### Authorization Errors
**Workspace Access Denied** (403):
```json
{
  "error": {
    "code": 403,
    "message": "Forbidden",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

**Write Permission Required** (403):
```json
{
  "error": {
    "code": 403,
    "message": "Forbidden",
    "timestamp": "2025-09-07T01:25:00.000Z"
  }
}
```

---

## Implementation Guidelines

### Middleware Stack
1. **API Key Extraction**: Parse Authorization header
2. **API Key Validation**: Check cache, then database
3. **User Context**: Attach user information to request
4. **Rate Limiting**: Check and update rate limit counters
5. **Permission Resolution**: Load user permissions for workspace operations

### Database Queries
**Optimize for Read Performance**:
- Index on `users.api_key` (unique)
- Index on `user_permissions.user_id`
- Index on `user_permissions.workspace_id`
- Composite index on `(user_id, workspace_id)`

### Monitoring
**Authentication Metrics**:
- Failed authentication attempts per minute
- API key usage patterns
- Permission denied events
- Rate limit violations

**Security Alerts**:
- Repeated failed authentication from same IP
- Unusual API key usage patterns
- Permission escalation attempts
- Suspended user activity

---

This authentication and authorization system provides **simplicity for AI agents** while maintaining **security and scalability** for production deployments.