import { JobQueue } from '@repo/queues';
import { AppCache, AppLogger, AppRedis } from '@repo/shared-services';
import { Command } from 'commander';
import type { DependencyContainer } from 'tsyringe';
import { DataSource } from 'typeorm';

export function createDevCommand(container: DependencyContainer): Command {
    const logger = container.resolve(AppLogger);
    const devCommand = new Command('dev');
    devCommand.description('Development utilities');

    devCommand
        .command('info')
        .description('Show application information')
        .action(() => {
            logger.info('Memshelf CLI Information');
            logger.info('==========================');
            logger.info(`Version: 1.0.0`);
            logger.info(`Runtime: ${process.title} ${process.version}`);
            logger.info(`Platform: ${process.platform}`);
            logger.info(`Architecture: ${process.arch}`);
            logger.info(`Working Directory: ${process.cwd()}`);
            logger.info(`Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        });

    devCommand
        .command('health')
        .description('Check system health')
        .action(async () => {
            logger.info('System Health Check');
            logger.info('=====================');

            // Check logger
            try {
                const testLogger = container.resolve(AppLogger);
                testLogger.info('Logger test');
                logger.info('Logger: OK');
            } catch (error) {
                logger.error(error, 'Logger: Failed');
            }

            // Check database connection
            try {
                const dataSource = container.resolve(DataSource);
                await dataSource.initialize();
                await dataSource.query('SELECT 1 as test');
                await dataSource.destroy();
                logger.info('Database: OK');
            } catch (error) {
                logger.error(error, 'Database: Failed');
            }

            // Check Redis connection
            try {
                const redis = container.resolve(AppRedis);
                await redis.ping();
                logger.info('Redis: OK');
                redis.disconnect();
            } catch (error) {
                logger.error(error, 'Redis: Failed');
            }

            // Check cache
            try {
                const cache = container.resolve(AppCache);
                const testKey = `health-check-${Date.now()}`;
                await cache.set(testKey, 'test', 1000);
                const value = await cache.get(testKey);
                await cache.delete(testKey);
                logger.info(value === 'test' ? 'Cache: OK' : 'Cache: Partial');
            } catch (error) {
                logger.error(error, 'Cache: Failed');
            }
        });

    devCommand
        .command('config')
        .description('Show current configuration (sanitized)')
        .action(() => {
            const { createRepoConfig } = require('@repo/shared-core');

            const config = createRepoConfig({
                logger: {
                    name: 'config-display',
                    options: { level: 'info' },
                },
            });

            const sanitizedConfig = {
                nodeEnv: config.nodeEnv,
                database: {
                    ...config.database,
                    password: '***REDACTED***',
                },
                redis: {
                    ...config.redis,
                    password: config.redis.password ? '***REDACTED***' : undefined,
                },
                apiServer: config.apiServer,
                queues: {
                    ...config.queues,
                    // Redact potential MongoDB credentials in URL
                    dbUrl: config.queues.dbUrl.replace(/:\/\/([^@]+)@/, '://***REDACTED***@'),
                },
                logger: config.logger,
            };

            logger.info('Current Configuration');
            logger.info('========================');
            logger.info(sanitizedConfig);
        });

    devCommand
        .command('env')
        .description('Show environment variables')
        .option('--all', 'Show all environment variables')
        .action((options) => {
            logger.info('Environment Variables');
            logger.info('========================');

            const envVars: Record<string, string | undefined> = {};
            const sourceEnv = options.all
                ? process.env
                : Object.fromEntries(
                      Object.entries(process.env).filter(
                          ([key]) =>
                              key.startsWith('DB_') ||
                              key.startsWith('REDIS_') ||
                              key.startsWith('API_SERVER_') ||
                              key.startsWith('AGENDA_') ||
                              key === 'NODE_ENV' ||
                              key === 'LOGGER_LEVEL'
                      )
                  );

            Object.entries(sourceEnv)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([key, value]) => {
                    const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
                    const shouldRedact = sensitiveKeys.some((sensitive) => key.toUpperCase().includes(sensitive));
                    envVars[key] = shouldRedact && value ? '***REDACTED***' : value || '';
                });

            logger.info(envVars);
        });

    devCommand
        .command('queue:email')
        .description('Queue a test email job')
        .action(async () => {
            try {
                logger.info('Queuing test email job...');
                const jobQueue = container.resolve(JobQueue);
                const job = await jobQueue.queueEmail({
                    to: 'test@example.com',
                    subject: 'Test Email from CLI',
                    body: 'This is a test email sent from the CLI dev command',
                    priority: 'normal',
                });
                logger.info(
                    {
                        jobId: job.attrs._id,
                        to: 'test@example.com',
                    },
                    'Email job queued successfully'
                );
                await jobQueue.stop();
                process.exit(0);
            } catch (error) {
                logger.error(error, 'Failed to queue email job');
                process.exit(1);
            }
        });
    return devCommand;
}
