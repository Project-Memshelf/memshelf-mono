import type { Logger } from '@repo/shared-core';
import type { Agenda, Job } from 'agenda';
import type { DependencyContainer } from 'tsyringe';
import { jobDefinitions } from './generated/jobDefinitions';

export class WorkerService {
    protected logger: Logger;

    constructor(
        private agenda: Agenda,
        logger: Logger
    ) {
        this.logger = logger.child({ module: 'WorkerService' });
    }

    registerJobs(container: DependencyContainer) {
        jobDefinitions.forEach((jobDef) => {
            this.agenda.define(
                jobDef.name,
                {
                    concurrency: jobDef.concurrency || 1,
                },
                async (job: Job) => jobDef.handler(job as Parameters<typeof jobDef.handler>[0], container)
            );
        });
    }

    async start(): Promise<void> {
        await this.agenda.start();
    }

    async stop(): Promise<void> {
        await this.agenda.stop();
    }
}
