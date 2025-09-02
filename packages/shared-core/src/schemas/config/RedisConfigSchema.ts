import { z } from 'zod';

export const RedisConfigSchema = z.object({
    host: z.string(),
    port: z.number().int().positive(),
    password: z.string().optional(),
    db: z.number().int().min(0).default(0),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;
