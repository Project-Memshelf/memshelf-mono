# Integration Test Implementation Guide for AI Agents

> **AI Agent Instructions**: Complete implementation guide for adding comprehensive integration testing to the Memshelf API

## Project Context

**Repository**: Memshelf monorepo with TypeScript API
**Current State**: API endpoints implemented, database entities exist, authentication working
**Goal**: Implement integration test suite as described in `api-testing-strategy.md`

## Implementation Status

### ✅ **Completed Setup**
- **Test environment configuration** - `.env.test` file created and working
- **Test database services** - `docker-compose.test.yml` with isolated MariaDB, Redis, MongoDB
- **Environment loading** - `createConfig.ts` updated to load `.env.test` when NODE_ENV=test
- **TypeScript configuration** - `tsconfig.json` excludes test files from compilation
- **Test infrastructure** - Bun test runner confirmed working

### 🚧 **Remaining Implementation**

#### 1. Test Dependencies ✅ DONE

No additional dependencies needed! We're using:
- **Bun's built-in test runner** (`bun test`)
- **Hono's native fetch method** for HTTP requests
- **TypeScript** for type safety

#### 2. Test Environment Configuration ✅ DONE

**File**: `apps/api/.env.test` (already created)
```env
# Test Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=8383
DATABASE_USERNAME=memshelf_test
DATABASE_PASSWORD=test_password_123
DATABASE_NAME=memshelf_test

# Test Redis/Valkey Configuration
VALKEY_HOST=localhost
VALKEY_PORT=8384
VALKEY_DB=0

# Test MongoDB Configuration (for job queue)
MONGODB_HOST=localhost
MONGODB_PORT=8385
MONGODB_USERNAME=memshelf_test
MONGODB_PASSWORD=memshelf_test
MONGODB_DATABASE=jobs_test

# API Configuration
API_SERVER_HOSTNAME=localhost
API_SERVER_PORT=3001

# Disable external services for testing
MEILISEARCH_ENABLED=false
EMAIL_ENABLED=false

# Test-specific settings
NODE_ENV=test
LOG_LEVEL=warn
```

**Test Services**: `docker/docker-compose.test.yml` ✅ CREATED

#### 3. Database Test Configuration ✅ IMPLEMENTED

**File**: `apps/api/tests/integration/config/database.ts` - **IMPLEMENTED**
```typescript
import { DataSource, initializeDatabase } from '@repo/database';
import { container } from '../../../src/config';
import { testUsers, testWorkspaces } from '../../fixtures';

const dataSource = container.resolve(DataSource);

export async function setupTestDatabase() {
    await initializeDatabase(dataSource);
}

export async function clearTestData() {
    const entities = dataSource.entityMetadatas;
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const entity of entities.reverse()) {
        const repository = dataSource.getRepository(entity.name);
        await repository.clear();
    }
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function createTestData() {
    await clearTestData();
    
    // Insert fixture data
    const userRepo = dataSource.getRepository('User');
    const workspaceRepo = dataSource.getRepository('Workspace');
    const _permissionRepo = dataSource.getRepository('UserPermission');

    await userRepo.save(Object.values(testUsers));
    await workspaceRepo.save(Object.values(testWorkspaces));
    // Add permissions based on fixtures...
}
```

#### 4. Test Fixtures (Single Source of Truth) ✅ IMPLEMENTED

**File**: `apps/api/tests/fixtures/index.ts` - **CREATED**

Test fixtures are now the single source of truth for test data. The `createTestData()` function uses these fixtures to populate the database, keeping tests decoupled from migration seed data.

#### 5. API Test Helpers ✅ IMPLEMENTED

**File**: `apps/api/tests/integration/helpers/api.ts` - **COMPLETED**
```typescript
import { expect } from 'bun:test';
import { honoApp } from '../../../src/http-server';
import { testUsers } from '../../fixtures';

export async function authenticatedRequest(
  path: string, 
  init: RequestInit = {},
  userType: keyof typeof testUsers = 'admin'
) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${testUsers[userType].apiKey}`);
  
  return await honoApp.request(path, {
    ...init,
    headers,
  });
}

