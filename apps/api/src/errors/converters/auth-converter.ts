import { AppHTTPException } from '../AppHTTPException';

// This is a placeholder. In a real app, you would import error classes from your auth library.
const AUTH_ERROR_NAMES = ['JsonWebTokenError', 'TokenExpiredError', 'AuthenticationError'];
const FORBIDDEN_ERROR_NAMES = ['AuthorizationError', 'ForbiddenError'];

export function convertAuthError(err: Error): AppHTTPException | null {
    if (!err || !err.constructor) {
        return null;
    }

    const errorName = err.constructor.name;
    const errorNameLower = errorName.toLowerCase();
    const errorMessage = err.message?.toLowerCase() || '';

    if (
        AUTH_ERROR_NAMES.includes(errorName) ||
        AUTH_ERROR_NAMES.some((name) => errorNameLower.includes(name.toLowerCase())) ||
        AUTH_ERROR_NAMES.some((name) => errorMessage.includes(name.toLowerCase())) ||
        errorMessage.includes('invalid signature')
    ) {
        return new AppHTTPException(401, { message: 'Authentication failed.' });
    }

    if (
        FORBIDDEN_ERROR_NAMES.includes(errorName) ||
        FORBIDDEN_ERROR_NAMES.some((name) => errorNameLower.includes(name.toLowerCase())) ||
        FORBIDDEN_ERROR_NAMES.some((name) => errorMessage.includes(name.toLowerCase()))
    ) {
        return new AppHTTPException(403, { message: 'You do not have permission to perform this action.' });
    }

    return null;
}
