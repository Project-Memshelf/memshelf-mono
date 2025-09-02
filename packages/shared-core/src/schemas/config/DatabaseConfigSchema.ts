import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
    database: z.string(),
    logging: z.boolean(),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
