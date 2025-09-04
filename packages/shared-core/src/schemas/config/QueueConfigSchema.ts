import { z } from 'zod';

export const QueueConfigSchema = z.object({
    name: z.string().optional(),
    processEvery: z.string().optional().default('10 seconds'),
    maxConcurrency: z.number().optional().default(20),
    defaultConcurrency: z.number().optional(),
    lockLimit: z.number().optional(),
    defaultLockLimit: z.number().optional(),
    defaultLockLifetime: z.number().optional(),
    dbUrl: z
        .string()
        .url()
        .regex(/^mongodb:\/\//, 'Must be a MongoDB connection string'),
});
export type QueueConfig = z.infer<typeof QueueConfigSchema>;
