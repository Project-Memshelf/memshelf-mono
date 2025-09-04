import type { Logger } from '@repo/shared-core';
import type { Agenda, Job } from 'agenda';
import type { DependencyContainer } from 'tsyringe';
import { jobDefinitions } from './generated/jobDefinitions';

export class WorkerService {
    protected logger: Logger;
    protected agenda: Agenda;

    constructor(agenda: Agenda, logger: Logger) {
        this.agenda = agenda;
        this.logger = logger.child({ module: 'WorkerService' });
    }

    registerJobs(container: DependencyContainer) {
        this.logger.info({ count: jobDefinitions.length }, 'Registering job definitions');

        jobDefinitions.forEach((jobDef) => {
            this.agenda.define(
                jobDef.name,
                {
                    concurrency: jobDef.concurrency || 1,
                },
                async (job: Job) => jobDef.handler(job as Parameters<typeof jobDef.handler>[0], container)
            );

            this.logger.debug(
                {
                    name: jobDef.name,
                    concurrency: jobDef.concurrency || 1,
                    retries: jobDef.retries,
                    timeout: jobDef.timeout,
                },
                'Registered job definition'
            );
        });

        this.logger.info('All job definitions registered successfully');
    }

    async start(): Promise<void> {
        this.logger.info('Starting worker service...');
        await this.agenda.start();
        this.logger.info('Worker service started and processing jobs');
    }

    async stop(): Promise<void> {
        this.logger.info('Stopping worker service...');
        await this.agenda.stop();
        this.logger.info('Worker service stopped');
    }

    setupGracefulShutdown(): void {
        const handleShutdown = async (signal: string) => {
            this.logger.info(`${signal} received, shutting down gracefully`);
            try {
                await this.stop();
                process.exit(0);
            } catch (error) {
                this.logger.error(error, 'Error during graceful shutdown');
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGINT', () => handleShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error(error, 'Uncaught exception');
            handleShutdown('UNCAUGHT_EXCEPTION');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error({ reason, promise }, 'Unhandled promise rejection');
            handleShutdown('UNHANDLED_REJECTION');
        });

        this.logger.info('Graceful shutdown handlers registered');
    }
}
