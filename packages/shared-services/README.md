# @repo/shared-services

Service layer orchestration with dependency injection, caching, and logging for Node.js applications.

## Overview

The `shared-services` package provides dependency injection container setup and service orchestration using TSyringe. It handles the configuration of core services like databases, caching, logging, and Redis connections in a centralized, type-safe manner.

## Features

- **Dependency Injection**: Full TSyringe container setup and management
- **Service Registration**: Centralized service registration with proper lifecycle management
- **Logger Management**: Named logger instances with hierarchical organization
- **Database Integration**: Automatic DataSource configuration from `@repo/database`
- **Caching Support**: Keyv-based caching with Redis backing
- **Redis Integration**: IORedis connection management
- **Type Safety**: Full TypeScript support with proper injection tokens

## Installation

```bash
bun install
```

## Package Structure

```
src/
├── createContainer.ts    # Main DI container factory
└── index.ts             # Package exports
```

## Usage

### Creating a Service Container

```typescript
import { createContainer } from '@repo/shared-services';
import { createRepoConfig } from '@repo/shared-core';

// Create configuration
const config = createRepoConfig({
    logger: {
        name: 'MyApp',
        options: { level: 'info' }
    }
});

// Create DI container with all services registered
const container = createContainer(config);
```

### Using Registered Services

```typescript
import { DataSource } from 'typeorm';
import { AppLogger, AppCache, AppRedis } from '@repo/shared-services';

// Get services from container
const logger = container.resolve(AppLogger);
const dataSource = container.resolve(DataSource);
const cache = container.resolve(AppCache);
const redis = container.resolve(AppRedis);

// Use services
logger.info('Application started');
await dataSource.initialize();
await cache.set('key', 'value');
```

### Logger Usage

The container provides a configured logger instance:

```typescript
import { AppLogger } from '@repo/shared-services';

const logger = container.resolve(AppLogger);

// Use logger
logger.info('Application started');
logger.warn('API rate limit approaching');
logger.error('Operation failed');
```

## Registered Services

The container automatically registers these services:

### Core Services

| Service | Token | Type | Description |
|---------|-------|------|-------------|
| Logger | `AppLogger` | `Logger` | Main application logger |
| Database | `DataSource` | `DataSource` | TypeORM data source |
| Cache | `AppCache` | `TaggedKeyv` | Keyv-based caching |
| Redis | `AppRedis` | `IORedis` | Redis connection |

### Service Configuration

Services are configured from the `RepoConfig` object:

```typescript
interface RepoConfig {
    logger: {
        name: string;
        options: LoggerOptions;
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        logging: boolean;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
}
```

## Dependency Injection Patterns

### Constructor Injection

```typescript
import { inject, injectable } from 'tsyringe';
import { AppLogger, AppCache } from '@repo/shared-services';

@injectable()
export class UserService {
    constructor(
        @inject(AppLogger) private logger: Logger,
        @inject(AppCache) private cache: TaggedKeyv,
        @inject(DataSource) private dataSource: DataSource
    ) {}

    async getUser(id: string): Promise<User | null> {
        this.logger.info('Fetching user', { userId: id });
        
        // Check cache first
        const cached = await this.cache.get(`user:${id}`);
        if (cached) return cached;

        // Query database
        const user = await this.dataSource
            .getRepository(UserEntity)
            .findOneBy({ id });

        // Cache result
        if (user) {
            await this.cache.set(`user:${id}`, user, 300000); // 5 minutes
        }

        return user;
    }
}
```

### Service Resolution

```typescript
// Register your services
container.register<UserService>(UserService, UserService);

// Resolve services (dependencies are automatically injected)
const userService = container.resolve(UserService);
```

## Logger Configuration

The logger is configured with the application name from your config:

```typescript
const config = createRepoConfig({
    logger: {
        name: 'MyApp',
        options: { level: 'info' }
    }
});

const container = createContainer(config);
const logger = container.resolve(AppLogger);

// Logger includes the application name in logs
logger.info('User authenticated'); 
// Output: {"level":30,"time":1234567890,"name":"MyApp","msg":"User authenticated"}

logger.error('Connection failed');
// Output: {"level":50,"time":1234567890,"name":"MyApp","msg":"Connection failed"}
```

## Advanced Usage

### Custom Service Registration

```typescript
import { createContainer } from '@repo/shared-services';

const container = createContainer(config);

// Register additional services
container.register<EmailService>(EmailService, {
    useFactory: (c) => new EmailService(
        c.resolve(AppLogger),
        c.resolve(AppCache)
    )
});

// Register singletons
container.registerSingleton<NotificationService>(NotificationService);
```

### Multiple Containers

```typescript
// Create isolated containers for different contexts
const webContainer = createContainer(webConfig);
const workerContainer = createContainer(workerConfig);

// Each container has independent service instances
const webLogger = webContainer.resolve(AppLogger);
const workerLogger = workerContainer.resolve(AppLogger);
```

## Development

```bash
# Type checking
bun run typecheck

# Build package
bun run build
```

## API Reference

### Functions

- `createContainer(config: RepoConfig): DependencyContainer` - Create configured DI container

### Classes


### Injection Tokens

- `AppLogger: InjectionToken<Logger>` - Main application logger
- `AppCache: InjectionToken<TaggedKeyv>` - Application cache
- `AppRedis: InjectionToken<IORedis>` - Redis connection

## Requirements

- TSyringe >= 4.10.0
- TypeScript >= 5.0
- Node.js >= 18 (TSyringe decorators are Node.js only)

## Dependencies

- `@keyvhq/core` - Key-value storage abstraction
- `@repo/shared-core` - Core utilities and configuration
- `ioredis` - Redis client
- `tagged-keyv-wrapper` - Tagged caching wrapper
- `tsyringe` - Dependency injection container

## License

Private package for internal use.