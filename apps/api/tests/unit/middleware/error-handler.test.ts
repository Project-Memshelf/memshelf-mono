import { describe, expect, it } from 'bun:test';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { z } from 'zod';
import { config } from '../../../src/config';
import { ERROR_CODES } from '../../../src/errors/codes';
import { errorHandler } from '../../../src/middleware/error-handler';

// Mock Error classes for testing purposes
class JsonWebTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JsonWebTokenError';
    }
}

class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

function createTestContext() {
    let response: { body: unknown; status: number } | null = null;

    return {
        json: (body: unknown, status: number) => {
            response = { body, status };
            return new Response();
        },
        get: (key: string) => {
            if (key === 'requestId') {
                return 'test-request-id';
            }
            return undefined;
        },
        getLastResponse: () => response,
    } as unknown as Context & { getLastResponse(): { body: unknown; status: number } | null };
}

describe('Error Handler', () => {
    it('handles HTTPException with message', () => {
        const context = createTestContext();
        const error = new HTTPException(404, { message: 'Resource not found' });

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(404);
        expect(response?.body).toMatchObject({
            success: false,
            error: {
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
                message: 'Resource not found',
                requestId: 'test-request-id',
            },
        });
    });

    it('handles ZodError with validation details', () => {
        const context = createTestContext();
        const schema = z.object({ name: z.string().min(1) });

        let zodError: unknown;
        try {
            schema.parse({ name: '' });
        } catch (e) {
            zodError = e;
        }

        if (!(zodError instanceof Error)) {
            throw new Error('Expected ZodError to be thrown');
        }

        errorHandler(zodError, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(400);
        expect(response?.body).toMatchObject({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION_FAILED,
                message: expect.stringContaining('Validation failed'),
                validationErrors: expect.any(Array),
            },
        });
    });

    it('handles generic errors as 500', () => {
        const context = createTestContext();
        const error = new Error('Something broke');

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(500);
        expect(response?.body).toMatchObject({
            success: false,
            error: {
                code: ERROR_CODES.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
            },
        });
    });

    it('handles EntityNotFoundError as 404', () => {
        const context = createTestContext();
        const error = new EntityNotFoundError('User', {});

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(404);
        expect(response?.body).toMatchObject({
            error: {
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
                message: 'The requested resource was not found.',
            },
        });
    });

    it('handles duplicate entry QueryFailedError as 409', () => {
        const context = createTestContext();
        const error = new QueryFailedError('query', [], { code: 'ER_DUP_ENTRY' });

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(409);
        expect(response?.body).toMatchObject({
            error: {
                code: ERROR_CODES.DUPLICATE_RESOURCE,
                message: 'Resource already exists with this unique constraint.',
            },
        });
    });

    it('handles other QueryFailedError as 500', () => {
        const context = createTestContext();
        const error = new QueryFailedError('query', [], { code: 'SOME_OTHER_ERROR' });

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(500);
        expect(response?.body).toMatchObject({
            error: {
                code: ERROR_CODES.DB_ERROR,
                message: 'A database error occurred.',
            },
        });
    });

    it('handles authentication errors as 401', () => {
        const context = createTestContext();
        const error = new JsonWebTokenError('invalid signature');

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(401);
        expect(response?.body).toMatchObject({
            error: {
                code: ERROR_CODES.AUTH_FAILED,
                message: 'Authentication failed.',
            },
        });
    });

    it('handles authorization errors as 403', () => {
        const context = createTestContext();
        const error = new AuthorizationError('Permission denied');

        errorHandler(error, context);

        const response = context.getLastResponse();
        expect(response?.status).toBe(403);
        expect(response?.body).toMatchObject({
            error: {
                code: ERROR_CODES.FORBIDDEN,
                message: 'You do not have permission to perform this action.',
            },
        });
    });

    it('includes stack trace in development mode', () => {
        config.nodeEnv.isDevelopment = true;
        const context = createTestContext();
        const error = new Error('test error');

        errorHandler(error, context);

        const response = context.getLastResponse();
        const body = response?.body as { error: { stack?: string } };
        expect(body.error).toHaveProperty('stack');
        expect(body.error.stack).toContain('Error: test error');
        config.nodeEnv.isDevelopment = false; // Reset for other tests
    });

    it('does not include stack trace in production mode', () => {
        config.nodeEnv.isDevelopment = false;
        const context = createTestContext();
        const error = new Error('test error');

        errorHandler(error, context);

        const response = context.getLastResponse();
        const body = response?.body as { error: { stack?: string } };
        expect(body.error).not.toHaveProperty('stack');
    });
});
