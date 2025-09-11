import { describe, expect, it } from 'bun:test';
import { AppHTTPException } from '../../../../src/errors/AppHTTPException';
import { convertAuthError } from '../../../../src/errors/converters/auth-converter';

// Mock authentication error classes
class JsonWebTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JsonWebTokenError';
    }
}

class TokenExpiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TokenExpiredError';
    }
}

class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

describe('Auth Error Converter', () => {
    describe('Authentication errors (401)', () => {
        it('converts JsonWebTokenError to 401', () => {
            const error = new JsonWebTokenError('invalid signature');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
            expect(result?.message).toBe('Authentication failed.');
        });

        it('converts TokenExpiredError to 401', () => {
            const error = new TokenExpiredError('jwt expired');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
            expect(result?.message).toBe('Authentication failed.');
        });

        it('converts AuthenticationError to 401', () => {
            const error = new AuthenticationError('Invalid credentials');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
            expect(result?.message).toBe('Authentication failed.');
        });

        it('converts error with invalid signature message to 401', () => {
            const error = new Error('invalid signature');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
            expect(result?.message).toBe('Authentication failed.');
        });

        it('handles case-insensitive signature check', () => {
            const error = new Error('INVALID SIGNATURE');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
        });
    });

    describe('Authorization errors (403)', () => {
        it('converts AuthorizationError to 403', () => {
            const error = new AuthorizationError('Insufficient permissions');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(403);
            expect(result?.message).toBe('You do not have permission to perform this action.');
        });

        it('converts ForbiddenError to 403', () => {
            const error = new ForbiddenError('Access denied');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(403);
            expect(result?.message).toBe('You do not have permission to perform this action.');
        });
    });

    describe('Unsupported error types', () => {
        it('returns null for generic Error', () => {
            const error = new Error('Some random error');
            const result = convertAuthError(error);

            expect(result).toBeNull();
        });

        it('returns null for validation errors', () => {
            const error = new Error('Validation failed: name is required');
            const result = convertAuthError(error);

            expect(result).toBeNull();
        });

        it('returns null for database errors', () => {
            const error = new Error('Database connection failed');
            const result = convertAuthError(error);

            expect(result).toBeNull();
        });

        it('returns null for null/undefined', () => {
            const result1 = convertAuthError(null as unknown as Error);
            const result2 = convertAuthError(undefined as unknown as Error);

            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });
    });

    describe('Edge cases', () => {
        it('handles empty error message', () => {
            const error = new JsonWebTokenError('');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
        });

        it('handles error with no name property', () => {
            const error = Object.create(Error.prototype);
            error.message = 'invalid signature';
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
        });

        it('prioritizes constructor.name over message for auth errors', () => {
            const error = new JsonWebTokenError('some other message');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
        });

        it('handles mixed case in error names', () => {
            class jsonwebtokenerror extends Error {
                constructor(message: string) {
                    super(message);
                    this.name = 'jsonwebtokenerror';
                }
            }

            const error = new jsonwebtokenerror('test');
            const result = convertAuthError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(401);
        });
    });
});
