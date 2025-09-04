import { z } from 'zod';

export const ApiServerConfig = z.object({
    hostname: z.string().default('127.0.0.1'),
    port: z.number().min(1).max(65535).default(3000),
    cors: z.object({
        origins: z.array(z.string()).optional(),
    }),
});
