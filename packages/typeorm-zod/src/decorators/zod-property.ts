import type { z } from 'zod';
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

        const zodSchema = isObjectSyntax ? schemaOrOptions.schema : (schemaOrOptions as z.ZodTypeAny);
        const skip = isObjectSyntax ? schemaOrOptions.skip : undefined;

        // Add metadata using WeakMap storage
        addMetadata(constructorFunc, {
            propertyKey: propertyKeyStr,
            zodSchema,
            skip,
        });
    };
}
