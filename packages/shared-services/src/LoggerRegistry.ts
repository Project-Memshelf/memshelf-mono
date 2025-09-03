import type { Logger } from '@repo/shared-core';

/**
 * LoggerRegistry manages child logger instances by name.
 */

export class LoggerRegistry {
    protected loggers: Map<string, Logger>;
    public readonly baseLogger: Logger;

    constructor(baseLogger: Logger) {
        this.loggers = new Map();
        this.baseLogger = baseLogger;
    }

    /**
     * Get or create a named child logger.
     * @param loggerName The unique name for the child logger.
     * @returns Logger instance tagged with loggerName.
     */
    getLogger(loggerName: string): Logger {
        const cached = this.loggers.get(loggerName);
        if (cached) {
            return cached;
        }

        const childLogger = this.baseLogger.child({ name: loggerName });
        this.loggers.set(loggerName, childLogger);
        return childLogger;
    }
}
