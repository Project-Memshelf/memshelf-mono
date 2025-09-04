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

        logger.info({ to, subject, body, templateId, priority }, 'Sending email');

        // Your email sending logic here
        // await emailService.send({ to, subject, body, templateId });

        logger.info(`Email sent successfully to ${to}`);
    },
    retries: 3,
    timeout: 30000, // 30 seconds
    concurrency: 5,
};
