import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { WorkspaceEntity } from '@repo/database';
import type { SuccessResponsePaginated, SuccessResponseSingle } from '../../src/controllers/BaseController';
import { honoApp } from '../../src/http-server';
import { testWorkspaces } from '../fixtures';
import { resetTestData, setupTestDatabase } from './config/database';
import {
    authenticatedRequest,
    expectErrorResponse,
    expectPaginatedResponse,
    expectSuccessResponse,
} from './helpers/api';

describe('Workspace Endpoints', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    beforeEach(async () => {
        await resetTestData();
    });

    describe('GET /workspaces', () => {
        it('should accept valid API key', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces');
            await expectSuccessResponse(response, 200);
        });

        it('should return empty array when user has no workspaces', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces', undefined, 'jack');
            await expectPaginatedResponse(response);
        });

        it('should return workspaces user has access to', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces', undefined, 'jane');
            const responseData = (await expectPaginatedResponse(response)) as SuccessResponsePaginated<WorkspaceEntity>;
            expect(responseData.data).toBeArray();
            expect(responseData.data.length).toBe(1);
            expect(responseData.data[0].id).toBe(testWorkspaces.design.id);
        });

        it('should support pagination parameters', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces?page=1&limit=10', undefined, 'jane');
            await expectPaginatedResponse(response, {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
        });

        it('should reject requests without API key', async () => {
            const response = await honoApp.request('/api/v1/workspaces');
            expect(response.status).toBe(401);
        });
    });

    describe('POST /workspaces', () => {
        it('should create workspace with valid data', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'New Workspace',
                    description: 'A new workspace for testing',
                }),
            });
            const responseData = await expectSuccessResponse(response, 201);
            expect(responseData.data).toHaveProperty('id');
            expect(responseData.data).toHaveProperty('name', 'New Workspace');
            expect(responseData.data).toHaveProperty('description', 'A new workspace for testing');
        });

        it('should create workspace with minimal valid data', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: 'Minimal Workspace' }),
            });
            const responseData = await expectSuccessResponse(response, 201);
            expect(responseData.data).toHaveProperty('name', 'Minimal Workspace');
        });

        it('should reject workspace creation without name', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ description: 'Workspace without name' }),
            });
            await expectErrorResponse(response, 400);
        });

        it('should reject workspace creation with empty name', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: '' }),
            });
            await expectErrorResponse(response, 400);
        });
    });

    describe('GET /workspaces/:id', () => {
        it('should return existing workspace', async () => {
            // First create a workspace
            const createResponse = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test Workspace for Get' }),
            });
            const createData = (await expectSuccessResponse(
                createResponse,
                201
            )) as SuccessResponseSingle<WorkspaceEntity>;
            const workspaceId = createData.data.id;

            // Then get it
            const response = await authenticatedRequest(`/api/v1/workspaces/${workspaceId}`);
            const responseData = (await expectSuccessResponse(response, 200)) as SuccessResponseSingle<WorkspaceEntity>;
            expect(responseData.data).toHaveProperty('id', workspaceId);
            expect(responseData.data).toHaveProperty('name', 'Test Workspace for Get');
        });

        it('should return 404 for non-existent workspace', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000');
            await expectErrorResponse(response, 404);
        });

        it('should return 404 for invalid UUID format', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces/invalid-uuid');
            await expectErrorResponse(response, 404);
        });
    });

    describe('PUT /workspaces/:id', () => {
        it('should update workspace with valid data', async () => {
            // First create a workspace
            const createResponse = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: 'Original Name' }),
            });

            const createData = (await expectSuccessResponse(
                createResponse,
                201
            )) as SuccessResponseSingle<WorkspaceEntity>;
            const workspaceId = createData.data.id;

            // Then update it
            const response = await authenticatedRequest(`/api/v1/workspaces/${workspaceId}`, {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated Name', description: 'Updated Description' }),
            });
            const responseData = (await expectSuccessResponse(response, 200)) as SuccessResponseSingle<WorkspaceEntity>;
            expect(responseData.data).toHaveProperty('name', 'Updated Name');
            expect(responseData.data).toHaveProperty('description', 'Updated Description');
        });

        it('should reject update with empty name', async () => {
            // First create a workspace
            const createResponse = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test Workspace' }),
            });
            const createData = (await expectSuccessResponse(
                createResponse,
                201
            )) as SuccessResponseSingle<WorkspaceEntity>;
            const workspaceId = createData.data.id;

            // Try to update with empty name
            const response = await authenticatedRequest(`/api/v1/workspaces/${workspaceId}`, {
                method: 'PUT',
                body: JSON.stringify({ name: '' }),
            });
            await expectErrorResponse(response, 400);
        });

        it('should return 404 when updating non-existent workspace', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            await expectErrorResponse(response, 404);
        });
    });

    describe('DELETE /workspaces/:id', () => {
        it('should delete existing workspace', async () => {
            // First create a workspace
            const createResponse = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: 'Workspace to Delete' }),
            });
            const createData = (await expectSuccessResponse(
                createResponse,
                201
            )) as SuccessResponseSingle<WorkspaceEntity>;
            const workspaceId = createData.data.id;

            // Then delete it
            const response = await authenticatedRequest(`/api/v1/workspaces/${workspaceId}`, {
                method: 'DELETE',
            });
            expect(response.status).toBe(204);

            // Verify it's deleted
            const getResponse = await authenticatedRequest(`/api/v1/workspaces/${workspaceId}`);
            await expectErrorResponse(getResponse, 404);
        });

        it('should return 404 when deleting non-existent workspace', async () => {
            const response = await authenticatedRequest('/api/v1/workspaces/550e8400-e29b-41d4-a716-446655440000', {
                method: 'DELETE',
            });
            await expectErrorResponse(response, 404);
        });
    });

    describe('Workspace Permissions', () => {
        it('should prevent user from accessing workspace they have no permissions for', async () => {
            // Try to access engineering workspace as jack (who has no permissions)
            const response = await authenticatedRequest(
                `/api/v1/workspaces/${testWorkspaces.engineering.id}`,
                undefined,
                'jack'
            );
            await expectErrorResponse(response, 403);
        });

        it('should prevent user with read-only access from updating workspace', async () => {
            // Try to update design workspace as jane (who has canWrite: false)
            const response = await authenticatedRequest(
                `/api/v1/workspaces/${testWorkspaces.design.id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ name: 'Updated Name' }),
                },
                'jane'
            );
            await expectErrorResponse(response, 403);
        });

        it('should prevent user with read-only access from deleting workspace', async () => {
            // Try to delete design workspace as jane (who has canWrite: false)
            const response = await authenticatedRequest(
                `/api/v1/workspaces/${testWorkspaces.design.id}`,
                {
                    method: 'DELETE',
                },
                'jane'
            );
            await expectErrorResponse(response, 403);
        });

        it('should not return deleted workspaces in list', async () => {
            // Create a workspace
            const createResponse = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name: 'Workspace to Delete' }),
            });
            const createData = (await expectSuccessResponse(
                createResponse,
                201
            )) as SuccessResponseSingle<WorkspaceEntity>;
            const workspaceId = createData.data.id;

            // Verify it appears in list
            const beforeDeleteResponse = await authenticatedRequest('/api/v1/workspaces');
            const beforeDeleteData = (await expectPaginatedResponse(
                beforeDeleteResponse
            )) as SuccessResponsePaginated<WorkspaceEntity>;
            expect(beforeDeleteData.data.some((w) => w.id === workspaceId)).toBeTrue();

            // Delete it
            const deleteResponse = await authenticatedRequest(`/api/v1/workspaces/${workspaceId}`, {
                method: 'DELETE',
            });
            expect(deleteResponse.status).toBe(204);

            // Verify it no longer appears in list
            const afterDeleteResponse = await authenticatedRequest('/api/v1/workspaces');
            const afterDeleteData = (await expectPaginatedResponse(
                afterDeleteResponse
            )) as SuccessResponsePaginated<WorkspaceEntity>;
            expect(afterDeleteData.data.some((w) => w.id === workspaceId)).toBeFalse();
        });
    });
});
