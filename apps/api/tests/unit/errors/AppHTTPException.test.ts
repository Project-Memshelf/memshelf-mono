import { describe, expect, it } from 'bun:test';
import { HTTPException } from 'hono/http-exception';
import { AppHTTPException } from '../../../src/errors/AppHTTPException';
import type { ValidationError } from '../../../src/errors/types/error-types';

describe('AppHTTPException', () => {
    it('extends HTTPException', () => {
        const exception = new AppHTTPException(400, { message: 'Test error' });
        expect(exception).toBeInstanceOf(HTTPException);
        expect(exception).toBeInstanceOf(AppHTTPException);
    });

    it('has correct status and message', () => {
        const exception = new AppHTTPException(404, { message: 'Not found' });
        expect(exception.status).toBe(404);
        expect(exception.message).toBe('Not found');
    });

    it('accepts validation errors', () => {
        const validationErrors: ValidationError[] = [
            { path: 'name', message: 'Name is required', code: 'invalid_type' },
            { path: 'email', message: 'Invalid email format', code: 'invalid_string' },
        ];

        const exception = new AppHTTPException(400, { message: 'Validation failed' });
        exception.validationErrors = validationErrors;

        expect(exception.validationErrors).toEqual(validationErrors);
        expect(exception.validationErrors).toHaveLength(2);
    });

    it('works without validation errors', () => {
        const exception = new AppHTTPException(500, { message: 'Server error' });
        expect(exception.validationErrors).toBeUndefined();
    });

    it('preserves HTTPException properties', () => {
        const exception = new AppHTTPException(401, {
            message: 'Unauthorized',
            cause: new Error('Original error'),
        });

        expect(exception.status).toBe(401);
        expect(exception.message).toBe('Unauthorized');
        expect(exception.cause).toBeInstanceOf(Error);
    });
});
