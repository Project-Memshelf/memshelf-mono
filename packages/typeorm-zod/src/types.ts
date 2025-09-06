import type { z } from 'zod';

/**
 * Utility type to infer TypeScript types from generated schemas
 */
export type InferEntitySchemas<T extends Record<string, z.ZodObject<z.ZodRawShape>>> = {
    [K in keyof T]: z.infer<T[K]>;
};

/**
 * Common entity schema type patterns
 */
export interface CommonEntitySchemas {
    full: z.ZodObject<z.ZodRawShape>;
    create: z.ZodObject<z.ZodRawShape>;
    update: z.ZodObject<z.ZodRawShape>;
    patch: z.ZodObject<z.ZodRawShape>;
    query: z.ZodObject<z.ZodRawShape>;
}

/**
 * Utility to extract DTO types from entity schemas
 */
export type EntityDTOs<T extends CommonEntitySchemas> = {
    Full: z.infer<T['full']>;
    Create: z.infer<T['create']>;
    Update: z.infer<T['update']>;
    Patch: z.infer<T['patch']>;
    Query: z.infer<T['query']>;
};

/**
 * Base interface for entities with common fields
 */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
