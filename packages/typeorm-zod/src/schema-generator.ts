import { z } from 'zod';
import { getMetadata } from './metadata-store';

type ConstructorFunction = new (...args: unknown[]) => unknown;

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
 * Get all metadata from entity class including inheritance chain
 */
function getAllMetadata(
    entityClass: ConstructorFunction
): Array<{ propertyKey: string; zodSchema: z.ZodTypeAny; columnOptions?: unknown }> {
    const allMetadata: Array<{ propertyKey: string; zodSchema: z.ZodTypeAny; columnOptions?: unknown }> = [];
    const seenProperties = new Set<string>();

    // Walk up the prototype chain to collect metadata from all classes
    let currentClass: ConstructorFunction | null = entityClass;

    while (currentClass) {
        const metadata = getMetadata(currentClass);

        // Add metadata from current class (child properties override parent properties)
        metadata.forEach((item) => {
            if (!seenProperties.has(item.propertyKey)) {
                allMetadata.push(item);
                seenProperties.add(item.propertyKey);
            }
        });

        // Move to parent class
        currentClass = Object.getPrototypeOf(currentClass);

        // Stop at Object.prototype or Function.prototype
        if (!currentClass || currentClass === Object || (currentClass as unknown) === Function) {
            break;
        }
    }

    return allMetadata;
}

/**
 * Extract Zod schema from entity class with decorators using WeakMap storage and inheritance
 */
export function createZodFromEntity<T>(
    entityClass: new () => T,
    options: SchemaGenerationOptions = {}
): z.ZodObject<z.ZodRawShape> {
    const validationMetadata = getAllMetadata(entityClass);

    if (validationMetadata.length === 0) {
        throw new Error(
            `No Zod validation metadata found for entity ${String(entityClass.name)}. ` +
                'Make sure to use @ZodProperty or @ZodColumn decorators on entity properties.'
        );
    }

    const shape: Record<string, z.ZodTypeAny> = {};

    validationMetadata.forEach(({ propertyKey, zodSchema, columnOptions }) => {
        let finalSchema = zodSchema;

        // Apply custom transforms if provided
        if (options.transforms?.[propertyKey]) {
            finalSchema = options.transforms[propertyKey](finalSchema);
        }

        // Apply TypeORM column constraints to Zod schema
        if (columnOptions) {
            const colOptions = columnOptions as Record<string, unknown>;
            // Check if schema has these methods before calling them
            const hasIsOptional = typeof zodSchema.isOptional === 'function';
            const hasIsNullable = typeof zodSchema.isNullable === 'function';

            if (
                colOptions.nullable &&
                (!hasIsOptional || !zodSchema.isOptional()) &&
                (!hasIsNullable || !zodSchema.isNullable())
            ) {
                finalSchema = finalSchema.nullable();
            }

            // Add default values from TypeORM to Zod (if not already present)
            if (colOptions.default !== undefined && !(zodSchema instanceof z.ZodDefault)) {
                finalSchema = finalSchema.default(colOptions.default);
            }
        }

        shape[propertyKey] = finalSchema;
    });

    return z.object(shape);
}

/**
 * Create comprehensive schema collection from entity class using WeakMap storage and inheritance
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
