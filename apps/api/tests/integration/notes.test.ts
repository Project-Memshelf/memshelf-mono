import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { testWorkspaces } from '../fixtures';
import { resetTestData, setupTestDatabase } from './config/database';
import {
    authenticatedRequest,
    expectErrorResponse,
    expectPaginatedResponse,
    expectSuccessResponse,
} from './helpers/api';

describe('Notes API', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    beforeEach(async () => {
        await resetTestData();
    });

    describe('GET /api/v1/notes', () => {
        it('should list notes with pagination', async () => {
            const response = await authenticatedRequest(`/api/v1/notes?workspaceId=${testWorkspaces.engineering.id}`);

            await expectPaginatedResponse(response);
        });

        it('should require workspaceId parameter', async () => {
            const response = await authenticatedRequest('/api/v1/notes');

            await expectErrorResponse(response, 400);
        });

        it('should respect pagination parameters', async () => {
            const response = await authenticatedRequest(
                `/api/v1/notes?workspaceId=${testWorkspaces.engineering.id}&page=1&limit=5`
            );

            const body = await expectPaginatedResponse(response);
            expect(body.pagination.page).toBe(1);
            expect(body.pagination.limit).toBe(5);
        });

        it('should validate workspace access', async () => {
            // Assuming jane doesn't have access to engineering workspace
            const response = await authenticatedRequest(
                `/api/v1/notes?workspaceId=${testWorkspaces.engineering.id}`,
                {},
                'jane'
            );

            await expectErrorResponse(response, 403);
        });
    });

    describe('POST /api/v1/notes', () => {
        it('should create note with valid data', async () => {
            const noteData = {
                workspaceId: testWorkspaces.engineering.id,
                title: 'Integration Test Note',
                content: 'This is a test note created during integration testing.',
            };

            const response = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData),
            });

            expect(response.status).toBe(201);
            const body = await expectSuccessResponse(response);
            expect(body.data).toMatchObject({
                title: noteData.title,
                content: noteData.content,
                workspaceId: noteData.workspaceId,
                version: 1,
            });
            expect(body.data).toHaveProperty('id');
            expect(typeof body.data.id).toBe('string');
        });

        it('should validate required fields', async () => {
            const response = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    // Missing title and content
                }),
            });

            await expectErrorResponse(response, 400);
        });

        it('should validate workspace access for creation', async () => {
            const response = await authenticatedRequest(
                '/api/v1/notes',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workspaceId: testWorkspaces.engineering.id,
                        title: 'Unauthorized Note',
                        content: 'This should fail',
                    }),
                },
                'jane'
            ); // Jane doesn't have write access to engineering

            await expectErrorResponse(response, 403);
        });

        it('should validate invalid workspace ID', async () => {
            const response = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: 'invalid-uuid',
                    title: 'Test Note',
                    content: 'Test content',
                }),
            });

            await expectErrorResponse(response, 400);
        });
    });

    describe('GET /api/v1/notes/:id', () => {
        it('should get note by id', async () => {
            // First create a note
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'Test Note for Retrieval',
                    content: 'This note will be retrieved',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Then retrieve it
            const response = await authenticatedRequest(`/api/v1/notes/${noteId}`);

            expect(response.status).toBe(200);
            const body = await expectSuccessResponse(response);
            expect(body.data.id).toBe(noteId);
            expect(body.data.title).toBe('Test Note for Retrieval');
        });

        it('should return 404 for non-existent note', async () => {
            const response = await authenticatedRequest('/api/v1/notes/00000000-0000-4000-8000-000000000999');

            await expectErrorResponse(response, 404);
        });

        it('should validate workspace access for note retrieval', async () => {
            // Create note as admin in engineering workspace
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'Private Note',
                    content: 'This should not be accessible to jane',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Try to access as jane (no access to engineering workspace)
            const response = await authenticatedRequest(`/api/v1/notes/${noteId}`, {}, 'jane');

            await expectErrorResponse(response, 403);
        });
    });

    describe('PUT /api/v1/notes/:id', () => {
        it('should update note and increment version', async () => {
            // Create note
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'Original Title',
                    content: 'Original content',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Update note
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content',
            };

            const response = await authenticatedRequest(`/api/v1/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            expect(response.status).toBe(200);
            const body = await expectSuccessResponse(response);
            expect(body.data.version).toBe(2);
            expect(body.data.title).toBe(updateData.title);
            expect(body.data.content).toBe(updateData.content);
        });

        it('should increment version only when content changes', async () => {
            // Create note
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'Test Title',
                    content: 'Test content',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Update with same content
            const response = await authenticatedRequest(`/api/v1/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Title',
                    content: 'Test content',
                }),
            });

            expect(response.status).toBe(200);
            const body = await expectSuccessResponse(response);
            expect(body.data.version).toBe(1); // Should not increment
        });

        it('should require write permissions for update', async () => {
            // Create note as admin
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'Test Note',
                    content: 'Test content',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Try to update as jane (read-only access)
            const response = await authenticatedRequest(
                `/api/v1/notes/${noteId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: 'Unauthorized Update',
                        content: 'This should fail',
                    }),
                },
                'jane'
            );

            await expectErrorResponse(response, 403);
        });

        it('should return 404 for non-existent note update', async () => {
            const response = await authenticatedRequest('/api/v1/notes/00000000-0000-4000-8000-000000000999', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Updated Title',
                    content: 'Updated content',
                }),
            });

            await expectErrorResponse(response, 404);
        });
    });

    describe('DELETE /api/v1/notes/:id', () => {
        it('should soft delete note', async () => {
            // Create note
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'To Delete',
                    content: 'This will be deleted',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Delete note
            const response = await authenticatedRequest(`/api/v1/notes/${noteId}`, {
                method: 'DELETE',
            });

            expect(response.status).toBe(204);

            // Verify note is no longer accessible
            const getResponse = await authenticatedRequest(`/api/v1/notes/${noteId}`);
            expect(getResponse.status).toBe(404);
        });

        it('should require write permissions for deletion', async () => {
            // Create note as admin
            const createResponse = await authenticatedRequest('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: testWorkspaces.engineering.id,
                    title: 'Protected Note',
                    content: 'Should not be deletable by jane',
                }),
            });

            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const noteId = createBody.data.id;

            // Try to delete as jane (read-only access)
            const response = await authenticatedRequest(
                `/api/v1/notes/${noteId}`,
                {
                    method: 'DELETE',
                },
                'jane'
            );

            await expectErrorResponse(response, 403);
        });

        it('should return 404 for non-existent note deletion', async () => {
            const response = await authenticatedRequest('/api/v1/notes/00000000-0000-4000-8000-000000000999', {
                method: 'DELETE',
            });

            await expectErrorResponse(response, 404);
        });
    });
});
