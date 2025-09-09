import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { AppHTTPException } from '../AppHTTPException';

/**
 * Interface for the raw packet error from the mysql2 driver.
 */
interface MySqlDriverError extends Error {
    code: string;
    errno: number;
    sql: string;
    sqlState: string;
    sqlMessage: string;
}

// This is a simplified version. A real implementation might inspect the constraint name.
function getConstraintType(err: QueryFailedError): 'unique' | 'foreign' | 'other' {
    const driverError = err.driverError as MySqlDriverError;
    if (driverError?.code === 'ER_DUP_ENTRY') {
        return 'unique';
    }
    // Add more checks for other constraint types if needed
    return 'other';
}

export function convertTypeORMError(err: Error): AppHTTPException | null {
    if (err instanceof QueryFailedError) {
        const constraintType = getConstraintType(err);
        if (constraintType === 'unique') {
            return new AppHTTPException(409, {
                message: 'Resource already exists with this unique constraint.',
            });
        }
        // For other query errors, return a generic 500
        return new AppHTTPException(500, { message: 'A database error occurred.' });
    }

    if (err instanceof EntityNotFoundError) {
        return new AppHTTPException(404, { message: 'The requested resource was not found.' });
    }

    // If it's not a TypeORM error we can handle, return null
    return null;
}
