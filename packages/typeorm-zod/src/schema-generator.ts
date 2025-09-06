import { z } from 'zod';
import 'reflect-metadata';
import { ZOD_METADATA_KEY, type ZodValidationMetadata } from './decorators';

/**
 * Schema generation options
 */
export interface SchemaGenerationOptions {
    /** Fields to omit from create schema (in addition to defaults) */
    omitFromCreate?: string[];
    /** Fields to omit from update schema */
    omitFromUpdate?: string[];
    /** Custom field transformations */
    transforms?: Record<string, (schema: z.ZodTypeAny) => z.ZodTypeAny>;
}

/**
 * Generated schema collection
 */
export interface EntitySchemas<_T = Record<string, unknown>> {
    /** Full entity schema - includes all fields */
    full: z.ZodObject<z.ZodRawShape>;
    /** Create schema - omits auto-generated fields */
    create: z.ZodObject<z.ZodRawShape>;
    /** Update schema - id required, everything else optional */
    update: z.ZodObject<z.ZodRawShape>;
    /** Patch schema - all fields optional */
    patch: z.ZodObject<z.ZodRawShape>;
    /** Query schema - for filtering/searching (all optional) */
    query: z.ZodObject<z.ZodRawShape>;
}

/**
 * Extract Zod schema from entity class with decorators
 */
export function createZodFromEntity<T>(
    entityClass: new () => T,
    options: SchemaGenerationOptions = {}
): z.ZodObject<z.ZodRawShape> {
    const validationMetadata: ZodValidationMetadata[] = Reflect.getMetadata(ZOD_METADATA_KEY, entityClass) || [];

    if (validationMetadata.length === 0) {
        throw new Error(
            `No Zod validation metadata found for entity ${entityClass.name}. ` +
                'Make sure to use @ZodProperty or @ZodColumn decorators on entity properties.'
        );
    }

    const shape: Record<string, z.ZodTypeAny> = {};
    const seenKeys = new Set<string>();

    validationMetadata.forEach(({ propertyKey, zodSchema, columnOptions }) => {
        if (seenKeys.has(propertyKey)) {
            throw new Error(
                `Duplicate Zod validation metadata detected for property "${propertyKey}" in entity ${entityClass.name}. ` +
                    'Multiple decorators on the same property are not supported. Please merge or remove duplicates.'
            );
        }
        seenKeys.add(propertyKey);

        let finalSchema = zodSchema;

        // Apply custom transforms if provided
        if (options.transforms?.[propertyKey]) {
            finalSchema = options.transforms[propertyKey](finalSchema);
        }

        // Apply TypeORM column constraints to Zod schema
        if (columnOptions) {
            // Check if schema has these methods before calling them
            const hasIsOptional = typeof zodSchema.isOptional === 'function';
            const hasIsNullable = typeof zodSchema.isNullable === 'function';

            if (
                columnOptions.nullable &&
                (!hasIsOptional || !zodSchema.isOptional()) &&
                (!hasIsNullable || !zodSchema.isNullable())
            ) {
                finalSchema = finalSchema.nullable();
            }

            // Add default values from TypeORM to Zod (if not already present)
            if (columnOptions.default !== undefined && !(zodSchema instanceof z.ZodDefault)) {
                finalSchema = finalSchema.default(columnOptions.default);
            }
        }

        shape[propertyKey] = finalSchema;
    });

    return z.object(shape);
}

/**
 * Create comprehensive schema collection from entity class
 */
export function createEntitySchemas<T>(
    entityClass: new () => T,
    options: SchemaGenerationOptions = {}
): EntitySchemas<T> {
    const fullSchema = createZodFromEntity(entityClass, options);

    // Default fields to omit from create schema
    const defaultCreateOmit = ['id', 'createdAt', 'updatedAt', 'deletedAt'];
    const createOmitFields = [...defaultCreateOmit, ...(options.omitFromCreate || [])];

    // Create omit object for create schema
    const createOmitObject = createOmitFields.reduce(
        (acc, field) => {
            acc[field] = true;
            return acc;
        },
        {} as Record<string, true>
    );

    return {
        // Full entity schema
        full: fullSchema,

        // Create schema - omit auto-generated fields
        create: fullSchema.omit(createOmitObject),

        // Update schema - require id, make everything else optional
        update: fullSchema.partial().required({ id: true }),

        // Patch schema - all optional
        patch: fullSchema.partial(),

        // Query schema - for filtering/searching (all optional)
        query: fullSchema.partial(),
    };
}

/**
 * Extract just the create schema (convenience function)
 */
export function createCreateSchema<T>(
    entityClass: new () => T,
    options?: SchemaGenerationOptions
): z.ZodObject<z.ZodRawShape> {
    return createEntitySchemas(entityClass, options).create;
}

/**
 * Extract just the update schema (convenience function)
 */
export function createUpdateSchema<T>(
    entityClass: new () => T,
    options?: SchemaGenerationOptions
): z.ZodObject<z.ZodRawShape> {
    return createEntitySchemas(entityClass, options).update;
}