export async function expectSuccessResponse(response: Response, expectedData?: any) {
  const body = await response.json();
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  if (expectedData) {
    expect(body.data).toMatchObject(expectedData);
  }
  return body;
}

export async function expectErrorResponse(response: Response, expectedCode?: number) {
  const body = await response.json();
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  if (expectedCode) {
    expect(response.status).toBe(expectedCode);
  }
  return body;
}

export async function expectPaginatedResponse(response: Response) {
  const body = await response.json();
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('pagination');
  expect(body.pagination).toHaveProperty('page');
  expect(body.pagination).toHaveProperty('limit');
  expect(body.pagination).toHaveProperty('total');
  return body;
}
```

#### 4. Create Bun Test Setup

#### 6. Test Lifecycle Management

**No separate setup file needed** - Each test suite manages its own lifecycle:

```typescript
// In each test file (e.g., auth.test.ts, notes.test.ts)
import { beforeAll, beforeEach } from 'bun:test';
import { setupTestDatabase, createTestData } from './config/database';

beforeAll(async () => {
  await setupTestDatabase(); // Initialize DB schema
});

beforeEach(async () => {
  await createTestData(); // Clear and insert fixture data
});
```

### Phase 2: Authentication Tests

### Phase 2: Authentication Tests 🚧 TODO

**File**: `apps/api/tests/integration/auth.test.ts` - **CREATED (EMPTY)**
```typescript
import { describe, it, expect } from 'bun:test';
import { honoApp } from '../../src/http-server';
import { authenticatedRequest, expectErrorResponse, expectSuccessResponse } from './helpers/api';

describe('API Authentication', () => {
  describe('Bearer Token Validation', () => {
    it('should accept valid API key', async () => {
      const response = await authenticatedRequest('/api/v1/workspaces');
      
      expect(response.status).toBe(200);
      await expectSuccessResponse(response);
    });

    it('should reject request without Authorization header', async () => {
      const response = await honoApp.request('/api/v1/workspaces');
      
      expect(response.status).toBe(401);
      await expectErrorResponse(response);
    });

    it('should reject invalid API key format', async () => {
      const response = await honoApp.request('/api/v1/workspaces', {
        headers: { 'Authorization': 'Bearer invalid-key-format' }
      });
      
      expect(response.status).toBe(401);
      await expectErrorResponse(response);
    });

    it('should reject non-existent API key', async () => {
      const response = await honoApp.request('/api/v1/workspaces', {
        headers: { 'Authorization': 'Bearer test_nonexistent_key_0000000000000000000000000000000000000000' }
      });
      
      expect(response.status).toBe(401);
      await expectErrorResponse(response);
    });

    it('should reject malformed Authorization header', async () => {
      const response = await honoApp.request('/api/v1/workspaces', {
        headers: { 'Authorization': 'InvalidFormat test_admin_key' }
      });
      
      expect(response.status).toBe(401);
      await expectErrorResponse(response);
    });
  });
});
```

**File**: `apps/api/tests/integration/authorization.test.ts` - **TO BE CREATED**
```typescript
import { describe, it, expect } from 'bun:test';
import { authenticatedRequest, expectErrorResponse, expectSuccessResponse } from './helpers/api';
import { testWorkspaces } from '../../fixtures';

