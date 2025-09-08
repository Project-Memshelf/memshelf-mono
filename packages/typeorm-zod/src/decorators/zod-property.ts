import { z } from 'zod';
import { addMetadata, hasPropertyMetadata } from '../metadata-store';
import type { SchemaVariant } from './metadata';

// ZodProperty decorator options
export interface ZodPropertyOptions {
    schema: z.ZodTypeAny;
    skip?: SchemaVariant[];
}

/**
 * Enhanced ZodProperty decorator using WeakMap-based metadata storage
 * This prevents metadata pollution between different entity classes
 *
 * Usage:
 * @ZodProperty(z.string().min(1).max(255)) // Legacy syntax
 * @ZodProperty({ schema: z.string().min(1), skip: ['create'] }) // New syntax
 */
export function ZodProperty(schemaOrOptions: z.ZodTypeAny | ZodPropertyOptions): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const constructorFunc = (target as { constructor: new (...args: unknown[]) => unknown }).constructor;
        const propertyKeyStr = String(propertyKey);

        // Check for duplicate property decorators using WeakMap storage
        if (hasPropertyMetadata(constructorFunc, propertyKeyStr)) {
            throw new Error(
                `Duplicate @ZodProperty decorator detected for property "${propertyKeyStr}" in entity ${String(constructorFunc.name)}. ` +
                    'Multiple decorators on the same property are not supported. Please use only one decorator per property.'
            );
        }

        // Handle both legacy syntax and new object syntax
        const isObjectSyntax = schemaOrOptions && typeof schemaOrOptions === 'object' && 'schema' in schemaOrOptions;

        let zodSchema: z.ZodTypeAny;
        let skip: SchemaVariant[] | undefined;

        if (isObjectSyntax) {
            // Validate schema property
            if (!schemaOrOptions.schema || !(schemaOrOptions.schema instanceof z.ZodType)) {
                throw new Error(
                    `ZodProperty decorator: 'schema' property is missing or is not a valid Zod schema for property '${propertyKeyStr}' on '${constructorFunc.name}'.`
                );
            }
            zodSchema = schemaOrOptions.schema;
            skip = schemaOrOptions.skip;
        } else {
            // Validate legacy syntax schema
            if (!(schemaOrOptions instanceof z.ZodType)) {
                throw new Error(
                    `ZodProperty decorator: Expected a Zod schema for property '${propertyKeyStr}' on '${constructorFunc.name}'.`
                );
            }
            zodSchema = schemaOrOptions;
        }

        // Add metadata using WeakMap storage
        addMetadata(constructorFunc, {
            propertyKey: propertyKeyStr,
            zodSchema,
            skip,
        });
    };
}
