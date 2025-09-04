import { z } from 'zod';
import { nodeEnvs } from '../../types';
import { ApiServerConfigSchema } from './ApiServerConfigSchema';
import { DatabaseConfigSchema } from './DatabaseConfigSchema';
import { LoggerConfigSchema } from './LoggerConfigSchema';
import { QueueConfigSchema } from './QueueConfigSchema';
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
    apiServer: ApiServerConfigSchema,
    queues: QueueConfigSchema,
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;