describe('API Authorization', () => {
  describe('Workspace Access Control', () => {
    it('should allow read access for read-only user', async () => {
      const response = await authenticatedRequest('readOnly')
        .get(`/api/v1/notes?workspaceId=${testWorkspaces.primary.id}`);
      
      expect(response.status).toBe(200);
      expectSuccessResponse(response);
    });

    it('should deny write access for read-only user', async () => {
      const response = await authenticatedRequest('readOnly')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Test Note',
          content: 'Test content'
        });
      
      expect(response.status).toBe(403);
      expectErrorResponse(response);
    });

    it('should deny access to unauthorized workspace', async () => {
      const response = await authenticatedRequest('readOnly')
        .get(`/api/v1/notes?workspaceId=${testWorkspaces.secondary.id}`);
      
      expect(response.status).toBe(403);
      expectErrorResponse(response);
    });

    it('should allow full access for admin user', async () => {
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Admin Test Note',
          content: 'Admin test content'
        });
      
      expect(createResponse.status).toBe(201);
      expectSuccessResponse(createResponse);
    });
  });
});
```

### Phase 3: Endpoint Tests

**File**: `apps/api/tests/integration/notes.test.ts` - **CREATED (EMPTY)**
```typescript
import { describe, it, expect } from 'bun:test';
import { authenticatedRequest, expectSuccessResponse, expectErrorResponse, expectPaginatedResponse } from './helpers/api';
import { testWorkspaces } from '../../fixtures';

describe('Notes API', () => {
  describe('GET /api/v1/notes', () => {
    it('should list notes with pagination', async () => {
      const response = await authenticatedRequest('admin')
        .get(`/api/v1/notes?workspaceId=${testWorkspaces.primary.id}`);
      
      expect(response.status).toBe(200);
      expectPaginatedResponse(response);
    });

    it('should require workspaceId parameter', async () => {
      const response = await authenticatedRequest('admin')
        .get('/api/v1/notes');
      
      expect(response.status).toBe(400);
      expectErrorResponse(response);
    });

    it('should respect pagination parameters', async () => {
      const response = await authenticatedRequest('admin')
        .get(`/api/v1/notes?workspaceId=${testWorkspaces.primary.id}&page=1&limit=5`);
      
      expect(response.status).toBe(200);
      expectPaginatedResponse(response);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/v1/notes', () => {
    it('should create note with valid data', async () => {
      const noteData = {
        workspaceId: testWorkspaces.primary.id,
        title: 'Integration Test Note',
        content: 'This is a test note created during integration testing.'
      };

      const response = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send(noteData);
      
      expect(response.status).toBe(201);
      expectSuccessResponse(response);
      expect(response.body.data).toMatchObject({
        title: noteData.title,
        content: noteData.content,
        workspaceId: noteData.workspaceId,
        version: 1
      });
      expect(response.body.data).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const response = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          // Missing title and content
        });
      
      expect(response.status).toBe(400);
      expectErrorResponse(response);
    });

    it('should validate workspace access', async () => {
      const response = await authenticatedRequest('/api/v1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: testWorkspaces.engineering.id,
          title: 'Test Note',
          content: 'Test content'
        })
      }, 'jane'); // Jane has limited access
      
      expect(response.status).toBe(403);
      await expectErrorResponse(response);
    });
  });

  describe('GET /api/v1/notes/:id', () => {
    it('should get note by id', async () => {
      // First create a note
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Test Note',
          content: 'Test content'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Then retrieve it
      const response = await authenticatedRequest('admin')
        .get(`/api/v1/notes/${noteId}`);
      
      expect(response.status).toBe(200);
      expectSuccessResponse(response);
      expect(response.body.data.id).toBe(noteId);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await authenticatedRequest('admin')
        .get('/api/v1/notes/00000000-0000-4000-8000-000000000999');
      
      expect(response.status).toBe(404);
      expectErrorResponse(response);
    });

    it('should validate workspace access for note retrieval', async () => {
      // Create note as admin
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.secondary.id,
          title: 'Private Note',
          content: 'This should not be accessible'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Try to access as read-only user (no access to secondary workspace)
      const response = await authenticatedRequest('readOnly')
        .get(`/api/v1/notes/${noteId}`);
      
      expect(response.status).toBe(403);
      expectErrorResponse(response);
    });
  });

  describe('PUT /api/v1/notes/:id', () => {
    it('should update note and increment version', async () => {
      // Create note
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Original Title',
          content: 'Original content'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Update note
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };
      
      const response = await authenticatedRequest('admin')
        .put(`/api/v1/notes/${noteId}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expectSuccessResponse(response);
      expect(response.body.data.version).toBe(2);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
    });

    it('should increment version only when content changes', async () => {
      // Create note
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Test Title',
          content: 'Test content'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Update with same content
      const response = await authenticatedRequest('admin')
        .put(`/api/v1/notes/${noteId}`)
        .send({
          title: 'Test Title',
          content: 'Test content'
        });
      
      expect(response.status).toBe(200);
      expectSuccessResponse(response);
      expect(response.body.data.version).toBe(1); // Should not increment
    });

    it('should require write permissions', async () => {
      // Create note as admin
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Test Note',
          content: 'Test content'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Try to update as read-only user
      const response = await authenticatedRequest('readOnly')
        .put(`/api/v1/notes/${noteId}`)
        .send({
          title: 'Unauthorized Update',
          content: 'This should fail'
        });
      
      expect(response.status).toBe(403);
      expectErrorResponse(response);
    });
  });

  describe('DELETE /api/v1/notes/:id', () => {
    it('should soft delete note', async () => {
      // Create note
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'To Delete',
          content: 'This will be deleted'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Delete note
      const response = await authenticatedRequest('admin')
        .delete(`/api/v1/notes/${noteId}`);
      
      expect(response.status).toBe(204);
      
      // Verify note is no longer accessible
      const getResponse = await authenticatedRequest('admin')
        .get(`/api/v1/notes/${noteId}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should require write permissions for deletion', async () => {
      // Create note as admin
      const createResponse = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send({
          workspaceId: testWorkspaces.primary.id,
          title: 'Protected Note',
          content: 'Should not be deletable by read-only user'
        });
      
      const noteId = createResponse.body.data.id;
      
      // Try to delete as read-only user
      const response = await authenticatedRequest('readOnly')
        .delete(`/api/v1/notes/${noteId}`);
      
      expect(response.status).toBe(403);
      expectErrorResponse(response);
    });
  });
});
```

### Phase 4: Package.json Scripts

**File**: `apps/api/package.json` (add to scripts section)
```json
{
  "scripts": {
    "test": "NODE_ENV=test bun test",
    "test:watch": "NODE_ENV=test bun test --watch"
  }
}
```

**File**: Add to `docker-compose.yml` (test database)
```yaml
services:
  mariadb-test:
    image: mariadb:11
    container_name: memshelf-mariadb-test
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: memshelf_test
      MYSQL_USER: memshelf_test
      MYSQL_PASSWORD: test_password_123
    ports:
      - "3307:3306"
    volumes:
      - mariadb_test_data:/var/lib/mysql
    networks:
      - memshelf-network

