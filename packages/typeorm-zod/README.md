# @memshelf/typeorm-zod

**Zero-duplication TypeORM + Zod integration with decorators.**

Eliminate the need for separate entity definitions, validation schemas, and TypeScript types. Define once, use everywhere.

## Problem Solved

Before `@memshelf/typeorm-zod`, you had to maintain three separate definitions:

```typescript
// 1. TypeORM Entity
@Entity()
class User {
  @Column({ length: 255 })
  name: string;
  
  @Column({ unique: true })
  apiKey: string;
}

// 2. Zod Schema (duplicated structure + validation)
const CreateUserSchema = z.object({
  name: z.string().min(1).max(255),
  apiKey: z.string().min(10)
});

// 3. TypeScript Types (duplicated again)
type CreateUserDto = {
  name: string;
  apiKey: string;
};
```

## Solution

With `@memshelf/typeorm-zod`, you define once and get everything:

```typescript
@Entity()
class User extends BaseEntity {
  @ZodProperty(z.string().min(1, 'Name required').max(255))
  @Column({ length: 255 })
  name: string;
  
  @ZodProperty(z.string().min(10, 'API key too short'))
  @Column({ unique: true })
  apiKey: string;
}

// Auto-generate all schemas and types
const UserSchemas = createEntitySchemas(User);
type CreateUserDto = z.infer<typeof UserSchemas.create>;
```

## Installation

```bash
bun add @memshelf/typeorm-zod
```

## Usage

### Basic Setup

```typescript
import { ZodProperty, createEntitySchemas, z } from '@memshelf/typeorm-zod';

@Entity()
class User {
  @ZodProperty(z.string().uuid())
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ZodProperty(z.string().min(1).max(255))
  @Column({ length: 255 })
  name: string;

  @ZodProperty(z.string().email().optional())
  @Column({ nullable: true })
  email?: string;

  @ZodProperty(z.boolean().default(true))
  @Column({ default: true })
  isActive: boolean;
}

// Generate all schema variants
const UserSchemas = createEntitySchemas(User);
```

### Available Schemas

The `createEntitySchemas()` function generates 5 schema variants:

```typescript
const UserSchemas = createEntitySchemas(User);

// Full schema - includes all fields
UserSchemas.full;

// Create schema - omits id, createdAt, updatedAt, deletedAt
UserSchemas.create;

// Update schema - id required, everything else optional
UserSchemas.update;

// Patch schema - all fields optional
UserSchemas.patch;

// Query schema - all fields optional (for filtering)
UserSchemas.query;
```

### Type Inference

All TypeScript types are automatically inferred:

```typescript
type CreateUserDto = z.infer<typeof UserSchemas.create>;
type UpdateUserDto = z.infer<typeof UserSchemas.update>;
type UserQueryDto = z.infer<typeof UserSchemas.query>;

// Perfect type safety
const createUser = (data: CreateUserDto) => {
  // data.name is string
  // data.email is string | undefined  
  // data.isActive is boolean (with default)
};
```

### API Validation

Use in your API routes for automatic validation:

```typescript
// Express example
app.post('/users', (req, res) => {
  try {
    const validatedData = UserSchemas.create.parse(req.body);
    // validatedData is fully typed and validated
    const user = userRepository.create(validatedData);
    await userRepository.save(user);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    }
  }
});
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