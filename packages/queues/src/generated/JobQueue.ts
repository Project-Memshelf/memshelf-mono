import type { Agenda, Job } from 'agenda';
import type { z } from 'zod';
import { emailJob } from '../jobs/email';

/**
 * Type-safe job queue with Zod validation for queuing and scheduling jobs
 * This file is auto-generated - do not edit manually
 */
export class JobQueue {
    constructor(private agenda: Agenda) {}

    /**
     * Queue emailJob for immediate processing with validation
     */
    async queueEmail(data: z.infer<typeof emailJob.schema>): Promise<Job> {
        // Validate data before queuing
        const validated = emailJob.schema.parse(data);
        return this.agenda.now(emailJob.name, validated);
    }

    /**
     * Schedule emailJob for later processing with validation
     */
    async scheduleEmail(when: string | Date, data: z.infer<typeof emailJob.schema>): Promise<Job> {
        // Validate data before queuing
        const validated = emailJob.schema.parse(data);
        return this.agenda.schedule(when, emailJob.name, validated);
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
