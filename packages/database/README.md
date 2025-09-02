# @repo/database

TypeORM database package with entities, services, and migrations for modern web applications.

## Overview

This package provides TypeORM entities, service classes, and database configuration for data persistence. It features a robust service layer architecture with comprehensive CRUD operations and pagination support.

## Features

- **Modern Entity Architecture**: Complete entity framework with base classes and common patterns
- **Service Layer**: Comprehensive `BaseService` with business logic for data operations
- **Type Safety**: Full TypeScript integration with proper type mapping
- **Pagination**: Built-in pagination support with consistent interfaces
- **Data Integrity**: UUID primary keys and automatic timestamps
- **Bun Integration**: Optimized for Bun runtime with modern TypeScript configuration
- **Migration Support**: Full TypeORM migration system with helper scripts

## Installation

```bash
bun install
```

## Database Schema

### Entity Architecture

All entities extend the `AppEntity` base class which provides:
- **UUID Primary Keys**: All entities use `id: string` as primary key
- **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- **Soft Deletes**: Built-in soft delete support with `deletedAt` field
- **Type Safety**: Proper TypeScript types without non-null assertions

### Base Entity

```typescript
@Entity()
export class AppEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    
    @DeleteDateColumn()
    deletedAt: Date;
}
```

### Example Entity

```typescript
@Entity()
export class UserEntity extends AppEntity {
    @Column()
    name: string;
    
    @Column()
    @Index({ unique: true })
    email: string;
}
```

## Service Layer

### BaseService

The `BaseService` provides common CRUD operations for all entities:

```typescript
export class BaseService<T extends AppEntity> implements DbServiceInterface<T> {
    constructor(protected readonly repo: Repository<T>) {}
    
    async findById(id: string): Promise<T | null>
    async findByIdOrFail(id: string): Promise<T>
    async findMany(where: FindOptionsWhere<T>): Promise<T[]>
    async findOne(where: FindOptionsWhere<T>): Promise<T | null>
    async exists(where: FindOptionsWhere<T>): Promise<boolean>
    async count(where?: FindOptionsWhere<T>): Promise<number>
    async save(entity: DeepPartial<T>): Promise<T>
    async update(id: string, updates: QueryDeepPartialEntity<T>): Promise<void>
    async delete(id: string): Promise<void>
    async paginate(options: PaginationOptions): Promise<PaginatedResult<T>>
}
```

### Usage Example

```typescript
import { UserEntity } from '@repo/database';
import { BaseService } from '@repo/database';

class UserService extends BaseService<UserEntity> {
    constructor(userRepository: Repository<UserEntity>) {
        super(userRepository);
    }
    
    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.findOne({ email });
    }
    
    async getUsersPage(page: number = 1, limit: number = 10): Promise<PaginatedResult<UserEntity>> {
        return this.paginate({ page, limit });
    }
}
```

## Configuration

### Data Source Setup

```typescript
import { createDataSource, createRepoConfig } from '@repo/database';

// Create configuration
const config = createRepoConfig({
    logger: {
        name: 'MyApp',
        options: { level: 'info' }
    }
});

// Create data source
const dataSource = createDataSource(config);

// Initialize
await dataSource.initialize();
```

### Environment Variables

The package automatically loads database configuration from environment variables:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

## Migrations

### Available Scripts

```bash
# Create a new migration
bun run migration:create <MigrationName>

# Generate migration from entity changes
bun run migration:generate <MigrationName>

# Run pending migrations
bun run migration:run

# Revert last migration
bun run migration:revert

# Show migration status
bun run migration:show
```

### Creating Migrations

```bash
# Create a new empty migration
bun run migration:create CreateUserTable

# Generate migration from entity changes
bun run migration:generate UpdateUserEntity
```

## Type Safety

The package provides comprehensive TypeScript support with:

- **Generic Service Interfaces**: Type-safe service methods
- **Query Types**: Proper typing for query operations
- **Entity Relationships**: Type-safe relationship definitions
- **Validation**: Integration with Zod for runtime validation

## Pagination

Built-in pagination support with consistent interfaces:

```typescript
interface PaginationOptions {
    page?: number;
    limit?: number;
    where?: Partial<T>;
    order?: Record<string, 'ASC' | 'DESC'>;
    relations?: string[];
}

interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
```

## Best Practices

### Entity Design

```typescript
@Entity()
export class ProductEntity extends AppEntity {
    @Column()
    name: string;
    
    @Column('decimal', { precision: 10, scale: 2 })
    price: number;
    
    @Column({ default: true })
    isActive: boolean;
    
    @Index()
    @Column()
    categoryId: string;
}
```

### Service Implementation

```typescript
@injectable()
export class ProductService extends BaseService<ProductEntity> {
    constructor(@inject('ProductRepository') repo: Repository<ProductEntity>) {
        super(repo);
    }
    
    async findActiveProducts(): Promise<ProductEntity[]> {
        return this.findMany({ isActive: true });
    }
    
    async searchProducts(term: string): Promise<ProductEntity[]> {
        return this.repository
            .createQueryBuilder('product')
            .where('product.name LIKE :term', { term: `%${term}%` })
            .andWhere('product.isActive = :active', { active: true })
            .getMany();
    }
}
```

## Development

```bash
# Type checking
bun run typecheck

# Run migrations
bun run migration:run

# Create new migration
bun run migration:create NewFeature
```

## API Reference

### Core Classes

- `AppEntity` - Base entity with UUID, timestamps, and soft deletes
- `BaseService<T>` - Generic service class with CRUD operations
- `DbServiceInterface<T>` - Service interface definition

### Configuration Functions

- `createDataSource(config)` - Create TypeORM DataSource
- `createDataSourceOptions(config)` - Create DataSource options
- `createRepoConfig(overrides)` - Create repository configuration

## Requirements

- TypeORM >= 0.3.0
- TypeScript >= 5.0
- MySQL >= 8.0 (or compatible database)
- Node.js >= 18

## License

Private package for internal use.