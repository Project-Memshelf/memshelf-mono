import { z } from 'zod';

export const ApiServerConfigSchema = z.object({
    hostname: z.string().default('127.0.0.1'),
    port: z.number().min(1).max(65535).default(3000),
    timeout: z.number().min(0).default(30000),
    bodyLimit: z
        .number()
        .min(0)
        .default(1024 * 1024), // 1MB
    keepAliveTimeout: z.number().min(0).default(5000),
    cors: z.object({
        origins: z.array(z.string()).default([]),
    }),
    rateLimit: z.object({
        windowMs: z
            .number()
            .min(0)
            .default(15 * 60 * 1000),
        maxRequests: z.number().min(0).default(100),
    }),
});

export type ApiServerConfig = z.infer<typeof ApiServerConfigSchema>;
