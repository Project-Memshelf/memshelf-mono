export interface ValidationError {
    path: string;
    message: string;
    code: string;
    received?: unknown;
}
