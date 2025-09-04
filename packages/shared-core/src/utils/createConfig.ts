import dotenv from 'dotenv';
import { merge } from 'ts-deepmerge';
import type { LoggerConfig } from '../schemas';
import { type RepoConfig, RepoConfigSchema } from '../schemas';
import { type DeepPartial, NodeEnv } from '../types';

dotenv.config({
    quiet: true,
    debug: false,
    path: ['../../.env'],
});

const defaultConfig: DeepPartial<RepoConfig> = {
    nodeEnv: {
        env: NodeEnv.development,
        isDevelopment: true,
        isTesting: false,
    },
    database: {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USERNAME ?? 'db_username',
        password: process.env.DB_PASSWORD ?? 'db_password',
        database: process.env.DB_DATABASE ?? 'db_database',
        logging: process.env.NODE_ENV === 'development',
    },
    logger: {
        options: {
            level: process.env.LOGGER_LEVEL ?? 'debug',
        },
    },
    redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB ?? 0),
    },
};

interface CreateRepoConfigOptions extends Omit<DeepPartial<RepoConfig>, 'logger'> {
    logger: {
        name: string;
        options?: LoggerConfig;
    };
}

export const createRepoConfig = (overrides: CreateRepoConfigOptions): RepoConfig => {
    const env: NodeEnv = (Bun.env.NODE_ENV ?? NodeEnv.development) as NodeEnv;

    const merged = merge(defaultConfig, overrides, {
        nodeEnv: {
            env,
            isDevelopment: env === NodeEnv.development,
            isTesting: env === NodeEnv.test,
        },
    }) as RepoConfig;
    return RepoConfigSchema.parse(merged);
};
