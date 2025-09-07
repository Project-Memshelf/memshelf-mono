import { closeDatabase, DataSource, initializeDatabase } from '@repo/database';
import { AppLogger } from '@repo/shared-services';
import { serve } from 'bun';
import { config, container } from './config';
import { honoApp } from './http-server';

async function startServer() {
    const dataSource = container.resolve(DataSource);
    const logger = container.resolve(AppLogger);

    // Initialize database connection
    await initializeDatabase(dataSource);
    logger.info('✅ Database connection initialized');

    const { hostname, port } = config.apiServer;
    const server = serve({
        port,
        hostname,
        fetch: honoApp.fetch,
    });

    logger.info({ hostname, port }, 'HTTP server started');

    return { server, logger, dataSource };
}

// Start the server
const { server, logger, dataSource } = await startServer();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.stop();
    await closeDatabase(dataSource);
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await server.stop();
    process.exit(0);
});
