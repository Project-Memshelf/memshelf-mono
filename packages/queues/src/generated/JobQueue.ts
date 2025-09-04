import type { Agenda, Job } from 'agenda';
import type { Logger } from 'pino';
import type { z } from 'zod';
import { emailJob } from '../jobs/email';

/**
 * Type-safe job queue with Zod validation for queuing and scheduling jobs
 * This file is auto-generated - do not edit manually
 */
export class JobQueue {
    constructor(
        private agenda: Agenda,
        private logger?: Logger
    ) {}

    /**
     * Ensure Agenda is connected to MongoDB before operations
     */
    private async ensureConnection(): Promise<void> {
        if (!this.agenda._collection) {
            this.logger?.debug('Waiting for Agenda MongoDB connection...');
            await new Promise<void>((resolve) => {
                const checkReady = () => {
                    if (this.agenda._collection) {
                        this.logger?.debug('Agenda MongoDB connection established');
                        resolve();
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });
        }
    }

    /**
     * Queue emailJob for immediate processing with validation
     */
    async queueEmail(data: z.infer<typeof emailJob.schema>): Promise<Job> {
        await this.ensureConnection();
        this.logger?.info({ data }, 'Queuing emailJob');

        // Validate data before queuing
        const validated = emailJob.schema.parse(data);
        const job = this.agenda.now(emailJob.name, validated);

        this.logger?.info({ jobName: emailJob.name }, 'emailJob queued successfully');
        return job;
    }

    /**
     * Schedule emailJob for later processing with validation
     */
    async scheduleEmail(when: string | Date, data: z.infer<typeof emailJob.schema>): Promise<Job> {
        await this.ensureConnection();
        this.logger?.info({ when, data }, 'Scheduling emailJob');

        // Validate data before queuing
        const validated = emailJob.schema.parse(data);
        const job = this.agenda.schedule(when, emailJob.name, validated);

        this.logger?.info({ jobName: emailJob.name, when }, 'emailJob scheduled successfully');
        return job;
    }

    /**
     * Start processing jobs (used by workers)
     */
    async start(): Promise<void> {
        await this.agenda.start();
    }

    /**
     * Stop processing jobs
     */
    async stop(): Promise<void> {
        await this.agenda.stop();
    }
}
