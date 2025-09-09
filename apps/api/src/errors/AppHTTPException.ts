import { HTTPException } from 'hono/http-exception';
import type { ValidationError } from './types/error-types';

export class AppHTTPException extends HTTPException {
    public validationErrors?: ValidationError[];
}
