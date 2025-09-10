import { describe, expect, it } from 'bun:test';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { AppHTTPException } from '../../../../src/errors/AppHTTPException';
import { convertTypeORMError } from '../../../../src/errors/converters/typeorm-converter';

interface MySqlDriverError extends Error {
    code?: string;
    errno?: number;
    sql?: string;
    sqlState?: string;
    sqlMessage?: string;
}

describe('TypeORM Error Converter', () => {
    describe('QueryFailedError handling', () => {
        it('converts duplicate entry error to 409', () => {
            const driverError: MySqlDriverError = {
                name: 'DriverError',
                code: 'ER_DUP_ENTRY',
                message: 'Duplicate entry for key',
            };

            const error = new QueryFailedError<MySqlDriverError>(
                'INSERT INTO users (name, email) VALUES (?, ?)',
                [],
                driverError
            );
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(409);
            expect(result?.message).toBe('Resource already exists with this unique constraint.');
        });

        it('converts other QueryFailedError to 500', () => {
            const driverError: MySqlDriverError = {
                name: 'DriverError',
                code: 'ER_NO_SUCH_TABLE',
                message: 'Table does not exist',
            };

            const error = new QueryFailedError<MySqlDriverError>('SELECT * FROM users WHERE id = ?', [], driverError);
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(500);
            expect(result?.message).toBe('A database error occurred.');
        });

        it('handles QueryFailedError without driverError code', () => {
            const driverError: MySqlDriverError = {
                name: 'DriverError',
                message: 'Some database error',
            };

            const error = new QueryFailedError<MySqlDriverError>('SELECT * FROM users WHERE id = ?', [], driverError);
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(500);
        });

        it('handles QueryFailedError with null driverError', () => {
            const error = new QueryFailedError<MySqlDriverError>('SELECT *...', [], {
                name: 'DriverError',
                message: 'Database error',
            });
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(500);
        });

        it('returns null for non-TypeORM QueryFailedError', () => {
            const error = new Error('Some database error') as QueryFailedError;
            const result = convertTypeORMError(error);

            expect(result).toBeNull();
        });
    });

    describe('EntityNotFoundError handling', () => {
        it('converts EntityNotFoundError to 404', () => {
            const error = new EntityNotFoundError('User', { id: 123 });
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(404);
            expect(result?.message).toBe('The requested resource was not found.');
        });

        it('handles EntityNotFoundError with different target types', () => {
            const error = new EntityNotFoundError('Post', { slug: 'test-post' });
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(404);
        });
    });

    describe('Unsupported error types', () => {
        it('returns null for generic Error', () => {
            const error = new Error('Some random error');
            const result = convertTypeORMError(error);

            expect(result).toBeNull();
        });

        it('returns null for null/undefined', () => {
            const result1 = convertTypeORMError(null as unknown as Error);
            const result2 = convertTypeORMError(undefined as unknown as Error);

            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });

        it('returns null for non-TypeORM errors', () => {
            class CustomError extends Error {}
            const error = new CustomError('Custom error');
            const result = convertTypeORMError(error);

            expect(result).toBeNull();
        });
    });

    describe('Edge cases', () => {
        it('handles empty QueryFailedError', () => {
            const error = new QueryFailedError<MySqlDriverError>('', [], {
                name: 'DriverError',
                message: 'Empty error',
            });
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(500);
        });

        it('handles EntityNotFoundError with empty criteria', () => {
            const error = new EntityNotFoundError('User', {});
            const result = convertTypeORMError(error);

            expect(result).toBeInstanceOf(AppHTTPException);
            expect(result?.status).toBe(404);
        });
    });
});
