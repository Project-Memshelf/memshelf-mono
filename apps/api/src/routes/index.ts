import { Hono } from 'hono';
import { healthRoutes } from './health';
import { v1Routes } from './v1';

const appRoutes = new Hono();

// Mount health routes
appRoutes.route('/', healthRoutes);

// Mount v1 routes
appRoutes.route('/api/v1', v1Routes);

export { appRoutes };
