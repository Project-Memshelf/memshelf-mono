import type { z } from 'zod';
import { addMetadata, hasPropertyMetadata } from '../metadata-store';

/**
 * Enhanced ZodProperty decorator using WeakMap-based metadata storage
 * This prevents metadata pollution between different entity classes
 * Usage: @ZodProperty(z.string().min(1).max(255))
 */
export function ZodProperty(zodSchema: z.ZodTypeAny) {
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

        // Add metadata using WeakMap storage
        addMetadata(constructorFunc, {
            propertyKey: propertyKeyStr,
            zodSchema,
        });
    };
}
