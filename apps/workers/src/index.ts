import 'reflect-metadata';
import { Agenda, WorkerService } from '@repo/queues';
import { createRepoConfig } from '@repo/shared-core';
import { AppLogger, createContainer } from '@repo/shared-services';

const config = createRepoConfig({
    logger: {
        name: 'WorkersApp',
    },
});

const container = createContainer(config);
const logger = container.resolve(AppLogger);
const agenda = container.resolve(Agenda); // Make sure Agenda is registered
const workerService = new WorkerService(agenda, logger);

// Register jobs and setup graceful shutdown
workerService.registerJobs(container);
workerService.setupGracefulShutdown();

// Start processing jobs
await workerService.start();
