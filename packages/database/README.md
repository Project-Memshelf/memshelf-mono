# @repo/database

TypeORM database package with entities, services, and migrations for modern web applications.

## Overview

This package provides TypeORM entities, service classes, and database configuration for data persistence. It features a robust service layer architecture with comprehensive CRUD operations and pagination support.

## Features

- **Modern Entity Architecture**: Complete entity framework with base classes and common patterns
- **Zod Integration**: Seamless TypeORM + Zod validation with `@repo/typeorm-zod`
- **Auto-Generated Schemas**: Pre-built Zod schemas and TypeScript types for all entities
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
    @ZodProperty(z.string().uuid())
    id: string;
    
    @CreateDateColumn()
    @ZodProperty(z.date())
    createdAt: Date;
    
    @UpdateDateColumn()
    @ZodProperty(z.date())
    updatedAt: Date;
    
    @DeleteDateColumn()
    @ZodProperty(z.date().nullable())
    deletedAt: Date;
}
```

### Example Entity

```typescript
@Entity()
export class UserEntity extends AppEntity {
    @ZodColumn({ type: 'varchar', length: 255 }, z.string().min(1).max(255))
    name: string;
    
    @ZodColumn({ type: 'varchar', length: 255, unique: true }, z.string().email())
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

The package uses a single DSN (Data Source Name) string for database configuration:

- `DATABASE_URL` - Database connection DSN string

### DSN Format

The DSN string supports multiple database types with TypeORM configuration via query parameters:

#### MySQL DSN
```bash
# Basic MySQL connection
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# MySQL with TypeORM configuration
DATABASE_URL="mysql://username:password@localhost:3306/database_name?synchronize=false&logging=false&timezone=Z&charset=utf8mb4&migrationsRun=true"
```

#### SQLite DSN
```bash
# File-based SQLite
DATABASE_URL="sqlite:///path/to/database.sqlite?synchronize=false&logging=false&migrationsRun=false"

# In-memory SQLite for testing
DATABASE_URL="sqlite://:memory:?synchronize=true&logging=false&migrationsRun=false"
```

#### PostgreSQL DSN
```bash
# PostgreSQL connection
DATABASE_URL="postgres://username:password@localhost:5432/database_name?synchronize=false&logging=false&migrationsRun=false"
```

### DSN Query Parameters

The following TypeORM configuration parameters can be set via DSN query string:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `synchronize` | boolean | `false` | Automatically synchronize database schema |
| `logging` | boolean | `false` | Enable TypeORM query logging |
| `migrationsRun` | boolean | `false` | Automatically run migrations on startup |
| `timezone` | string | `UTC` | Database timezone (MySQL only) |
| `charset` | string | `utf8mb4` | Database character set (MySQL only) |

### Configuration Examples

#### Development Environment
```bash
# Local development with MySQL
DATABASE_URL="mysql://devuser:devpass@localhost:3306/memshelf_dev?synchronize=true&logging=true&timezone=Z&charset=utf8mb4&migrationsRun=true"
```

#### Testing Environment
```bash
# Testing with in-memory SQLite
DATABASE_URL="sqlite://:memory:?synchronize=true&logging=false&migrationsRun=false"
```

#### Production Environment
```bash
# Production MySQL with optimized settings
DATABASE_URL="mysql://appuser:securepassword@prod-db.example.com:3306/memshelf_prod?synchronize=false&logging=false&timezone=UTC&charset=utf8mb4&migrationsRun=true"
```

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

## Zod Integration & Generated Types

### Auto-Generated Schema Types

All entities automatically generate comprehensive Zod schemas and TypeScript types via the `entity-schema-types.ts` file:

```typescript
import { 
    UserSchemas, 
    type CreateUserDto, 
    validateCreateUser 
} from '@repo/database';

// Each entity provides 5 schema variants: { full, create, update, patch, query }
// Plus TypeScript types and validation functions for all CRUD operations
const userData = validateCreateUser(requestBody);
```

### Generated Schema Variants

Each entity automatically provides 5 schema variants:

- **`full`** - Complete entity schema with all fields
- **`create`** - Omits auto-generated fields (id, timestamps)
- **`update`** - ID required, other fields optional
- **`patch`** - All fields optional for partial updates
- **`query`** - All fields optional for filtering/searching

### API Validation Example

```typescript
import { validateCreateUser, validatePatchUser, type User } from '@repo/database';

// Hono API route with validation
app.post('/users', async (c) => {
    try {
        const userData = validateCreateUser(await c.req.json());
        // userData is fully typed as CreateUserDto
        
        const user = userRepository.create(userData);
        await userRepository.save(user);
        return c.json({ success: true, user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ errors: error.errors }, 400);
        }
        throw error;
    }
});
```

## Type Safety

The package provides comprehensive TypeScript support with:

- **Auto-Generated Types**: All DTOs generated from entity Zod schemas
- **Generic Service Interfaces**: Type-safe service methods
- **Query Types**: Proper typing for query operations
- **Entity Relationships**: Type-safe relationship definitions
- **Runtime Validation**: Zod integration for API request validation

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

### Entity Design with Zod Validation

```typescript
@Entity()
export class ProductEntity extends AppEntity {
    @ZodColumn({ type: 'varchar', length: 255 }, z.string().min(1).max(255))
    name: string;
    
    @ZodColumn({ type: 'decimal', precision: 10, scale: 2 }, z.number().positive())
    price: number;
    
    @ZodColumn({ type: 'boolean', default: true }, z.boolean().default(true))
    isActive: boolean;
    
    @Index()
    @ZodColumn({ type: 'varchar', length: 36 }, z.string().uuid())
    categoryId: string;
}
```

### Service Implementation with Validation

```typescript
import { validateCreateProduct, validatePatchProduct, type Product } from '@repo/database';

@injectable()
export class ProductService extends BaseService<ProductEntity> {
    constructor(@inject('ProductRepository') repo: Repository<ProductEntity>) {
        super(repo);
    }
    
    async createValidatedProduct(data: unknown): Promise<Product> {
        // Auto-validates and types the input data
        const productData = validateCreateProduct(data);
        const product = this.repository.create(productData);
        return this.save(product);
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