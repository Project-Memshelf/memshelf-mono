/**
 * @memshelf/typeorm-zod
 *
 * Zero-duplication TypeORM + Zod integration with decorators.
 * Eliminate the need for separate entity definitions, validation schemas, and TypeScript types.
 */

// Re-export commonly used zod types for convenience
export { z } from 'zod';

// Main decorators
export { ZOD_METADATA_KEY, ZodColumn, ZodProperty, type ZodValidationMetadata } from './decorators';
export type {
    EntitySchemas,
    SchemaGenerationOptions,
} from './schema-generator';
// Schema generation
export {
    createCreateSchema,
    createEntitySchemas,
    createUpdateSchema,
    createZodFromEntity,
} from './schema-generator';
// Types and utilities
export type {
    BaseEntity,
    CommonEntitySchemas,
    EntityDTOs,
    InferEntitySchemas,
} from './types';
