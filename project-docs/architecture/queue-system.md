# Memshelf Queue System

## Overview

The Memshelf queue system provides **type-safe, reliable background job processing** using MongoDB-based persistence and automatic TypeScript code generation. Built on Agenda.js with custom abstractions for developer experience and production reliability.

---

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Job Producer  │    │   Job Storage   │    │  Job Consumer   │
│                 │    │                 │    │                 │
│ - API Server    │───▶│ - MongoDB       │◀───│ - Worker App    │
│ - CLI Commands  │    │ - Agenda        │    │ - WorkerService │
│ - JobQueue      │    │ - Collections   │    │ - Job Handlers  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Agenda** - MongoDB-based job queue with persistence
- **MongoDB** - Document storage for job data and state
- **TypeScript** - Type safety throughout the queue system
- **Zod** - Runtime validation for job payloads
- **ts-morph** - Automatic code generation for type safety
- **TSyringe** - Dependency injection for job handlers

---

## Job Definition System

### Job Structure

Every job is defined as a TypeScript object with:

```typescript
// packages/queues/src/jobs/email.ts
import { z } from 'zod';
import type { JobDefinition } from '../types/JobDefinition';

const emailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string().optional(),
  templateId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const emailJob: JobDefinition<typeof emailJobSchema> = {
  name: 'send-email',
  schema: emailJobSchema,
  handler: async (job, container) => {
    const logger = container.resolve(AppLogger);
    const { to, subject, body } = job.attrs.data;
    
    logger.info({ to, subject }, 'Processing email job');
    
    // Email sending logic here
    await sendEmail({ to, subject, body });
    
    logger.info({ to }, 'Email sent successfully');
  },
  concurrency: 3,
  retries: 3,
  timeout: 30000, // 30 seconds
};
```

### Job Definition Interface

```typescript
export interface JobDefinition<TSchema extends z.ZodSchema> {
  name: string;                           // Unique job identifier
  schema: TSchema;                        // Zod schema for validation
  handler: JobHandler<TSchema>;           // Async job execution function
  concurrency?: number;                   // Max concurrent instances
  retries?: number;                       // Retry attempts on failure
  timeout?: number;                       // Execution timeout (ms)
}

type JobHandler<TSchema extends z.ZodSchema> = (
  job: Job<z.infer<TSchema>>,
  container: DependencyContainer
) => Promise<void>;
```

---

## Code Generation

### Automatic Type Safety

The system automatically generates type-safe interfaces from job definitions:

```bash
# Generate queue classes and job definitions
bun run --cwd packages/queues codegen
```

**Generated Files:**
- `src/generated/JobQueue.ts` - Type-safe job queueing methods
- `src/generated/jobDefinitions.ts` - Array of all job definitions

### Generated JobQueue Class

```typescript
// Auto-generated from job definitions
export class JobQueue {
  constructor(private agenda: Agenda, private logger?: Logger) {}

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
    // Similar implementation with scheduling
  }

  private async ensureConnection(): Promise<void> {
    // Wait for MongoDB connection before operations
  }
}
```

---

## Queue Operations

### Queuing Jobs (Immediate)

```typescript
import { JobQueue } from '@repo/queues';

const jobQueue = container.resolve(JobQueue);

// Type-safe job queuing
const job = await jobQueue.queueEmail({
  to: 'user@example.com',
  subject: 'Welcome to Memshelf',
  body: 'Thanks for joining!',
  priority: 'high'
});

console.log('Job queued:', job.attrs._id);
```

### Scheduling Jobs (Future)

```typescript
// Schedule for specific time
const scheduledJob = await jobQueue.scheduleEmail(
  new Date(Date.now() + 3600000), // 1 hour from now
  {
    to: 'user@example.com',
    subject: 'Reminder: Complete your profile',
    priority: 'normal'
  }
);

// Schedule with cron-like syntax
const recurringJob = await jobQueue.scheduleEmail(
  'in 30 minutes',
  emailData
);
```

### Job Status and Management

```typescript
// Check job status
console.log('Status:', job.attrs.status);
console.log('Attempts:', job.attrs.attempts);
console.log('Last run:', job.attrs.lastRunAt);

// Cancel scheduled job
await job.remove();

// Reschedule job
await job.schedule('in 2 hours');
```

---

## Worker System

### WorkerService

The `WorkerService` manages job registration and worker lifecycle:

```typescript
// apps/workers/src/index.ts
import { WorkerService } from '@repo/queues';

const agenda = createAgendaInstance(config);
const logger = container.resolve(AppLogger);
const workerService = new WorkerService(agenda, logger);

// Register all job definitions
workerService.registerJobs(container);

// Setup graceful shutdown
workerService.setupGracefulShutdown();

// Start processing jobs
await workerService.start();
```

### Graceful Shutdown

Robust shutdown handling prevents data loss:

```typescript
class WorkerService {
  private isShuttingDown = false;

  setupGracefulShutdown(): void {
    const handleShutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        this.logger.warn(`${signal} received, but shutdown is already in progress`);
        return;
      }
      this.isShuttingDown = true;
      
      this.logger.info(`${signal} received, shutting down gracefully`);
      try {
        await this.stop(); // Wait for jobs to complete
        process.exit(0);
      } catch (error) {
        this.logger.error(error, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    // ... other signal handlers
  }
}
```

