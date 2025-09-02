# typeorm-inflection-naming-strategy

A TypeORM naming strategy that automatically converts entity and property names to proper database conventions using
inflection and acronym-safe snake_case conversion.

## Features

- **Automatic pluralization**: Entity names are pluralized for table names (e.g., `User` → `users`)
- **Acronym-safe snake_case**: Handles acronyms properly (e.g., `UserAPIKey` → `user_api_key`)
- **Entity suffix stripping**: Removes "Entity" suffix from class names automatically
- **Comprehensive naming**: Covers tables, columns, indexes, primary keys, foreign keys, and unique constraints
- **Performance optimized**: Includes table name caching for better performance
- **User override support**: Respects custom table/column names when specified

## Installation

```bash
bun install
```

## Usage

```typescript
import {DataSource} from 'typeorm';
import {InflectionNamingStrategy} from 'typeorm-inflection-naming-strategy';

const dataSource = new DataSource({
    // ... your database configuration
    namingStrategy: new InflectionNamingStrategy(),
    entities: [/* your entities */],
});
```

## Examples

### Entity to Table Name Conversion

```typescript

@Entity()
class UserProfile {
    // ...
}

// Table name: user_profiles

@Entity()
class APIKeyEntity {
    // ...
}

// Table name: api_keys (Entity suffix stripped, then pluralized)

@Entity('custom_table_name')
class CustomEntity {
    // ...
}

// Table name: custom_table_name (custom names are preserved)
```

### Property to Column Name Conversion

```typescript

@Entity()
class User {
    @Column()
    firstName: string; // Column: first_name

    @Column()
    userAPIToken: string; // Column: user_api_token

    @Column('custom_column')
    someProperty: string; // Column: custom_column (custom names preserved)
}
```

### Constraint Naming

The naming strategy automatically generates consistent names for database constraints:

- **Primary Keys**: `{table_name}_{column_names}_pk`
- **Foreign Keys**: `{table_name}_{column_names}_fk`
- **Indexes**: `{table_name}_{column_names}` (with `_partial` suffix for partial indexes)
- **Unique Constraints**: `{table_name}_{column_names}_unique`

## Acronym Handling

The strategy properly handles acronyms and abbreviations:

| Input             | Output             |
|-------------------|--------------------|
| `APIKey`          | `api_key`          |
| `HTTPSConnection` | `https_connection` |
| `XMLParser`       | `xml_parser`       |
| `HTMLElement`     | `html_element`     |
| `URLPath`         | `url_path`         |

## Differences from Other Naming Strategies

This naming strategy provides several advantages over popular alternatives like [
`typeorm-naming-strategies`](https://github.com/tonivj5/typeorm-naming-strategies)' `SnakeNamingStrategy`:

### Key Differences

| Feature                     | This Strategy                                           | SnakeNamingStrategy                                                  |
|-----------------------------|---------------------------------------------------------|----------------------------------------------------------------------|
| **Acronym Handling**        | ✅ Acronym-safe (`HTTPSConnection` → `https_connection`) | ❌ Poor acronym handling (`HTTPSConnection` → `h_t_t_p_s_connection`) |
| **Table Pluralization**     | ✅ Automatic (`User` → `users`)                          | ❌ No pluralization (`User` → `user`)                                 |
| **Entity Suffix Stripping** | ✅ Removes "Entity" suffix (`UserEntity` → `users`)      | ❌ Keeps suffix (`UserEntity` → `user_entity`)                        |
| **Performance**             | ✅ Table name caching                                    | ❌ No caching                                                         |
| **Constraint Naming**       | ✅ Comprehensive naming for all constraints              | ❌ Limited constraint support                                         |
| **Dependency**              | ✅ Uses `inflection` for proper pluralization            | ❌ Uses basic TypeORM string utils                                    |

### Comparison Examples

```typescript
// Entity class
@Entity()
class UserAPIKey {
    @Column()
    httpsEndpoint: string;
}

// This strategy output:
// Table: user_api_keys (pluralized, acronym-safe)
// Column: https_endpoint (acronym-safe)

// SnakeNamingStrategy output:
// Table: user_a_p_i_key (not pluralized, poor acronym handling)
// Column: https_endpoint (same result for simple cases)
```

### Why Choose This Strategy?

1. **Better Database Conventions**: Follows standard database naming with pluralized table names
2. **Acronym-Safe**: Properly handles common acronyms (API, HTTP, XML, etc.) without awkward underscores
3. **Performance**: Includes caching for frequently accessed table names
4. **Comprehensive**: Handles all constraint types with consistent naming patterns
5. **Clean Entity Names**: Automatically strips "Entity" suffixes from class names

## API Reference

### InflectionNamingStrategy

The main naming strategy class that extends TypeORM's `DefaultNamingStrategy`.

#### Methods

- `tableName(targetName: string, userSpecifiedName?: string): string`
- `columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string`
- `indexName(tableOrName: Table | View | string, columns: string[], where?: string): string`
- `primaryKeyName(tableOrName: Table | string, columnNames: string[]): string`
-
`foreignKeyName(tableOrName: Table | string, columnNames: string[], referencedTablePath?: string, referencedColumnNames?: string[]): string`
- `uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string`

## Development

```bash
# Type checking
bun run typecheck

# Run tests
bun test
```

## Requirements

- TypeORM >= 0.3.0
- TypeScript >= 5.0
- Node.js >= 18

## License

Private package for internal use.