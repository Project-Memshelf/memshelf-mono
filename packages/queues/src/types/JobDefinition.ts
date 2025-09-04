import type { Job } from 'agenda';
import type { DependencyContainer } from 'tsyringe';
import type { z } from 'zod';

export interface JobDefinition<TSchema extends z.ZodSchema> {
    name: string;
    schema: TSchema;
    handler: (job: Job<z.infer<TSchema>>, container: DependencyContainer) => Promise<void>;
    retries?: number;
    timeout?: number;
    concurrency?: number;
    priority?: number;
}
