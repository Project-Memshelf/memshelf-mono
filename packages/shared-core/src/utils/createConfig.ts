import dotenv from 'dotenv';
import { merge } from 'ts-deepmerge';
import { ZodError } from 'zod';
import type { LoggerConfig } from '../schemas';
import { type RepoConfig, RepoConfigSchema } from '../schemas';
import { type DeepPartial, NodeEnv } from '../types';

dotenv.config({
    quiet: true,
    debug: false,
    path: ['../../.env'],
});

/**
 * Environment Variables:
 * - NODE_ENV: Environment (development, production, test)
 * - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE: Database configuration
 * - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB: Redis configuration
 * - API_SERVER_HOSTNAME: Server hostname (default: localhost)
 * - API_SERVER_PORT: Server port (default: 3000)
 * - API_SERVER_CORS_ORIGINS: Comma-separated CORS origins (e.g., "http://localhost:3000,https://app.com")
 * - LOGGER_LEVEL: Log level (default: debug)
 */

const parseIntWithDefault = (value: string | undefined, defaultValue: number): number => {
    const parsed = value ? parseInt(value, 10) : NaN;
    return Number.isNaN(parsed) ? defaultValue : parsed;
};

const parseCorsOrigins = (origins: string | undefined): string[] => {
    return origins
        ? origins
              .split(',')
              .map((origin) => origin.trim())
              .filter(Boolean)
        : [];
};

const defaultConfig: DeepPartial<RepoConfig> = {
    nodeEnv: {
        env: NodeEnv.development,
        isDevelopment: true,
        isTesting: false,
    },
    database: {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseIntWithDefault(process.env.DB_PORT, 3306),
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
        port: parseIntWithDefault(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD,
        db: parseIntWithDefault(process.env.REDIS_DB, 0),
    },
    apiServer: {
        hostname: process.env.API_SERVER_HOSTNAME ?? 'localhost',
        port: parseIntWithDefault(process.env.API_SERVER_PORT, 3000),
        cors: {
            origins: parseCorsOrigins(process.env.API_SERVER_CORS_ORIGINS),
        },
    },
};

interface CreateRepoConfigOptions extends Omit<DeepPartial<RepoConfig>, 'logger'> {
    logger: {
        name: string;
        options?: LoggerConfig;
    };
}

export const createRepoConfig = (overrides: CreateRepoConfigOptions): RepoConfig => {
    try {
        const env: NodeEnv = (Bun.env.NODE_ENV ?? NodeEnv.development) as NodeEnv;

        const merged = merge(defaultConfig, overrides, {
            nodeEnv: {
                env,
                isDevelopment: env === NodeEnv.development,
                isTesting: env === NodeEnv.test,
            },
        }) as RepoConfig;
        return RepoConfigSchema.parse(merged);
    } catch (e: unknown) {
        if (e instanceof ZodError) {
            console.error('❌ Configuration Validation Failed:');
            e.issues.forEach((issue) => {
                console.error('  •', {
                    path: issue.path.join('.') || 'root',
                    message: issue.message,
                    code: issue.code,
                    ...('received' in issue && { received: issue.received }),
                });
            });
            process.exit(1);
        }
        throw e;
    }
};
