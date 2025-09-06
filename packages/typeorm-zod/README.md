# @repo/typeorm-zod

Seamless integration between TypeORM entities and Zod validation using WeakMap-based metadata storage to prevent cross-entity pollution.

## Features

- **Pollution-Free Metadata Storage**: WeakMap-based metadata storage prevents entity metadata pollution
- **Inheritance-Aware Schema Generation**: Includes base class properties automatically  
- **Circular Dependency Safe**: Proper handling of circular dependencies between entities
- **Property Name Conflict Resolution**: Different entities can have properties with the same name
- **Automatic Schema Variants**: Create/update/patch schema variants generated automatically
- **TypeORM Integration**: Seamless integration with existing TypeORM decorators
- **Production Ready**: Comprehensive error handling and validation

## Quick Start

With `@repo/typeorm-zod`, you define validation once and get comprehensive schemas:

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ZodProperty, ZodColumn, createEntitySchemas } from '@repo/typeorm-zod';
import { z } from 'zod';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    @ZodProperty(z.string().uuid())
    id: string;

    @ZodColumn({ type: 'varchar', length: 255 }, z.string().min(1).max(255))
    name: string;

    @ZodColumn({ type: 'varchar', length: 255, unique: true }, z.string().email())
    email: string;

    @ZodColumn({ type: 'int', nullable: true }, z.number().int().positive().nullable())
    age?: number;
}

// Generate comprehensive schema collection
const userSchemas = createEntitySchemas(User);
// Available: full, create, update, patch, query schemas
```

## Installation

```bash
bun add @repo/typeorm-zod
```

### Inheritance Support

```typescript
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Base entity class
export abstract class AppEntity {
    @PrimaryGeneratedColumn('uuid')
    @ZodProperty(z.string().uuid())
    id: string;

    @CreateDateColumn()
    @ZodProperty(z.date())
    createdAt: Date;

    @UpdateDateColumn()
    @ZodProperty(z.date())
    updatedAt: Date;
}

// Child entity inherits validation
@Entity()
export class Product extends AppEntity {
    @ZodColumn({ type: 'varchar', length: 255 }, z.string().min(1))
    name: string;

    @ZodColumn({ type: 'decimal', precision: 10, scale: 2 }, z.number().positive())
    price: number;
}

// Automatically includes base class properties
const productSchemas = createEntitySchemas(Product);
// Schemas include: id, createdAt, updatedAt, name, price
```

### Available Schema Variants

The `createEntitySchemas()` function generates 5 schema variants:

```typescript
const userSchemas = createEntitySchemas(User);

// Full schema - includes all fields
userSchemas.full;

// Create schema - omits id, createdAt, updatedAt, deletedAt
userSchemas.create;

// Update schema - id required, everything else optional
userSchemas.update;

// Patch schema - all fields optional
userSchemas.patch;

// Query schema - all fields optional (for filtering)
userSchemas.query;
```

### Advanced Usage with Custom Options

```typescript
const userSchemas = createEntitySchemas(User, {
    // Additional fields to omit from create schema
    omitFromCreate: ['internalId'],
    
    // Additional fields to omit from update schema
    omitFromUpdate: ['email'], // Email cannot be updated
    
    // Custom field transformations
    transforms: {
        email: (schema) => schema.toLowerCase().trim(),
        age: (schema) => schema.min(13).max(120) // Add age constraints
    }
});
```

### Type Inference

All TypeScript types are automatically inferred:

```typescript
type CreateUserDto = z.infer<typeof userSchemas.create>;
type UpdateUserDto = z.infer<typeof userSchemas.update>;
type UserQueryDto = z.infer<typeof userSchemas.query>;

// Perfect type safety
const createUser = (data: CreateUserDto) => {
    // data.name is string
    // data.email is string | undefined  
    // data is fully typed and validated
};
```

### API Route Validation

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// Create user endpoint
app.post('/users', 
    zValidator('json', userSchemas.create),
    async (c) => {
        const userData = c.req.valid('json');
        // userData is fully typed and validated
        
        const user = userRepository.create(userData);
        await userRepository.save(user);
        
        return c.json({ success: true, user });
    }
);

// Update user endpoint  
app.patch('/users/:id',
    zValidator('json', userSchemas.patch),
    async (c) => {
        const updateData = c.req.valid('json');
        const userId = c.req.param('id');
        
        await userRepository.update(userId, updateData);
        return c.json({ success: true });
    }
);
```

## API Reference

### Decorators

#### `@ZodProperty(zodSchema)`

Adds Zod validation to any property:

```typescript
@ZodProperty(z.string().min(1).max(100))
name: string;

@ZodProperty(z.number().int().positive())
age: number;

@ZodProperty(z.string().email().optional())
email?: string;
```

#### `@ZodColumn(columnOptions, zodSchema)`

Combines TypeORM `@Column()` with Zod validation:

```typescript
@ZodColumn(
  { length: 255, nullable: false },
  z.string().min(1).max(255)
)
name: string;

// Equivalent to:
@Column({ length: 255, nullable: false })
@ZodProperty(z.string().min(1).max(255))
name: string;
```

### Schema Generation

#### `createEntitySchemas<T>(entityClass, options?)`

Generates all schema variants from an entity class.

**Parameters:**
- `entityClass`: Entity class constructor
- `options?`: Schema generation options

**Returns:** `EntitySchemas<T>` with `full`, `create`, `update`, `patch`, `query` schemas.

#### `createCreateSchema<T>(entityClass, options?)`

Generates only the create schema (convenience function).

#### `createUpdateSchema<T>(entityClass, options?)`  

Generates only the update schema (convenience function).

### Options

```typescript
interface SchemaGenerationOptions {
  /** Additional fields to omit from create schema */
  omitFromCreate?: string[];
  
  /** Fields to omit from update schema */
  omitFromUpdate?: string[];
  
  /** Custom field transformations */
  transforms?: Record<string, (schema: z.ZodTypeAny) => z.ZodTypeAny>;
}
```

## Advanced Usage

### Custom Transforms

```typescript
const UserSchemas = createEntitySchemas(User, {
  transforms: {
    // Transform email field for create schema
    email: (schema) => schema.transform(email => email.toLowerCase())
  }
});
```

### Migration Strategy

For existing projects, you can migrate gradually:

1. **Add decorators** to existing entities:
```typescript
// Before
@Column()
name: string;

// After  
@ZodProperty(z.string().min(1).max(255))
@Column()
name: string;
```

2. **Generate schemas** and replace manual ones:
```typescript
// Replace manual schemas
const UserSchemas = createEntitySchemas(User);
export const CreateUserSchema = UserSchemas.create;
```

3. **Remove duplicate types** and use inferred ones:
```typescript
// Remove manual type definitions
type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

## Benefits

- ✅ **Zero Duplication** - Single source of truth
- ✅ **Type Safety** - Perfect TypeScript integration  
- ✅ **Validation** - Automatic request validation
- ✅ **Productivity** - Write less, get more
- ✅ **Maintainability** - Update once, everywhere benefits
- ✅ **Migration Friendly** - Works with existing projects

## Requirements

- TypeORM >= 0.3.0
- Zod >= 4.0.0  
- TypeScript >= 5.0.0
- `reflect-metadata` package

## License

MIT