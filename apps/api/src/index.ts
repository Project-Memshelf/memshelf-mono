import { AppLogger } from '@repo/shared-services';
import { serve } from 'bun';
import { config, container } from './config';
import { honoApp } from './http-server';

const logger = container.resolve(AppLogger);
const { hostname, port } = config.apiServer;
serve({
    port,
    hostname,
    fetch: honoApp.fetch,
});

logger.info({ hostname, port }, 'HTTP server started');
