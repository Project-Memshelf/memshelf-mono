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
        it('should only return workspaces user has access to', async () => {
            // Create workspace as user1
            const postBody = { name: `User1 Workspace${Date.now()}`, description: 'some description' };
            const createResponse = await authenticatedRequest('/api/v1/workspaces', {
                method: 'POST',
                body: JSON.stringify(postBody),
            });
            await expectSuccessResponse(createResponse, 201);

            // List workspaces - should only see workspaces for this user
            const response = await authenticatedRequest('/api/v1/workspaces');
            const responseData = (await expectPaginatedResponse(response)) as SuccessResponsePaginated<WorkspaceEntity>;
            expect(responseData.data.some((w) => w.name === postBody.name)).toBeTrue();
        });
    });
});
