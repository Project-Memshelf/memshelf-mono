import { Column, type ColumnOptions } from 'typeorm';
import type { z } from 'zod';
import 'reflect-metadata';
import { ZOD_METADATA_KEY, type ZodValidationMetadata } from './metadata';

/**
 * Enhanced decorator that combines @Column and Zod validation
 * Usage: @ZodColumn({ length: 255 }, z.string().min(1).max(255))
 */
export function ZodColumn(columnOptions: ColumnOptions, zodSchema: z.ZodTypeAny) {
    return (target: object, propertyKey: string | symbol) => {
        // Apply TypeORM @Column decorator
        Column(columnOptions)(target, propertyKey);

        // Store our enhanced metadata
        const constructorFunc = (target as { constructor: new (...args: unknown[]) => unknown }).constructor;
        const existingMetadata: ZodValidationMetadata[] = Reflect.getMetadata(ZOD_METADATA_KEY, constructorFunc) || [];

        // Check for duplicate property decorators
        const propertyKeyStr = String(propertyKey);
        const existingIndex = existingMetadata.findIndex((item) => item.propertyKey === propertyKeyStr);

        if (existingIndex >= 0) {
            throw new Error(
                `Duplicate @ZodColumn decorator detected for property "${propertyKeyStr}" in entity ${constructorFunc.name}. ` +
                    'Multiple decorators on the same property are not supported. Please use only one decorator per property.'
            );
        }

        existingMetadata.push({
            propertyKey: propertyKeyStr,
            zodSchema,
            columnOptions,
        });

        Reflect.defineMetadata(ZOD_METADATA_KEY, existingMetadata, constructorFunc);
    };
}