volumes:
  mariadb_test_data:
```

### Phase 5: Additional Endpoint Tests

#### Create similar test files for remaining endpoints:

**Files to create**:
- `apps/api/tests/integration/workspaces.test.ts`
- `apps/api/tests/integration/tags.test.ts`
- `apps/api/tests/integration/note-tags.test.ts`
- `apps/api/tests/integration/links.test.ts`
- `apps/api/tests/integration/diffs.test.ts`

**Pattern for each file**:
```typescript
import { describe, it, expect } from 'bun:test';
import { authenticatedRequest, expectSuccessResponse, expectErrorResponse } from './helpers/api';
import { testWorkspaces } from '../../fixtures';

describe('[Entity] API', () => {
  describe('GET /api/v1/[entity]', () => {
    // List endpoint tests
  });

  describe('POST /api/v1/[entity]', () => {
    // Create endpoint tests
  });

  describe('GET /api/v1/[entity]/:id', () => {
    // Get by ID tests
  });

  describe('PUT /api/v1/[entity]/:id', () => {
    // Update tests
  });

  describe('DELETE /api/v1/[entity]/:id', () => {
    // Delete tests
  });
});
```

### Phase 6: Workflow Tests

**File**: `apps/api/tests/integration/knowledge-creation-workflow.test.ts` - **TO BE CREATED**
```typescript
import { describe, it, expect } from 'bun:test';
import { authenticatedRequest, expectSuccessResponse } from './helpers/api';

