# @repo/cli

Memshelf CLI application built with Commander.js for managing your digital memory shelf.

## Features

- **Database Management**: Run migrations, check status, seed data
- **Cache Operations**: Clear cache, view stats, get/set values
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

#### Database Commands

```bash
# Run database migrations
bun run dev db migrate

# Revert last migration
bun run dev db revert

# Check migration status
bun run dev db status

# Seed database with sample data
bun run dev db seed
bun run dev db seed --environment production
```

#### Cache Commands

```bash
# Clear all caches
bun run dev cache clear

# Clear only Redis cache
bun run dev cache clear --redis-only

# Clear only application cache
bun run dev cache clear --app-cache-only

# Show cache statistics
bun run dev cache stats

# Get a value from cache
bun run dev cache get user:123
bun run dev cache get config --json

# Set a value in cache
bun run dev cache set user:123 "John Doe"
bun run dev cache set config '{"theme":"dark"}' --json --ttl 3600
```

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
bun run dev --verbose db migrate

# Suppress non-error output
bun run dev --quiet cache clear

# Show help
bun run dev --help
bun run dev db --help

# Show version
bun run dev --version
```

## Architecture

### Command Structure

```
src/
├── commands/
│   ├── database.ts      # Database management commands
│   ├── cache.ts         # Cache operations
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
- `DataSource` - TypeORM database connection
- `AppLogger` - Application logger
- `AppCache` - Application cache
- `AppRedis` - Redis connection

### Adding New Commands

1. Create a new command file in `src/commands/`:

```typescript
// src/commands/users.ts
import { Command } from 'commander';
import type { DependencyContainer } from 'tsyringe';

export function createUsersCommand(container: DependencyContainer): Command {
    const usersCommand = new Command('users');
    usersCommand.description('User management commands');

    usersCommand
        .command('list')
        .description('List all users')
        .action(async () => {
            // Implement user listing
        });

    return usersCommand;
}
```

2. Export from `src/commands/index.ts`:

```typescript
export { createUsersCommand } from './users';
```

3. Add to main CLI in `src/index.ts`:

```typescript
import { createUsersCommand } from './commands';

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
# Set up a new environment
bun run dev db migrate
bun run dev db seed
bun run dev dev health

# Clear caches after deployment
bun run dev cache clear

# Check system status
bun run dev dev health
bun run dev cache stats

# Debug configuration issues
bun run dev dev config
bun run dev dev env
```

### Scripting

The CLI is designed to be script-friendly:

```bash
#!/bin/bash
# deployment.sh

echo "Running database migrations..."
bun run dev db migrate

echo "Clearing caches..."
bun run dev cache clear

echo "Health check..."
bun run dev dev health
```

## Development

```bash
# Type checking
bun run typecheck

# Run specific commands in development
bun run dev db migrate
bun run dev cache clear
bun run dev dev info
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

## License

Private package for internal use.