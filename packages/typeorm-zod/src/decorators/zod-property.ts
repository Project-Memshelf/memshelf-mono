import type { z } from 'zod';
import 'reflect-metadata';
import { ZOD_METADATA_KEY, type ZodValidationMetadata } from './metadata';

/**
 * Simple decorator to associate Zod validation with a property
 * Usage: @ZodProperty(z.string().min(1).max(255))
 */
export function ZodProperty(zodSchema: z.ZodTypeAny) {
    return (target: object, propertyKey: string | symbol) => {
        const constructorFunc = (target as { constructor: new (...args: unknown[]) => unknown }).constructor;
        const existingMetadata: ZodValidationMetadata[] = Reflect.getMetadata(ZOD_METADATA_KEY, constructorFunc) || [];

        existingMetadata.push({
            propertyKey: String(propertyKey),
            zodSchema,
        });

        Reflect.defineMetadata(ZOD_METADATA_KEY, existingMetadata, constructorFunc);
    };
}
