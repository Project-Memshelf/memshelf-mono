import { createBaseLogger, type RepoConfig } from '@repo/shared-core';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { InflectionNamingStrategy } from 'typeorm-inflection-naming-strategy/src';
import { TypeOrmPinoLogger } from 'typeorm-pino-logger';
import { parseDsnString } from './parseDsnString';

/**
 * Merge package default config with app-specific overrides
 */
export function createDataSourceOptions(repoConfig: RepoConfig): DataSourceOptions {
    const typeormLogger = new TypeOrmPinoLogger(createBaseLogger(repoConfig), {
        logQueries: false,
        logSchemaOperations: false,
    });
    const parsedUrlConfigs = parseDsnString(repoConfig.database.url);
    return {
        ...parsedUrlConfigs,
        entities: [`${__dirname}/entities/*Entity.{ts,js}`],
        migrations: [`${__dirname}/migrations/*.{ts,js}`],
        migrationsTableName: 'typeorm_migrations',
        namingStrategy: new InflectionNamingStrategy(),
        logger: typeormLogger,
    } as DataSourceOptions;
}

/**
 * Create a DataSource with app-specific configuration
 * Apps should use this instead of the package's AppDataSource
 */
export function createDataSource(repoConfig: RepoConfig): DataSource {
    const dataSourceOptions = createDataSourceOptions(repoConfig);
    return new DataSource(dataSourceOptions);
}

/**
 * Initialize and return a database connection
 * Apps should use this with their own configuration
 */
export async function initializeDatabase(ds: DataSource): Promise<DataSource> {
    try {
        if (!ds.isInitialized) {
            await ds.initialize();
            console.log(`✅ Database connection initialized (${ds.options.database})`);
        }
        return ds;
    } catch (error) {
        console.error('❌ Error during database initialization:', error);
        throw error;
    }
}

/**
 * Gracefully close database connection
 */
export async function closeDatabase(ds: DataSource): Promise<void> {
    try {
        if (ds.isInitialized) {
            await ds.destroy();
            console.log(`✅ Database connection closed (${ds.options.database})`);
        }
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
        throw error;
    }
}
