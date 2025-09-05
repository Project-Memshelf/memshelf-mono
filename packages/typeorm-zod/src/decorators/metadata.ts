import type { ColumnOptions } from 'typeorm';
import type { z } from 'zod';

// Metadata key for storing Zod validation rules
export const ZOD_METADATA_KEY = Symbol('zod:validation');

// Enhanced metadata that includes both TypeORM and Zod info
export interface ZodValidationMetadata {
    propertyKey: string;
    zodSchema: z.ZodTypeAny;
    columnOptions?: ColumnOptions;
}
