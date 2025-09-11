import type { DataSourceOptions } from 'typeorm';

export const parseDsnString = (dsn: string): Partial<DataSourceOptions> => {
    const url = new URL(dsn);

    // Extract database type from protocol
    const type = url.protocol.replace(':', '') as 'mysql' | 'sqlite' | 'postgres';
    const queryParams = url.searchParams;
    let connectionOptions: Partial<DataSourceOptions> = {
        type,
        database: url.pathname.slice(1),
        synchronize: queryParams.get('synchronize') === 'true',
        logging: queryParams.get('logging') === 'true',
        migrationsRun: queryParams.get('migrationsRun') === 'true',
    };

    if (['mysql', 'postgres'].includes(type)) {
        connectionOptions = {
            ...connectionOptions,
            host: url.hostname,
            port: url.port ? parseInt(url.port, 10) : undefined,
            username: url.username,
            password: url.password,
        } as Partial<DataSourceOptions>;
    }

    if (['mysql'].includes(type)) {
        connectionOptions = {
            ...connectionOptions,
            type: 'mysql',
            timezone: queryParams.get('timezone') ?? 'UTC',
            charset: queryParams.get('charset') ?? 'utf8mb4',
        } as Partial<DataSourceOptions>;
    }

    return connectionOptions;
};
