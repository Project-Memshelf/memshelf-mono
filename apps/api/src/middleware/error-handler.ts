import { AppLogger } from '@repo/shared-services';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import { config, container } from '../config';
import { AppHTTPException } from '../errors/AppHTTPException';
import { ERROR_CODES, type ErrorCode } from '../errors/codes';
import { convertAuthError } from '../errors/converters/auth-converter';
import { convertTypeORMError } from '../errors/converters/typeorm-converter';
import { convertZodError } from '../errors/converters/zod-converter';

// biome-ignore lint/suspicious/noExplicitAny: <Workaround for complex TS/DI type inference issue>
function convertToHttpException(err: Error, logger: any): AppHTTPException {
    if (err instanceof AppHTTPException) {
        logger.warn({ error: err }, 'AppHTTPException passed through');
        return err;
    }
    if (err instanceof HTTPException) {
        logger.warn({ error: err }, 'HTTPException passed through');
        return new AppHTTPException(err.status, { message: err.message, cause: err.cause });
    }

    if (err instanceof ZodError) {
        const exception = convertZodError(err);
        logger.warn(
            { error: err, validationErrors: exception.validationErrors },
            'Zod validation error converted to HTTP 400'
        );
        return exception;
    }

    const authException = convertAuthError(err);
    if (authException) {
        logger.warn({ error: err }, `Authentication/authorization error converted to HTTP ${authException.status}`);
        return authException;
    }

    const dbException = convertTypeORMError(err);
    if (dbException) {
        if (dbException.status >= 500) {
            logger.error({ error: err }, 'Database error converted to HTTP Exception');
        } else {
            logger.warn({ error: err }, 'Database error converted to HTTP Exception');
        }
        return dbException;
    }

    // Default fallback for any other error
    logger.error({ error: err }, 'Unhandled error converted to HTTP Exception');
    return new AppHTTPException(500, { message: 'Internal server error' });
}

function getErrorCode(err: Error, exception: AppHTTPException): ErrorCode {
    if (exception.status === 400) {
        return ERROR_CODES.VALIDATION_FAILED;
    }
    if (exception.status === 401) {
        return ERROR_CODES.AUTH_FAILED;
    }
    if (exception.status === 403) {
        return ERROR_CODES.FORBIDDEN;
    }
    if (exception.status === 404) {
        return ERROR_CODES.RESOURCE_NOT_FOUND;
    }
    if (exception.status === 409) {
        return ERROR_CODES.DUPLICATE_RESOURCE;
    }
    if (err instanceof QueryFailedError) {
        return ERROR_CODES.DB_ERROR;
    }
    return ERROR_CODES.INTERNAL_SERVER_ERROR;
}

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
    const requestId = c.get('requestId');

    const httpException = convertToHttpException(err, logger);
    const errorCode = getErrorCode(err, httpException);

    const body = {
        success: false,
        error: {
            code: errorCode,
            message: httpException.message || getDefaultErrorMessage(httpException.status),
            timestamp: new Date().toISOString(),
            requestId,
            ...(config.nodeEnv.isDevelopment && { stack: err.stack }),
            ...((httpException as AppHTTPException).validationErrors && {
                validationErrors: (httpException as AppHTTPException).validationErrors,
            }),
        },
    };
    return c.json(body, httpException.status);
}
