# @repo/queues

Type-safe job queue system using Agenda (MongoDB-based) with Zod schema validation, automatic code generation, and dependency injection support for Bun runtime.

## Overview

The `@repo/queues` package provides a comprehensive job queue solution with:
- **Type Safety**: Zod schemas provide runtime validation and TypeScript types
- **Code Generation**: Automatic generation of type-safe queue methods
- **Zero Build Process**: Direct TypeScript imports, no compilation required for packages  
- **Dependency Injection**: TSyringe container integration for clean service resolution
- **Minimal Boilerplate**: Each job defined in a single file with schema + handler + metadata

## Architecture

```
packages/queues/
├── src/
│   ├── jobs/
│   │   └── email.ts              # Job definitions (schema + handler + config)
│   ├── generated/
│   │   ├── JobQueue.ts           # Auto-generated type-safe queuing methods
│   │   └── jobDefinitions.ts     # Auto-generated array of all job definitions
│   ├── types/
│   │   └── JobDefinition.ts      # Job definition interface
│   ├── WorkerService.ts          # Job registration and worker management
│   └── index.ts                  # Package exports
└── scripts/
    └── codegen.ts                # Code generation script
```

## Installation

```bash
bun install
```

## Quick Start

### 1. Define a Job

Create a job definition in `src/jobs/`:

```typescript
// src/jobs/email.ts
import { AppLogger } from '@repo/shared-services';
import { z } from 'zod';
import type { JobDefinition } from '../types/JobDefinition';

const emailSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().optional(),
    templateId: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const emailJob: JobDefinition<typeof emailSchema> = {
    name: 'send-email',
    schema: emailSchema,
    handler: async (job, container) => {
        const logger = container.resolve(AppLogger);
        const { to, subject, body, templateId, priority } = job.attrs.data;

        logger.info({ to, subject, templateId, priority }, 'Processing email job');
        
        // Your email sending logic here
        // await emailService.send({ to, subject, body, templateId });
        
        logger.info(`Email sent successfully to ${to}`);
    },
    retries: 3,
    timeout: 30000, // 30 seconds
    concurrency: 5,
};
```

### 2. Generate Code

```bash
bun run codegen
```

This generates:
- `src/generated/JobQueue.ts` - Type-safe queuing methods
- `src/generated/jobDefinitions.ts` - Array of all job definitions

### 3. Use in Your Application

```typescript
import { JobQueue, WorkerService } from '@repo/queues';
import { createRepoConfig } from '@repo/shared-core';
import { createContainer } from '@repo/shared-services';
import Agenda from 'agenda';

// Setup
const config = createRepoConfig({ logger: { name: 'MyApp' } });
const container = createContainer(config);
const agenda = new Agenda({ db: { address: config.queues.dbUrl } });

// For queuing jobs
const jobQueue = new JobQueue(agenda);

// Queue an email immediately
await jobQueue.queueEmail({
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thank you for signing up',
    priority: 'high'
});

// Schedule for later
await jobQueue.scheduleEmail('in 1 hour', {
    to: 'user@example.com',
    subject: 'Follow up',
    priority: 'normal'
});

// For processing jobs (in worker app)
const workerService = new WorkerService(agenda, container.resolve('Logger'));
workerService.registerJobs(container);
await workerService.start();
```

## Core Components

### JobDefinition Interface

```typescript
export interface JobDefinition<TSchema extends z.ZodSchema> {
    name: string;                    // Unique job name
    schema: TSchema;                 // Zod validation schema
    handler: (                       // Job processor function
        job: Job<z.infer<TSchema>>, 
        container: DependencyContainer
    ) => Promise<void>;
    retries?: number;                // Retry attempts
    timeout?: number;                // Timeout in milliseconds
    concurrency?: number;            // Max concurrent jobs
    priority?: number;               // Job priority
}
```

### Generated JobQueue

The codegen automatically creates type-safe methods for each job:

