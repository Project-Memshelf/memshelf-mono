import { AppLogger } from '@repo/shared-services';
import { serve } from 'bun';
import { config, container } from './config';
import { honoApp } from './http-server';

const logger = container.resolve(AppLogger);
const { hostname, port } = config.apiServer;
const server = serve({
    port,
    hostname,
    fetch: honoApp.fetch,
});

logger.info({ hostname, port }, 'HTTP server started');

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.stop();
    process.exit(0);
});
