import pino, { type LoggerOptions } from 'pino';
import { merge } from 'ts-deepmerge';
import type { RepoConfig } from '../schemas';

export const createBaseLogger = (config: RepoConfig) => {
    // Extract user options but handle transport separately for deep merging
    const { transport: userTransport, ...userOptions } = config.logger.options;

    if (config.nodeEnv.isDevelopment) {
        // Development: Pretty-printed logs to stderr with deep merge for transport options
        const defaultTransport = {
            target: 'pino-pretty',
            options: {
                destination: 2, // stderr
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        };

        // Deep merge user transport options with defaults
        const transport = userTransport
            ? merge(defaultTransport, userTransport as Record<string, unknown>)
            : defaultTransport;

        return pino({
            ...userOptions,
            transport,
        } as LoggerOptions);
    } else {
        // Production: Structured JSON logs to stderr
        const productionOptions = {
            ...userOptions,
            formatters: {
                level: (label) => ({ level: label }),
                ...userOptions.formatters,
            },
        } as LoggerOptions;

        return pino(productionOptions, pino.destination({ dest: 2, sync: false }));
    }
};
