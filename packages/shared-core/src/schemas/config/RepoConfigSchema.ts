import { z } from 'zod';
import { nodeEnvs } from '../../types';
import { DatabaseConfigSchema } from './DatabaseConfigSchema';
import { LoggerConfigSchema } from './LoggerConfigSchema';
import { RedisConfigSchema } from './RedisConfigSchema';

export const RepoConfigSchema = z.object({
    nodeEnv: z.object({
        env: z.enum(nodeEnvs),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
    database: DatabaseConfigSchema,
    logger: LoggerConfigSchema,
    redis: RedisConfigSchema,
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;
