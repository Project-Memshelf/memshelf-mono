import type { ZodError, ZodIssue } from 'zod';
import { AppHTTPException } from '../AppHTTPException';
import type { ValidationError } from '../types/error-types';

export function formatZodErrors(zodError: ZodError): ValidationError[] {
    return (
        zodError.errors?.map((issue: ZodIssue) => ({
            path: issue.path.join('.') || 'root',
            message: issue.message,
            code: issue.code,
            ...('received' in issue && { received: issue.received }),
        })) || []
    );
}

export function convertZodError(zodError: ZodError): AppHTTPException {
    const validationErrors = formatZodErrors(zodError);
    const message = `Validation failed: ${validationErrors.map((e) => `${e.path}: ${e.message}`).join(', ')}`;

    const exception = new AppHTTPException(400, {
        message,
    });

    // Attach validation errors to the exception for the final response body.
    exception.validationErrors = validationErrors;

    return exception;
}
