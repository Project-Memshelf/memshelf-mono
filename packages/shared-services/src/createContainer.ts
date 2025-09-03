import Keyv from '@keyvhq/core';
import { createDataSource, DataSource } from '@repo/database';
import { createBaseLogger, type RepoConfig } from '@repo/shared-core';
import IORedis from 'ioredis';
import type { Logger } from 'pino';
import { TaggedKeyv } from 'tagged-keyv-wrapper';
import { container, type DependencyContainer, type InjectionToken, instanceCachingFactory } from 'tsyringe';

export const AppLogger: InjectionToken<Logger> = 'Logger';
export const AppCache: InjectionToken<TaggedKeyv> = 'AppCache';
export const AppRedis: InjectionToken<IORedis> = 'Redis';

export const createContainer = (config: RepoConfig): DependencyContainer => {
    const appContainer = container.createChildContainer();

    appContainer.register<Logger>(AppLogger, {
        useFactory: instanceCachingFactory<Logger>(() => createBaseLogger(config)),
    });

    appContainer.register<DataSource>(DataSource, {
        useFactory: instanceCachingFactory<DataSource>(() => createDataSource(config)),
    });

    appContainer.register<TaggedKeyv>(AppCache, {
        useFactory: instanceCachingFactory<TaggedKeyv>(() => {
            return new TaggedKeyv(new Keyv());
        }),
    });

    appContainer.register<IORedis>(AppRedis, {
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

    return appContainer;
};