```typescript
export class JobQueue {
    constructor(private agenda: Agenda) {}

    // Generated for each job definition
    async queueEmail(data: z.infer<typeof emailJob.schema>): Promise<Job> {
        const validated = emailJob.schema.parse(data);
        return this.agenda.now(emailJob.name, validated);
    }

    async scheduleEmail(when: string | Date, data: z.infer<typeof emailJob.schema>): Promise<Job> {
        const validated = emailJob.schema.parse(data);
        return this.agenda.schedule(when, emailJob.name, validated);
    }
}
```

### WorkerService

Handles job registration and worker lifecycle:

```typescript
export class WorkerService {
    constructor(private agenda: Agenda, logger: Logger) {}

    registerJobs(container: DependencyContainer) {
        // Automatically registers all job definitions with Agenda
        jobDefinitions.forEach(jobDef => {
            this.agenda.define(jobDef.name, { 
                concurrency: jobDef.concurrency || 1 
            }, async (job) => jobDef.handler(job, container));
        });
    }

    async start(): Promise<void> { await this.agenda.start(); }
    async stop(): Promise<void> { await this.agenda.stop(); }
}
```

## Configuration

The package uses configuration from `@repo/shared-core`:

```typescript
// Environment variables
AGENDA_URL=mongodb://localhost:27017/jobs  // MongoDB connection for Agenda

// In createRepoConfig
const config = createRepoConfig({
    logger: { name: 'MyApp' }
});

// Access queue config
console.log(config.queues.dbUrl); // MongoDB URL for job storage
```

## Scripts

```bash
# Generate JobQueue and jobDefinitions
bun run codegen

# Type check without emitting
bun run typecheck  

# Generate code and type check
bun run dev
```

## Code Generation

The `scripts/codegen.ts` automatically:

1. **Scans** `src/jobs/` for job definition files
2. **Extracts** job exports (must end with 'Job')
3. **Generates** `JobQueue.ts` with type-safe queuing methods
4. **Generates** `jobDefinitions.ts` array for worker registration
5. **Maintains** proper imports and TypeScript types

### Adding New Jobs

1. Create `src/jobs/myNewJob.ts` following the pattern
2. Export as `myNewJobJob: JobDefinition<typeof schema>`
3. Run `bun run codegen`
4. New methods appear automatically in JobQueue

## Dependencies

- **agenda**: MongoDB-based job scheduling
- **zod**: Runtime validation and TypeScript inference
- **tsyringe**: Dependency injection container
- **ts-morph**: TypeScript compiler API for code generation

## Integration with Shared Packages

- **@repo/shared-core**: Configuration management and types
- **@repo/shared-services**: Logger and DI container
- Designed to work seamlessly with existing monorepo architecture

## Benefits

- **Type Safety**: Full TypeScript support from job definition to execution
- **Runtime Validation**: Zod schemas validate job data before queuing and processing
- **Zero Boilerplate**: Single file per job type, automatic code generation
- **Dependency Injection**: Clean service resolution in job handlers
- **Production Ready**: Built for reliability with retries, timeouts, and concurrency control
- **Development Friendly**: No build process, direct TypeScript imports

## Example Worker Application

```typescript
// apps/worker/src/index.ts
import { WorkerService } from '@repo/queues';
import { createContainer } from '@repo/shared-services';
import { createRepoConfig } from '@repo/shared-core';
import Agenda from 'agenda';

const config = createRepoConfig({ logger: { name: 'Worker' } });
const container = createContainer(config);
const logger = container.resolve('AppLogger');

const agenda = new Agenda({ 
    db: { address: config.queues.dbUrl },
    processEvery: '10 seconds',
    maxConcurrency: 20
});

const workerService = new WorkerService(agenda, logger);

// Register all job definitions and start processing
workerService.registerJobs(container);
await workerService.start();

logger.info('Worker started and processing jobs');
```

## License

Private package for internal use.