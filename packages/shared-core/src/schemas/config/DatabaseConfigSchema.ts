import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
    url: z.string().url(),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
