import { AppLogger } from '@repo/shared-services';
import { Hono } from 'hono';
import { container } from '../config';

const healthRoutes = new Hono();

healthRoutes.get('/health', async (c) => {
    const logger = container.resolve(AppLogger);
    logger.debug('Health check requested');

    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'memshelf-api',
    });
});

export { healthRoutes };
