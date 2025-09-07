import type { User } from '@repo/database';
import { AppLogger } from '@repo/shared-services';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { config, container } from './config';
import { appRoutes } from './routes';

// Define the types for your context variables
type AppEnv = {
    Variables: {
        requestId: string;
        currentUser?: User;
    };
};

const honoApp = new Hono<AppEnv>();

// Setup middleware
honoApp.use(
    '*',
    cors({
        origin: config.apiServer.cors.origins ?? [],
    })
);

// Security headers
honoApp.use(
    '*',
    secureHeaders({
        contentSecurityPolicy: {
            defaultSrc: ["'self'"],
        },
        crossOriginEmbedderPolicy: false, // Adjust based on needs
    })
);

// Enhanced structured logging middleware using DI container logger
honoApp.use('*', async (c, next) => {
    const logger = container.resolve(AppLogger);
    const start = Date.now();
    const requestId = crypto.randomUUID();

    c.set('requestId', requestId);

    logger.info(
        {
            requestId,
            method: c.req.method,
            path: c.req.path,
            userAgent: c.req.header('user-agent'),
        },
        'Request started'
    );

    await next();

    const duration = Date.now() - start;
    logger.info(
        {
            requestId,
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
            duration,
        },
        'Request completed'
    );
});

// Development debug logging
if (config.nodeEnv.isDevelopment) {
    honoApp.use('*', async (c, next) => {
        const logger = container.resolve(AppLogger);
        const requestId = c.get('requestId'); // Get from logging middleware

        logger.debug(
            {
                requestId,
                headers: Object.fromEntries(c.req.raw.headers.entries()),
                query: c.req.query(),
            },
            '🔍 Debug request details'
        );

        await next();

        logger.debug(
            {
                requestId,
                responseHeaders: Object.fromEntries(c.res.headers.entries()),
            },
            '📤 Debug response details'
        );
    });
}

// Global error handler with consistent HTTPException handling
honoApp.onError((err, c) => {
    const logger = container.resolve(AppLogger);

    let httpException: HTTPException;

    if (err instanceof HTTPException) {
        httpException = err;
        logger.warn({ error: err }, 'HTTP Exception');
    } else {
        // Convert any error to HTTPException for consistent handling
        httpException = new HTTPException(500, {
            message: 'Internal server error',
        });
        logger.error({ error: err }, 'Unhandled error converted to HTTP Exception');
    }

    return c.json(
        {
            error: {
                code: httpException.status,
                message: httpException.message,
                timestamp: new Date().toISOString(),
            },
        },
        httpException.status
    );
});

honoApp.route('/', appRoutes);
export { honoApp };
