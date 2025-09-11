import { describe, expect, it } from 'bun:test';
import { ERROR_CODES, type ErrorCode } from '../../../../src/errors/codes';

describe('Error Codes', () => {
    describe('ERROR_CODES object', () => {
        it('contains all expected error codes', () => {
            expect(ERROR_CODES).toMatchObject({
                // General
                INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
                UNKNOWN_ERROR: 'UNKNOWN_ERROR',

                // Validation & Resource
                VALIDATION_FAILED: 'VALIDATION_FAILED',
                RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
                DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

                // Authentication & Authorization
                AUTH_REQUIRED: 'AUTH_REQUIRED',
                AUTH_FAILED: 'AUTH_FAILED',
                FORBIDDEN: 'FORBIDDEN',

                // Database
                DB_ERROR: 'DB_ERROR',
            });
        });

        it('has string values for all codes', () => {
            Object.values(ERROR_CODES).forEach((code) => {
                expect(typeof code).toBe('string');
                expect(code.trim()).not.toBe('');
            });
        });

        it('uses consistent uppercase naming', () => {
            Object.keys(ERROR_CODES).forEach((key) => {
                expect(key).toBe(key.toUpperCase());
                expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
            });
        });

        it('has no duplicate values', () => {
            const values = Object.values(ERROR_CODES);
            const uniqueValues = new Set(values);
            expect(values.length).toBe(uniqueValues.size);
        });
    });

    describe('ErrorCode type', () => {
        it('correctly types all error codes', () => {
            const testCodes: ErrorCode[] = [
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                ERROR_CODES.UNKNOWN_ERROR,
                ERROR_CODES.VALIDATION_FAILED,
                ERROR_CODES.RESOURCE_NOT_FOUND,
                ERROR_CODES.DUPLICATE_RESOURCE,
                ERROR_CODES.AUTH_REQUIRED,
                ERROR_CODES.AUTH_FAILED,
                ERROR_CODES.FORBIDDEN,
                ERROR_CODES.DB_ERROR,
            ];

            testCodes.forEach((code) => {
                expect(typeof code).toBe('string');
            });
        });

        it('prevents invalid error codes', () => {
            // This should fail TypeScript compilation if uncommented:
            // const invalidCode: ErrorCode = 'INVALID_CODE';
        });

        it('allows assignment of valid error codes', () => {
            let code: ErrorCode;
            code = ERROR_CODES.VALIDATION_FAILED;
            code = ERROR_CODES.AUTH_FAILED;
            code = ERROR_CODES.RESOURCE_NOT_FOUND;

            expect(typeof code).toBe('string');
        });
    });

    describe('Code categorization', () => {
        it('has general error codes', () => {
            expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBeDefined();
            expect(ERROR_CODES.UNKNOWN_ERROR).toBeDefined();
        });

        it('has validation error codes', () => {
            expect(ERROR_CODES.VALIDATION_FAILED).toBeDefined();
            expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBeDefined();
            expect(ERROR_CODES.DUPLICATE_RESOURCE).toBeDefined();
        });

        it('has authentication error codes', () => {
            expect(ERROR_CODES.AUTH_REQUIRED).toBeDefined();
            expect(ERROR_CODES.AUTH_FAILED).toBeDefined();
            expect(ERROR_CODES.FORBIDDEN).toBeDefined();
        });

        it('has database error codes', () => {
            expect(ERROR_CODES.DB_ERROR).toBeDefined();
        });
    });

    describe('Code semantics', () => {
        it('uses descriptive names', () => {
            expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
            expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
            expect(ERROR_CODES.AUTH_FAILED).toBe('AUTH_FAILED');
        });

        it('avoids cryptic abbreviations', () => {
            // Should be AUTH_REQUIRED, not AUTH_REQ
            expect(ERROR_CODES.AUTH_REQUIRED).toBe('AUTH_REQUIRED');
            // Should be INTERNAL_SERVER_ERROR, not INT_SRV_ERR
            expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
        });

        it('uses consistent terminology', () => {
            // All auth-related codes should contain AUTH
            expect(ERROR_CODES.AUTH_REQUIRED).toContain('AUTH');
            expect(ERROR_CODES.AUTH_FAILED).toContain('AUTH');

            // All resource-related codes should be clear
            expect(ERROR_CODES.RESOURCE_NOT_FOUND).toContain('RESOURCE');
            expect(ERROR_CODES.DUPLICATE_RESOURCE).toContain('RESOURCE');
        });
    });

    describe('Const assertion', () => {
        it('has literal string types', () => {
            // This ensures the object has literal string types, not just string
            const code = ERROR_CODES.VALIDATION_FAILED;

            // Should be typed as literal string, not just string
            expect(code).toBe('VALIDATION_FAILED');
            expect(typeof code).toBe('string');

            // Verify it's a literal type (this would fail if not const)
            const literal: 'VALIDATION_FAILED' = code;
            expect(literal).toBe('VALIDATION_FAILED');
        });
    });
});
