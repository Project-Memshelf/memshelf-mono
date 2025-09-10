import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { WorkspacesDbService } from '@repo/database';
import { HTTPException } from 'hono/http-exception';
import { container } from '../../../src/config';
import { workspaceMiddleware } from '../../../src/middleware/workspace';
import { createMockNext, createTestContext, testUserData, testWorkspaceData } from '../helpers';

describe('Workspace Middleware', () => {
    // Mock the WorkspacesDbService
    const mockWorkspacesDbService = {
        findById: mock(),
        permissionCheck: mock(),
    };

    beforeEach(() => {
        // Register the mock before each test
        container.registerInstance(WorkspacesDbService, mockWorkspacesDbService as unknown as WorkspacesDbService);
    });

    afterEach(() => {
        // Clear the mock after each test
        container.clearInstances();
    });

    describe('Authentication validation', () => {
        it('should throw 401 when no user is authenticated', async () => {
            const context = createTestContext({
                currentUser: null,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            expect(workspaceMiddleware()(context, next)).rejects.toThrow(HTTPException);
            expect(workspaceMiddleware()(context, next)).rejects.toThrow('Unauthorized');
        });
    });

    describe('Workspace parameter validation', () => {
        it('should throw 400 when workspaceId is missing', async () => {
            const context = createTestContext({
                currentUser: testUserData.admin,
                params: {},
            });
            const next = createMockNext();
            expect(workspaceMiddleware()(context, next)).rejects.toThrow(HTTPException);
            expect(workspaceMiddleware()(context, next)).rejects.toThrow('Missing workspace parameter');
        });
    });

    describe('Workspace existence validation', () => {
        it('should throw 404 when workspace does not exist', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(null);

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            expect(workspaceMiddleware()(context, next)).rejects.toThrow(HTTPException);
            expect(workspaceMiddleware()(context, next)).rejects.toThrow('Workspace not found');

            expect(mockWorkspacesDbService.findById).toHaveBeenCalledWith(testWorkspaceData.workspace1.id);
        });

        it('should proceed when workspace exists', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: false,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            await workspaceMiddleware()(context, next);

            expect(mockWorkspacesDbService.findById).toHaveBeenCalledWith(testWorkspaceData.workspace1.id);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('Permission validation', () => {
        it('should throw 403 when user has no read permissions', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: false,
                canWrite: false,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            expect(workspaceMiddleware()(context, next)).rejects.toThrow(HTTPException);
            expect(workspaceMiddleware()(context, next)).rejects.toThrow(
                'You do not have read permissions to the workspace'
            );
        });

        it('should throw 403 when user has read but requires write permissions', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: false,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            expect(workspaceMiddleware('write')(context, next)).rejects.toThrow(HTTPException);
            expect(workspaceMiddleware('write')(context, next)).rejects.toThrow(
                'You do not have write permissions to the workspace'
            );
        });

        it('should proceed when user has read permissions for read access', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: false,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            await workspaceMiddleware('read')(context, next);

            expect(next).toHaveBeenCalled();
        });

        it('should proceed when user has write permissions for write access', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: true,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            await workspaceMiddleware('write')(context, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Context setting', () => {
        it('should set workspace in context when validation passes', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: true,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            await workspaceMiddleware()(context, next);

            expect(context.set).toHaveBeenCalledWith('workspace', testWorkspaceData.workspace1);
        });
    });

    describe('Default permission level', () => {
        it('should default to read permission when no permission level is specified', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: false,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            await workspaceMiddleware()(context, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Service resolution', () => {
        it('should resolve WorkspacesDbService from container', async () => {
            mockWorkspacesDbService.findById.mockResolvedValue(testWorkspaceData.workspace1);
            mockWorkspacesDbService.permissionCheck.mockResolvedValue({
                hasPermission: true,
                canWrite: false,
            });

            const context = createTestContext({
                currentUser: testUserData.admin,
                params: { workspaceId: testWorkspaceData.workspace1.id },
            });
            const next = createMockNext();

            await workspaceMiddleware()(context, next);

            expect(mockWorkspacesDbService.findById).toHaveBeenCalled();
            expect(mockWorkspacesDbService.permissionCheck).toHaveBeenCalled();
        });
    });
});
