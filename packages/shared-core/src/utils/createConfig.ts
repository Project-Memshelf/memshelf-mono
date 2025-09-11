import dotenv from 'dotenv';
import { merge } from 'ts-deepmerge';
import { ZodError } from 'zod';
import type { LoggerConfig } from '../schemas';
import { type RepoConfig, RepoConfigSchema } from '../schemas';
import { type DeepPartial, NodeEnv } from '../types';

// Load environment-specific .env file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = [
    `../../.env.${nodeEnv}`, // .env.test, .env.development, etc.
    '../../.env', // Fallback to default .env
];

dotenv.config({
    quiet: true,
    debug: false,
    path: envFiles,
});

/**
 * Configuration factory that creates a validated RepoConfig from environment variables and overrides.
 * See packages/shared-core/README.md for complete environment variables documentation.
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
        url:
            process.env.DATABASE_URL ??
            'mysql://user:pass@localhost:3306/mydb?synchronize=false&logging=false&timezone=Z&charset=utf8mb4&migrationsRun=true',
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
        timeout: parseIntWithDefault(process.env.API_SERVER_TIMEOUT, 30000),
        bodyLimit: parseIntWithDefault(process.env.API_SERVER_BODY_LIMIT, 1024 * 1024), // 1MB
        keepAliveTimeout: parseIntWithDefault(process.env.API_SERVER_KEEP_ALIVE_TIMEOUT, 5000),
        cors: {
            origins: parseCorsOrigins(process.env.API_SERVER_CORS_ORIGINS),
        },
        rateLimit: {
            windowMs: parseIntWithDefault(process.env.API_SERVER_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
            maxRequests: parseIntWithDefault(process.env.API_SERVER_RATE_LIMIT_MAX_REQUESTS, 100),
        },
    },
    queues: {
        dbUrl: process.env.AGENDA_URL ?? 'mongodb://localhost:27017/jobs',
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
