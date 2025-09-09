import { createBaseLogger, type RepoConfig } from '@repo/shared-core';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { InflectionNamingStrategy } from 'typeorm-inflection-naming-strategy/src';
import { TypeOrmPinoLogger } from 'typeorm-pino-logger';
import { AppDataSource } from './dataSource';

/**
 * Merge package default config with app-specific overrides
 */
export function createDataSourceOptions(repoConfig: RepoConfig): DataSourceOptions {
    const typeormLogger = new TypeOrmPinoLogger(createBaseLogger(repoConfig), {
        logQueries: false,
        logSchemaOperations: false,
    });

    return {
        type: 'mysql',
        ...repoConfig.database,
        charset: 'utf8mb4',
        timezone: 'Z',
        synchronize: false,
        entities: [`${__dirname}/entities/*Entity.{ts,js}`],
        migrations: [`${__dirname}/migrations/*.{ts,js}`],
        migrationsTableName: 'typeorm_migrations',
        migrationsRun: true,
        namingStrategy: new InflectionNamingStrategy(),
        logger: typeormLogger,
    };
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
export async function initializeDatabase(dataSource?: DataSource): Promise<DataSource> {
    const ds = dataSource ?? AppDataSource;

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
export async function closeDatabase(dataSource?: DataSource): Promise<void> {
    const ds = dataSource ?? AppDataSource;

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
