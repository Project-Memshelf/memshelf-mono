export const ERROR_CODES = {
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
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
