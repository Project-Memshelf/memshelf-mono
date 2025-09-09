import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { AppHTTPException } from '../../../../src/errors/AppHTTPException';
import { convertZodError, formatZodErrors } from '../../../../src/errors/converters/zod-converter';

describe('Zod Error Converter', () => {
    describe('formatZodErrors', () => {
        it('formats basic validation errors', () => {
            const schema = z.object({
                name: z.string().min(1),
                email: z.string().email(),
            });

            try {
                schema.parse({ name: '', email: 'invalid' });
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }

                const formatted = formatZodErrors(error);

                expect(formatted).toHaveLength(2);
                expect(formatted[0]).toMatchObject({
                    path: 'name',
                    message: expect.stringContaining('at least 1'),
                    code: 'too_small',
                });
                expect(formatted[1]).toMatchObject({
                    path: 'email',
                    message: expect.stringContaining('email'),
                    code: 'invalid_string',
                });
            }
        });

        it('handles nested object paths', () => {
            const schema = z.object({
                user: z.object({
                    profile: z.object({
                        age: z.number().min(18),
                    }),
                }),
            });

            try {
                schema.parse({ user: { profile: { age: 15 } } });
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }

                const formatted = formatZodErrors(error);

                expect(formatted[0]).toMatchObject({
                    path: 'user.profile.age',
                    message: expect.stringContaining('18'),
                    code: 'too_small',
                });
            }
        });

        it('includes received value when available', () => {
            const schema = z.string();

            try {
                schema.parse(123);
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }

                const formatted = formatZodErrors(error);

                expect(formatted[0]).toMatchObject({
                    path: 'root',
                    message: expect.stringContaining('string'),
                    code: 'invalid_type',
                    received: 'number',
                });
            }
        });

        it('returns empty array for no errors', () => {
            const zodError = new z.ZodError([]);
            const formatted = formatZodErrors(zodError);
            expect(formatted).toEqual([]);
        });

        it('handles array indices in paths', () => {
            const schema = z.array(z.string().min(1));

            try {
                schema.parse(['valid', '', 'valid']);
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }

                const formatted = formatZodErrors(error);

                expect(formatted[0]).toMatchObject({
                    path: '1',
                    message: expect.stringContaining('at least 1'),
                    code: 'too_small',
                });
            }
        });
    });

    describe('convertZodError', () => {
        it('converts ZodError to AppHTTPException with 400 status', () => {
            const schema = z.object({ name: z.string().min(1) });

            let zodError: z.ZodError;
            try {
                schema.parse({ name: '' });
                throw new Error('Should have thrown');
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }
                zodError = error;
            }

            const exception = convertZodError(zodError);

            expect(exception).toBeInstanceOf(AppHTTPException);
            expect(exception.status).toBe(400);
            expect(exception.message).toContain('Validation failed');
            expect(exception.validationErrors).toHaveLength(1);
            expect(exception.validationErrors?.[0]).toMatchObject({
                path: 'name',
                code: 'too_small',
            });
        });

        it('includes all validation errors in message', () => {
            const schema = z.object({
                name: z.string().min(1),
                email: z.string().email(),
            });

            let zodError: z.ZodError;
            try {
                schema.parse({ name: '', email: 'invalid' });
                throw new Error('Should have thrown');
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }
                zodError = error;
            }

            const exception = convertZodError(zodError);

            expect(exception.message).toContain('name');
            expect(exception.message).toContain('email');
            expect(exception.validationErrors).toHaveLength(2);
        });

        it('handles complex nested validation errors', () => {
            const schema = z.object({
                users: z.array(
                    z.object({
                        name: z.string().min(1),
                        age: z.number().min(18),
                    })
                ),
            });

            let zodError: z.ZodError;
            try {
                schema.parse({ users: [{ name: '', age: 15 }] });
                throw new Error('Should have thrown');
            } catch (error) {
                if (!(error instanceof z.ZodError)) {
                    throw error;
                }
                zodError = error;
            }

            const exception = convertZodError(zodError);

            expect(exception.status).toBe(400);
            expect(exception.validationErrors).toHaveLength(2);
            expect(exception.validationErrors?.[0].path).toBe('users.0.name');
            expect(exception.validationErrors?.[1].path).toBe('users.0.age');
        });
    });
});
