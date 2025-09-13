import { Hono } from 'hono';
import { container } from '../../config';
import { WorkspacesController } from '../../controllers';
import type { AppEnv } from '../../http-server';
import { authMiddleware } from '../../middleware/auth';

const workspacesController = container.resolve(WorkspacesController);
const v1Routes = new Hono<AppEnv>();
const workspaceRoutes = new Hono<AppEnv>();

workspaceRoutes.use('*', authMiddleware);
workspaceRoutes.get('/', (c) => workspacesController.list(c));
workspaceRoutes.post('/', (c) => workspacesController.create(c));
workspaceRoutes.get('/:id', (c) => workspacesController.read(c));
workspaceRoutes.put('/:id', (c) => workspacesController.update(c));
workspaceRoutes.delete('/:id', (c) => workspacesController.delete(c));

v1Routes.route('/workspaces', workspaceRoutes);

export { v1Routes };
