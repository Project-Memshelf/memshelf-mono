import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config';
import { appRoutes } from './routes';

const honoApp = new Hono();

// Setup middleware
honoApp.use(
    '*',
    cors({
        origin: config.apiServer.cors.origins ?? [],
    })
);
honoApp.use('*', logger());
honoApp.route('/', appRoutes);
export { honoApp };