describe('Knowledge Creation Workflow', () => {
  it('should create complete knowledge structure', async () => {
    // 1. Create workspace
    const workspaceResponse = await authenticatedRequest('admin')
      .post('/api/v1/workspaces')
      .send({
        name: 'Integration Test Workspace',
        description: 'Created during integration testing'
      });
    
    expect(workspaceResponse.status).toBe(201);
    const workspaceId = workspaceResponse.body.data.id;

    // 2. Create first note
    const note1Response = await authenticatedRequest('admin')
      .post('/api/v1/notes')
      .send({
        workspaceId,
        title: 'First Note',
        content: 'Content of the first note'
      });
    
    expect(note1Response.status).toBe(201);
    const note1Id = note1Response.body.data.id;

    // 3. Create second note
    const note2Response = await authenticatedRequest('admin')
      .post('/api/v1/notes')
      .send({
        workspaceId,
        title: 'Second Note',
        content: 'Content of the second note'
      });
    
    expect(note2Response.status).toBe(201);
    const note2Id = note2Response.body.data.id;

    // 4. Create tags
    const tag1Response = await authenticatedRequest('admin')
      .post('/api/v1/tags')
      .send({
        workspaceId,
        name: 'test-tag',
        color: '#ff0000'
      });
    
    expect(tag1Response.status).toBe(201);
    const tagId = tag1Response.body.data.id;

    // 5. Tag the notes
    const tagNote1Response = await authenticatedRequest('admin')
      .post('/api/v1/note-tags')
      .send({
        noteId: note1Id,
        tagId
      });
    
    expect(tagNote1Response.status).toBe(201);

    // 6. Create link between notes
    const linkResponse = await authenticatedRequest('admin')
      .post('/api/v1/links')
      .send({
        sourceNoteId: note1Id,
        targetNoteId: note2Id,
        linkType: 'references'
      });
    
    expect(linkResponse.status).toBe(201);

    // 7. Verify the complete structure
    const workspaceNotesResponse = await authenticatedRequest('admin')
      .get(`/api/v1/notes?workspaceId=${workspaceId}`);
    
    expect(workspaceNotesResponse.status).toBe(200);
    expect(workspaceNotesResponse.body.data.length).toBe(2);
  });
});
```

### Phase 7: Error Handling Tests

**File**: `apps/api/tests/integration/validation.test.ts` - **TO BE CREATED**
```typescript
import { describe, it, expect } from 'bun:test';
import { authenticatedRequest, expectErrorResponse } from './helpers/api';
import { testWorkspaces } from '../../fixtures';

