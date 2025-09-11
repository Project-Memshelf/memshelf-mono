import { WorkspacesDbService } from '@repo/database';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { container } from '../config';

export const workspaceMiddleware = (requiredPermission: 'read' | 'write' = 'read') => {
    return createMiddleware(async (c, next) => {
        const workspaceDbService = container.resolve(WorkspacesDbService);
        const workspaceId = c.req.param('workspaceId');
        const user = c.get('currentUser');

        if (!user) {
            throw new HTTPException(401, { message: 'Unauthorized' });
        }

        if (!workspaceId) {
            throw new HTTPException(400, { message: 'Missing workspace parameter' });
        }
        const workspace = await workspaceDbService.findById(workspaceId);
        if (!workspace) {
            throw new HTTPException(404, { message: 'Workspace not found' });
        }
        const { hasPermission, canWrite } = await workspaceDbService.permissionCheck(workspace, user);

        if (!hasPermission) {
            throw new HTTPException(403, { message: 'You do not have read permissions to the workspace' });
        }

        if (requiredPermission === 'write' && !canWrite) {
            throw new HTTPException(403, { message: 'You do not have write permissions to the workspace' });
        }

        c.set('workspace', workspace);

        await next();
    });
};
