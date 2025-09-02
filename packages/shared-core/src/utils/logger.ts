import pino, { type LoggerOptions } from 'pino';

export const createBaseLogger = (options: LoggerOptions = {}) => {
    const pinoOptions: LoggerOptions = {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                ...options.transport?.options,
            },
            ...options.transport,
        },
        ...options,
    };
    return pino(pinoOptions);
};
