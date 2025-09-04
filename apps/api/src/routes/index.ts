import { Hono } from 'hono';
import { healthRoutes } from './health';

const appRoutes = new Hono();

// Mount health routes
appRoutes.route('/', healthRoutes);

export { appRoutes };
