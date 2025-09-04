# @repo/cli

Memshelf CLI application built with Commander.js for managing your digital memory shelf.

## Features

- **Development Tools**: Health checks, configuration display, system info
- **Modular Architecture**: Well-organized command structure
- **Dependency Injection**: Uses shared services with TSyringe
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error handling and graceful shutdown

## Installation

```bash
bun install
```

## Usage

### Development

```bash
# Run CLI in development
bun run dev

# Build the CLI
bun run build

# Type check
bun run typecheck
```

### Available Commands

#### Development Commands

```bash
# Show application information
bun run dev dev info

# Run system health check
bun run dev dev health

# Show current configuration (sanitized)
bun run dev dev config

# Show environment variables
bun run dev dev env
bun run dev dev env --all
```

#### Global Options

```bash
# Enable verbose output
bun run dev --verbose dev info

# Suppress non-error output
bun run dev --quiet dev health

# Show help
bun run dev --help
bun run dev dev --help

# Show version
bun run dev --version
```

## Architecture

### Command Structure

```
src/
├── commands/
│   ├── dev.ts           # Development utilities
│   └── index.ts         # Command exports
└── index.ts             # Main CLI entry point
```

### Dependency Injection

The CLI uses the shared services container for dependency injection:

```typescript
import { createContainer } from '@repo/shared-services';
import { createRepoConfig } from '@repo/shared-core';

const config = createRepoConfig({
    logger: { name: 'Memshelf-CLI' }
});

const container = createContainer(config);
```

Services available in commands:
- `AppLogger` - Application logger
- `DataSource` - TypeORM database connection  
- `AppCache` - Application cache
- `AppRedis` - Redis connection

### Adding New Commands

1. Create a new command file in `src/commands/`:

```typescript
// src/commands/users.ts
import { AppLogger } from '@repo/shared-services';
import { Command } from 'commander';
import type { DependencyContainer } from 'tsyringe';

export function createUsersCommand(container: DependencyContainer): Command {
    const logger = container.resolve(AppLogger);
    const usersCommand = new Command('users');
    usersCommand.description('User management commands');

    usersCommand
        .command('list')
        .description('List all users')
        .action(async () => {
            logger.info('Listing all users...');
            // Implement user listing
        });

    return usersCommand;
}
```

2. Export from `src/commands/index.ts`:

```typescript
export { createDevCommand } from './dev';
export { createUsersCommand } from './users';
```

3. Add to main CLI in `src/index.ts`:

```typescript
import { createDevCommand, createUsersCommand } from './commands';

program.addCommand(createDevCommand(container));
program.addCommand(createUsersCommand(container));
```

## Environment Configuration

The CLI uses environment variables from `@repo/shared-core`:

- `NODE_ENV` - Environment (development, production, test)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number

## Error Handling

The CLI includes comprehensive error handling:

- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals
- **Promise Rejection**: Catches unhandled promise rejections
- **Exception Handling**: Catches uncaught exceptions
- **Command Errors**: Proper error reporting with exit codes
- **Help Display**: Clean help display without errors

## Building for Production

```bash
# Build the CLI
bun run build

# The built CLI will be in dist/index.js
# You can run it directly:
node dist/index.js --help
```

## Examples

### Common Workflows

```bash
# Check system status
bun run dev dev health
bun run dev dev info

# Debug configuration issues
bun run dev dev config
bun run dev dev env
```

### Scripting

The CLI is designed to be script-friendly:

```bash
#!/bin/bash
# health-check.sh

echo "Checking system health..."
bun run dev dev health

echo "Displaying system info..."
bun run dev dev info

echo "Checking configuration..."
bun run dev dev config
```

## Development

```bash
# Type checking
bun run typecheck

# Run specific commands in development
bun run dev dev info
bun run dev dev health
bun run dev dev config
```

## Requirements

- Bun >= 1.2.0
- TypeScript >= 5.0
- Node.js >= 18 (for production builds)
- Access to configured database and Redis instances

## Dependencies

- `commander` - CLI framework
- `@repo/shared-core` - Core utilities and configuration
- `@repo/shared-services` - Service layer with DI
- `@repo/database` - Database entities and services

## Key Features

- **Streamlined Development Focus**: Focused on essential development and debugging tools
- **Proper Logging**: Uses structured logging throughout with `AppLogger`
- **Service Integration**: Tests connectivity to all core services (Database, Redis, Cache)
- **Configuration Management**: Sanitized configuration display for debugging
- **Environment Inspection**: Safe environment variable display with automatic redaction

## License

Private package for internal use.