describe('Input Validation', () => {
  describe('Zod Schema Validation', () => {
    it('should validate note creation schema', async () => {
      const invalidData = {
        workspaceId: 'not-a-uuid',
        title: '', // Empty string
        content: null // Invalid type
      };

      const response = await authenticatedRequest('admin')
        .post('/api/v1/notes')
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expectErrorResponse(response);
      expect(response.body.error).toContain('validation');
    });

    it('should validate workspace creation schema', async () => {
      const response = await authenticatedRequest('admin')
        .post('/api/v1/workspaces')
        .send({
          name: '', // Empty name should fail
          description: null
        });
      
      expect(response.status).toBe(400);
      expectErrorResponse(response);
    });
  });
});
```

## Implementation Steps for AI Agent

### ✅ Step 1: Environment Preparation - **COMPLETE**
1. ✅ Test services created: `docker-compose -f docker/docker-compose.test.yml up -d`
2. ✅ Environment loading fixed: `createConfig.ts` loads `.env.test`
3. ✅ TypeScript config updated: Excludes test files from compilation
4. ✅ Initial test confirmed working: `apps/api/tests/init.test.ts`

### ✅ Step 2: Foundation Files - **COMPLETE**
1. ✅ Create `apps/api/tests/integration/config/database.ts` - **IMPLEMENTED** (`setupTestDatabase`, `clearTestData`, `createTestData`)
2. ~~Setup files~~ - **REMOVED** (each test manages its own lifecycle)
3. ✅ Create `apps/api/tests/fixtures/index.ts` - **IMPLEMENTED** (shared fixture data)
4. ✅ Create `apps/api/tests/integration/helpers/api.ts` - **COMPLETED** (`authenticatedRequest`, response helpers)

### ⭕ Step 3: Core Tests - **TODO**
1. ⭕ Implement authentication tests
2. ⭕ Implement authorization tests  
3. ⭕ Implement notes endpoint tests
4. ⭕ Add test scripts to package.json

### ⭕ Step 4: Run and Debug - **TODO**
1. ⭕ Run: `bun test` to verify basic functionality
2. ⭕ Fix any database connection or configuration issues
3. ⭕ Adjust test data and fixtures as needed

### ⭕ Step 5: Expand Coverage - **TODO**
1. ⭕ Add remaining endpoint tests (workspaces, tags, links, diffs)
2. ⭕ Add workflow tests
3. ⭕ Add error handling tests

### ⭕ Step 6: Optimization - **TODO**
1. ⭕ Ensure tests run in parallel without conflicts
2. ⭕ Add test coverage reporting
3. ⭕ Configure CI/CD integration

## Success Criteria

- [x] ✅ Test environment setup with isolated services
- [x] ✅ Environment configuration loading `.env.test` correctly  
- [x] ✅ TypeScript compilation excludes test files
- [x] ✅ Basic test infrastructure working
- [ ] ⭕ All authentication scenarios tested (401, 403 cases)
- [ ] ⭕ All CRUD endpoints tested with proper status codes
- [ ] ⭕ Permission system thoroughly validated
- [ ] ⭕ Version increment logic tested
- [ ] ⭕ Input validation tested (Zod schemas)
- [ ] ⭕ Database relationships tested
- [ ] ⭕ Workflow scenarios tested
- [ ] ⭕ Test suite runs in <2 minutes
- [ ] ⭕ 90%+ code coverage on controllers and services

## Expected File Structure After Implementation

```
apps/api/
├── tests/                           # Root test directory
│   ├── fixtures/                    # ✅ Shared fixture data (single source of truth)
│   │   └── index.ts                 # ✅ Implemented with test users/workspaces
│   ├── init.test.ts                 # ✅ Already exists
│   └── integration/                 # Integration-specific tests
│       ├── config/
│       │   └── database.ts          # ✅ Implemented (setupTestDatabase, createTestData)
│       ├── helpers/
│       │   └── api.ts              # ✅ Implemented (authenticatedRequest, response helpers)
│       ├── auth.test.ts            # ✅ Created (empty)
│       ├── notes.test.ts           # ✅ Created (empty)
│       ├── authorization.test.ts   # TO BE CREATED
│       ├── workspaces.test.ts      # TO BE CREATED
│       ├── tags.test.ts            # TO BE CREATED
│       ├── note-tags.test.ts       # TO BE CREATED
│       ├── links.test.ts           # TO BE CREATED
│       ├── diffs.test.ts           # TO BE CREATED
│       ├── knowledge-creation-workflow.test.ts  # TO BE CREATED
│       └── validation.test.ts      # TO BE CREATED
├── tsconfig.json                   # ✅ Updated to exclude tests
└── package.json                    # (test scripts to be added)
```

**Future structure can include:**
```
├── tests/
│   ├── fixtures/                   # Shared
│   ├── unit/                       # Unit test specific
│   │   ├── helpers/
│   │   └── *.test.ts
│   ├── integration/                # Integration test specific (each test manages lifecycle)
│   └── e2e/                        # E2E test specific
```

## Notes for AI Implementation

1. **Database Connection**: Use test-specific database to avoid conflicts
2. **Data Isolation**: Each test should clean up after itself
3. **Real Dependencies**: Use actual database, mock external services only
4. **Error Testing**: Test all error paths and status codes
5. **Performance**: Optimize for fast test execution
6. **Maintainability**: Follow consistent patterns across all test files

This guide provides a complete implementation plan for comprehensive integration testing that matches the API architecture and testing strategy outlined in the existing documentation.