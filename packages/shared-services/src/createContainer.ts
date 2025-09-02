import Keyv from '@keyvhq/core';
import { createDataSource, DataSource } from '@repo/database';
import { createBaseLogger, type RepoConfig } from '@repo/shared-core';
import IORedis from 'ioredis';
import type { Logger, LoggerOptions } from 'pino';
import { TaggedKeyv } from 'tagged-keyv-wrapper';
import { container, type DependencyContainer, type InjectionToken, instanceCachingFactory } from 'tsyringe';
import { LoggerRegistry } from './LoggerRegistry';

export const AppLogger: InjectionToken<Logger> = 'Logger';
export const AppCache: InjectionToken<TaggedKeyv> = 'AppCache';
export const AppRedis: InjectionToken<IORedis> = 'Redis';

const setupLogging = (name: string, container: DependencyContainer, options?: LoggerOptions) => {
    const baseLogger = createBaseLogger(options);

    container.register<LoggerRegistry>(LoggerRegistry, {
        useFactory: instanceCachingFactory<LoggerRegistry>((_c) => new LoggerRegistry(baseLogger)),
    });

    container.register<Logger>(AppLogger, {
        useFactory: instanceCachingFactory<Logger>((c) => c.resolve(LoggerRegistry).getLogger(name)),
    });
};

export const createContainer = (config: RepoConfig): DependencyContainer => {
    const childContainer = container.createChildContainer();

    setupLogging(config.logger.name, childContainer, config.logger.options as LoggerOptions);
    childContainer.register<DataSource>(DataSource, {
        useFactory: instanceCachingFactory<DataSource>((_c) => createDataSource(config)),
    });

    childContainer.register<TaggedKeyv>(AppCache, {
        useFactory: instanceCachingFactory<TaggedKeyv>(() => {
            return new TaggedKeyv(new Keyv());
        }),
    });

    childContainer.register<IORedis>(AppRedis, {
        useFactory: instanceCachingFactory<IORedis>(() => {
            return new IORedis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password,
                db: config.redis.db,
                maxRetriesPerRequest: null,
            });
        }),
    });

    return childContainer;
};
