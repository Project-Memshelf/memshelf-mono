import { z } from 'zod';

// Schema for pino transport configuration
const PinoTransportSchema = z.object({
    target: z.string(),
    level: z.string().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
});

const LoggerOptionsSchema = z
    .object({
        level: z.string().optional(),
        name: z.string().optional(),
        enabled: z.boolean().optional(),
        // Support for file destination (pino's destination option)
        destination: z.union([z.string(), z.number()]).optional(),
        // Support for single transport or array of transports
        transport: z.union([PinoTransportSchema, z.array(PinoTransportSchema)]).optional(),
        // Additional pino options (using z.unknown() for functions since they're hard to type in Zod)
        formatters: z.record(z.string(), z.unknown()).optional(),
        serializers: z.record(z.string(), z.unknown()).optional(),
        redact: z.union([z.array(z.string()), z.record(z.string(), z.unknown())]).optional(),
    })
    .default({});

export const LoggerConfigSchema = z.object({
    name: z.string().min(1),
    options: LoggerOptionsSchema,
});

export type LoggerOptions = z.infer<typeof LoggerOptionsSchema>;
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;
