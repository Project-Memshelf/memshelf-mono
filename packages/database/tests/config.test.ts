import { describe, expect, it } from 'bun:test';
import { createRepoConfig } from '@repo/shared-core';
import { createDataSourceOptions } from '../src';
import { parseDsnString } from '../src/parseDsnString';

describe('parseDsnString', () => {
    it('should parse MySQL DSN with basic connection info', () => {
        const dsn = 'mysql://user:pass@localhost:3306/mydb';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            host: 'localhost',
            port: 3306,
            username: 'user',
            password: 'pass',
            database: 'mydb',
            synchronize: false,
            logging: false,
            migrationsRun: false,
            type: 'mysql',
            timezone: 'UTC',
            charset: 'utf8mb4',
        });
    });

    it('should parse MySQL DSN with query parameters', () => {
        const dsn =
            'mysql://memshelf:memshelf@192.168.1.20:8379/memshelf?synchronize=true&logging=true&timezone=Z&charset=utf8mb4&migrationsRun=true';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            host: '192.168.1.20',
            port: 8379,
            username: 'memshelf',
            password: 'memshelf',
            database: 'memshelf',
            synchronize: true,
            logging: true,
            migrationsRun: true,
            type: 'mysql',
            timezone: 'Z',
            charset: 'utf8mb4',
        });
    });

    it('should parse MySQL DSN with partial query parameters', () => {
        const dsn = 'mysql://user:pass@localhost:3306/mydb?synchronize=true&logging=false';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            host: 'localhost',
            port: 3306,
            username: 'user',
            password: 'pass',
            database: 'mydb',
            synchronize: true,
            logging: false,
            migrationsRun: false,
            type: 'mysql',
            timezone: 'UTC',
            charset: 'utf8mb4',
        });
    });

    it('should parse SQLite DSN', () => {
        const dsn = 'sqlite:///path/to/database.sqlite?synchronize=false&logging=true&migrationsRun=true';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            type: 'sqlite',
            database: 'path/to/database.sqlite',
            synchronize: false,
            logging: true,
            migrationsRun: true,
        });
    });

    it('should parse PostgreSQL DSN', () => {
        const dsn = 'postgres://user:pass@localhost:5432/mydb?synchronize=false&logging=false&migrationsRun=false';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'user',
            password: 'pass',
            database: 'mydb',
            synchronize: false,
            logging: false,
            migrationsRun: false,
        });
    });

    it('should handle DSN without port', () => {
        const dsn = 'mysql://user:pass@localhost/mydb';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            host: 'localhost',
            port: undefined,
            username: 'user',
            password: 'pass',
            database: 'mydb',
            synchronize: false,
            logging: false,
            migrationsRun: false,
            type: 'mysql',
            timezone: 'UTC',
            charset: 'utf8mb4',
        });
    });

    it('should handle DSN without password', () => {
        const dsn = 'mysql://user@localhost:3306/mydb';
        const result = parseDsnString(dsn);

        expect(result).toEqual({
            host: 'localhost',
            port: 3306,
            username: 'user',
            password: '',
            database: 'mydb',
            synchronize: false,
            logging: false,
            migrationsRun: false,
            type: 'mysql',
            timezone: 'UTC',
            charset: 'utf8mb4',
        });
    });

    it('should handle DSN with boolean query parameters in various formats', () => {
        const dsn = 'mysql://user:pass@localhost:3306/mydb?synchronize=1&logging=0&migrationsRun=true';
        const result = parseDsnString(dsn);

        // Note: current implementation only checks for 'true' string, so '1' and '0' will be false
        expect(result).toEqual({
            host: 'localhost',
            port: 3306,
            username: 'user',
            password: 'pass',
            database: 'mydb',
            synchronize: false, // '1' !== 'true'
            logging: false, // '0' !== 'true'
            migrationsRun: true,
            type: 'mysql',
            timezone: 'UTC',
            charset: 'utf8mb4',
        });
    });
});

describe('createDataSourceOptions', () => {
    it('should create DataSourceOptions with DSN configuration', () => {
        const testConfig = {
            logger: {
                name: 'test',
            },
            database: {
                url: 'mysql://user:pass@localhost:3306/mydb?synchronize=false&logging=false&migrationsRun=true',
            },
        };

        const repoConfig = createRepoConfig(testConfig);
        const result = createDataSourceOptions(repoConfig);

        expect(result).toMatchObject({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'user',
            password: 'pass',
            database: 'mydb',
            synchronize: false,
            logging: false,
            migrationsRun: true,
            charset: 'utf8mb4',
            timezone: 'UTC',
            entities: [expect.stringContaining('entities/*Entity.{ts,js}')],
            migrations: [expect.stringContaining('migrations/*.{ts,js}')],
            migrationsTableName: 'typeorm_migrations',
        });

        // Check that it has the required objects
        expect(result.namingStrategy).toBeDefined();
        expect(result.logger).toBeDefined();
    });

    it('should override default config with DSN query parameters', () => {
        const testConfig = {
            logger: {
                name: 'test',
            },
            database: {
                url: 'mysql://testuser:testpass@localhost:3306/testdb?synchronize=true&logging=true&timezone=UTC&charset=latin1&migrationsRun=false',
            },
        };

        const repoConfig = createRepoConfig(testConfig);
        const result = createDataSourceOptions(repoConfig);

        expect(result).toMatchObject({
            host: 'localhost',
            port: 3306,
            username: 'testuser',
            password: 'testpass',
            database: 'testdb',
            synchronize: true,
            logging: true,
            migrationsRun: false,
            charset: 'latin1',
            timezone: 'UTC',
        });
    });

    it('should handle different database types', () => {
        const testConfig = {
            logger: {
                name: 'test',
            },
            database: {
                url: 'sqlite:///test.sqlite?synchronize=false&logging=false&migrationsRun=false',
            },
        };

        const repoConfig = createRepoConfig(testConfig);
        const result = createDataSourceOptions(repoConfig);

        expect(result).toMatchObject({
            type: 'sqlite',
            database: 'test.sqlite',
            synchronize: false,
            logging: false,
            migrationsRun: false,
            entities: [expect.stringContaining('entities/*Entity.{ts,js}')],
            migrations: [expect.stringContaining('migrations/*.{ts,js}')],
            migrationsTableName: 'typeorm_migrations',
        });

        // Check that it has the required objects
        expect(result.namingStrategy).toBeDefined();
        expect(result.logger).toBeDefined();
    });

    it('should use default values when query parameters are missing', () => {
        const testConfig = {
            logger: {
                name: 'test',
            },
            database: {
                url: 'mysql://user:pass@localhost:3306/mydb',
            },
        };

        const repoConfig = createRepoConfig(testConfig);
        const result = createDataSourceOptions(repoConfig);

        expect(result).toMatchObject({
            synchronize: false,
            logging: false,
            migrationsRun: false,
            charset: 'utf8mb4',
            timezone: 'UTC',
        });
    });
});
