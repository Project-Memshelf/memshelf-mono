import type { FindOptionsWhere } from 'typeorm';
import { z } from 'zod';

// Zod validation schemas for runtime type checking
const OrderRecordSchema = z.record(z.string(), z.enum(['ASC', 'DESC']));
const RelationsArraySchema = z.array(z.string());
const WhereQuerySchema = z.record(z.string(), z.unknown());

export const PaginationOptionsSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    where: z.optional(WhereQuerySchema),
    order: z.optional(OrderRecordSchema),
    relations: z.optional(RelationsArraySchema),
});

export const PaginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    });

export type PaginationOptions<T = Record<string, unknown>> = {
    page?: number;
    limit?: number;
    where?: FindOptionsWhere<T>;
    order?: Record<string, 'ASC' | 'DESC'>;
    relations?: string[];
};

export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
