# @repo/shared-core

Core utilities and types for web applications. This package provides configuration management, pagination helpers, and logging utilities that can be used across both Node.js and web environments.

## Overview

The `shared-core` package provides fundamental building blocks for web applications, including configuration schemas, pagination utilities, and logger setup. It contains pure TypeScript code that can be safely bundled for web applications while also being used in Node.js applications.

## Features

- **Configuration Management**: Zod-based schemas for database, Redis, and logger configuration
- **Type Safety**: Comprehensive TypeScript interfaces and types
- **Pagination Utilities**: Generic pagination types and schemas
- **Logger Setup**: Pino logger configuration utilities
- **Web-Safe**: No Node.js-specific dependencies that prevent web bundling
- **Framework Agnostic**: Works with any JavaScript framework or runtime

## Installation

```bash
bun install
```

## Package Structure

```
src/
├── utils/
│   ├── config/          # Configuration schemas and utilities
│   │   ├── LoggerConfigSchema.ts    # Pino logger configuration
│   │   ├── DatabaseConfigSchema.ts  # Database configuration
│   │   ├── RepoConfigSchema.ts      # Combined repository configuration
│   │   ├── createConfig.ts          # Configuration factory function
│   │   └── index.ts                 # Configuration exports
│   ├── logger.ts        # Logger utilities
│   └── index.ts         # Utility exports
├── DeepPartial.ts       # Utility type for deep partial objects
├── pagination.ts        # Pagination types and schemas
└── index.ts             # Main package exports
```

## Core Types

### Configuration Types

```typescript
import { DatabaseConfig, LoggerConfig, RepoConfig } from '@repo/shared-core';

// Database configuration
interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    logging: boolean;
}

// Logger configuration
interface LoggerConfig {
    name: string;
    options: LoggerOptions; // From pino
}

// Combined repository configuration
interface RepoConfig {
    nodeEnv: { env: NodeEnv; isDevelopment: boolean; isTesting: boolean; };
    database: DatabaseConfig;
    logger: LoggerConfig;
    redis: RedisConfig;
}
```

### Pagination Types

```typescript
import { PaginationOptions, PaginatedResult } from '@repo/shared-core';

// Pagination request options
interface PaginationOptions<T = Record<string, unknown>> {
    page?: number;
    limit?: number;
    where?: Partial<T>;
    order?: Record<string, 'ASC' | 'DESC'>;
    relations?: string[];
}

// Paginated response
interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
```

## Configuration Management

### Creating Configuration

```typescript
import { createRepoConfig, LoggerConfig } from '@repo/shared-core';

// Create configuration with environment variables and overrides
const config = createRepoConfig({
    logger: {
        name: 'my-app',
        options: {
            level: 'debug'
        }
    },
    database: {
        host: 'custom-host' // Override environment variable
    }
});

console.log(config.database.host); // From DB_HOST env var
console.log(config.logger.name); // 'my-app'
```

### Environment Variables

The configuration system automatically loads these environment variables:

- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 3306)
- `DB_USERNAME` (default: memshelf)
- `DB_PASSWORD` (default: memshelf)
- `DB_DATABASE` (default: memshelf)
- `REDIS_HOST` (default: localhost)
- `REDIS_PORT` (default: 6379)
- `REDIS_PASSWORD` (optional)
- `REDIS_DB` (default: 0)

### Validation

All configuration is validated using Zod schemas:

```typescript
import { DatabaseConfigSchema, LoggerConfigSchema } from '@repo/shared-core';

// Validate database configuration
const databaseConfig = DatabaseConfigSchema.parse({
    host: 'localhost',
    port: 3306,
    username: 'memshelf',
    password: 'memshelf',
    database: 'memshelf',
    logging: true
});

// Validate logger configuration
const loggerConfig = LoggerConfigSchema.parse({
    name: 'my-logger',
    options: {
        level: 'info'
    }
});
```

## Pagination

### Using Pagination Schemas

```typescript
import { PaginationOptionsSchema, PaginatedResultSchema } from '@repo/shared-core';
import { z } from 'zod';

// Define your data schema
const PostSchema = z.object({
    id: z.string(),
    title: z.string(),
    author: z.string()
});

// Create paginated result schema
const PaginatedPostsSchema = PaginatedResultSchema(PostSchema);

// Validate pagination options
const options = PaginationOptionsSchema.parse({
    page: 1,
    limit: 25,
    order: { createdAt: 'DESC' }
});

// Validate paginated response
const result = PaginatedPostsSchema.parse({
    items: [/* array of posts */],
    total: 150,
    page: 1,
    limit: 25,
    totalPages: 6
});
```

## Logger Utilities

### Creating Base Logger

```typescript
import { createBaseLogger } from '@repo/shared-core';

// Create logger with default pretty printing
const logger = createBaseLogger();

// Create logger with custom options
const customLogger = createBaseLogger({
    level: 'debug',
    name: 'my-service',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: false,
            translateTime: 'iso'
        }
    }
});

logger.info('Hello world');
customLogger.debug('Debug message');
```

## Usage Examples

### Node.js Application

```typescript
import { createRepoConfig, createBaseLogger } from '@repo/shared-core';

// Initialize configuration
const config = createRepoConfig({
    logger: {
        name: 'memshelf-app',
        options: { level: 'info' }
    }
});

// Create logger from config
const logger = createBaseLogger(config.logger.options);

// Use database configuration
const dataSource = new DataSource({
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database
});

logger.info('Application started', { database: config.database.database });
```

### Web Application

```typescript
import { PaginationOptionsSchema, type PaginatedResult } from '@repo/shared-core';

// Client-side pagination
export function usePagination<T>(fetchFn: (options: PaginationOptions) => Promise<PaginatedResult<T>>) {
    const [options, setOptions] = useState({ page: 1, limit: 10 });
    const [result, setResult] = useState<PaginatedResult<T> | null>(null);

    useEffect(() => {
        // Validate options before API call
        const validOptions = PaginationOptionsSchema.parse(options);
        fetchFn(validOptions).then(setResult);
    }, [options, fetchFn]);

    return { result, setOptions };
}
```

## API Reference

### Configuration Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `createRepoConfig(options)` | Create validated repository configuration | `RepoConfig` |
| `createBaseLogger(options?)` | Create pino logger with defaults | `Logger` |

### Schemas

| Schema | Description | Validates |
|--------|-------------|-----------|
| `DatabaseConfigSchema` | Database configuration | Database connection settings |
| `RedisConfigSchema` | Redis configuration | Redis connection settings |
| `LoggerConfigSchema` | Logger configuration | Pino logger options |
| `RepoConfigSchema` | Combined repository config | Database + Redis + Logger config |
| `PaginationOptionsSchema` | Pagination request options | Page, limit, filters |
| `PaginatedResultSchema<T>` | Paginated response | Items array with metadata |

## Development

```bash
# Type checking
bun run typecheck

# Build package
bun run build

# Clean build artifacts
bun run clean
```

## Design Principles

### Type Safety
All configuration and data structures are validated using Zod schemas for runtime type safety.

### Environment-Based Configuration
Configuration automatically loads from environment variables with the ability to override specific values.

### Framework Agnostic
Code is written in pure TypeScript without assumptions about the runtime environment or framework being used.

### Web Compatible
No Node.js-specific dependencies that would prevent bundling for web applications.

## Related Packages

- **[@repo/shared-services](../shared-services)**: Service layer orchestration
- **[@repo/database](../database)**: Database entities and services

## License

Reusable package for web application development.