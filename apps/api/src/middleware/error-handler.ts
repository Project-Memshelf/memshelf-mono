import { AppLogger } from '@repo/shared-services';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { container } from '../config';

// Default error messages for HTTP status codes
function getDefaultErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return 'Bad Request';
        case 401:
            return 'Unauthorized';
        case 403:
            return 'Forbidden';
        case 404:
            return 'Not Found';
        case 500:
            return 'Internal Server Error';
        default:
            return 'Unknown Error';
    }
}

/**
 * Global error handler middleware with consistent HTTPException handling
 * Handles Zod validation errors, HTTP exceptions, and unexpected errors
 */
export function errorHandler(err: Error, c: Context) {
    const logger = container.resolve(AppLogger);
    logger.error({ err });
    let httpException: HTTPException;

    if (err instanceof HTTPException) {
        httpException = err;
        logger.warn({ error: err }, 'HTTP Exception');
    } else if (err.constructor.name === 'ZodError') {
        // Handle Zod validation errors as 400 Bad Request
        // Using constructor.name for better resilience across different Zod instances
        httpException = new HTTPException(400, {
            message: 'Validation error',
        });
        logger.warn({ error: err }, 'Zod validation error converted to HTTP 400');
    } else {
        // Convert any error to HTTPException for consistent handling
        httpException = new HTTPException(500, {
            message: 'Internal server error',
        });
        logger.error({ error: err }, 'Unhandled error converted to HTTP Exception');
    }

    const body = {
        success: false,
        error: {
            code: httpException.status,
            message: httpException.message || getDefaultErrorMessage(httpException.status),
            timestamp: new Date().toISOString(),
        },
    };
    return c.json(body, httpException.status);
}