---

## Error Handling & Reliability

### Automatic Retries

```typescript
export const emailJob: JobDefinition<typeof emailJobSchema> = {
  name: 'send-email',
  schema: emailJobSchema,
  handler: async (job, container) => {
    try {
      await sendEmail(job.attrs.data);
    } catch (error) {
      // Log error details
      logger.error(error, 'Email sending failed');
      
      // Job will be retried automatically based on retries config
      throw error;
    }
  },
  retries: 3,        // Retry up to 3 times
  timeout: 30000,    // 30 second timeout
};
```

### Error Monitoring

```typescript
// Job failure handling
workerService.agenda.on('fail', (error, job) => {
  logger.error({
    error: error.message,
    jobId: job.attrs._id,
    jobName: job.attrs.name,
    attempts: job.attrs.attempts,
  }, 'Job failed');
  
  // Send to monitoring service
  // alerting.sendAlert('job_failure', { jobId, error });
});

// Job success monitoring
workerService.agenda.on('success', (job) => {
  logger.info({
    jobId: job.attrs._id,
    jobName: job.attrs.name,
    duration: Date.now() - job.attrs.lastRunAt.getTime(),
  }, 'Job completed successfully');
});
```

---

## Development Workflow

### Adding New Job Types

1. **Define the job** in `packages/queues/src/jobs/`:
   ```typescript
   // packages/queues/src/jobs/notificationJob.ts
   export const notificationJob: JobDefinition<typeof notificationSchema> = {
     name: 'send-notification',
     schema: notificationSchema,
     handler: async (job, container) => {
       // Implementation
     },
   };
   ```

2. **Run code generation**:
   ```bash
   bun run --cwd packages/queues codegen
   ```

3. **Use the generated methods**:
   ```typescript
   const job = await jobQueue.queueNotification({
     userId: '123',
     message: 'New message received',
     type: 'push',
   });
   ```

### Testing Jobs

```typescript
// Test job handlers directly
import { emailJob } from '@repo/queues';

describe('Email Job', () => {
  it('should send email successfully', async () => {
    const mockJob = {
      attrs: {
        data: {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'Test content',
          priority: 'normal' as const,
        }
      }
    } as Job<typeof emailJob.schema>;

    const mockContainer = createMockContainer();
    
    await expect(emailJob.handler(mockJob, mockContainer))
      .resolves.not.toThrow();
    
    // Verify email was sent
    expect(mockEmailService.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'Test content',
    });
  });
});
```

---

## Production Deployment

### Environment Configuration

```bash
# Production environment variables
AGENDA_DB_URL="mongodb://user:pass@mongo-cluster:27017/jobs?authSource=admin"
AGENDA_PROCESS_EVERY="5 seconds"
AGENDA_MAX_CONCURRENCY=50

# Connection pool settings
AGENDA_MAX_POOL_SIZE=10
AGENDA_MIN_POOL_SIZE=2
AGENDA_SOCKET_TIMEOUT_MS=10000
```

### Scaling Workers

```yaml
# docker-compose.prod.yml
services:
  workers:
    image: memshelf-workers:latest
    replicas: 3  # Run multiple worker instances
    environment:
      AGENDA_DB_URL: ${AGENDA_DB_URL}
      AGENDA_MAX_CONCURRENCY: 10  # Per instance
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

### Monitoring

```typescript
// Health check endpoint
app.get('/health/workers', async (c) => {
  const stats = await agenda.stats();
  
  return c.json({
    status: 'healthy',
    workers: stats.workers,
    jobs: {
      running: stats.running,
      scheduled: stats.scheduled,
      failed: stats.failed,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
```

### Database Maintenance

```javascript
// Cleanup old completed jobs (run daily)
await agenda.cancel({ 
  lastFinishedAt: { 
    $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  } 
});

// Index optimization for performance
db.jobs.createIndex({ "nextRunAt": 1, "priority": -1 });
db.jobs.createIndex({ "name": 1, "nextRunAt": 1 });
```

---

## CLI Commands

The CLI provides convenient job management:

```bash
# Queue a test email job
bun run --cwd apps/cli src/index.ts dev queue:email

# Check worker health
bun run --cwd apps/cli src/index.ts dev health

# View application configuration
bun run --cwd apps/cli src/index.ts dev config
```

---

## Best Practices

### Job Design
- **Idempotent operations** - Jobs should be safe to retry
- **Atomic operations** - Complete or fail entirely
- **Timeout appropriately** - Set reasonable execution limits
- **Validate inputs** - Always use Zod schemas

### Performance
- **Batch processing** - Group related operations
- **Appropriate concurrency** - Balance throughput vs resources
- **Connection pooling** - Reuse database connections
- **Queue monitoring** - Track job metrics and performance

### Error Handling
- **Structured logging** - Include relevant context
- **Graceful degradation** - Handle partial failures
- **Dead letter queues** - Handle permanently failed jobs
- **Alert on failures** - Monitor critical job failures

### Security
- **Input validation** - Validate all job data
- **Access control** - Secure job queue access
- **Audit logging** - Track job execution
- **Resource limits** - Prevent resource exhaustion

---

This queue system provides **production-ready, type-safe background job processing** with excellent developer experience through automatic code generation and comprehensive error handling.