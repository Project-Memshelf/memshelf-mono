# Database Configuration Refactor Plan

## Overview

Simple refactor to change database configuration from individual environment variables to a single DSN (Data Source Name) string.

## Current State

### Current DatabaseConfigSchema
```typescript
export const DatabaseConfigSchema = z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
    database: z.string(),
    logging: z.boolean(),
});
```

### Current createDataSourceOptions Usage
```typescript
export function createDataSourceOptions(repoConfig: RepoConfig): DataSourceOptions {
    return {
        type: 'mysql',
        ...repoConfig.database, // Contains host, port, username, etc.
        charset: 'utf8mb4',
        timezone: 'Z',
        synchronize: false,
        // ... rest of config
    };
}
```

## Proposed DSN-Based Configuration

### New DatabaseConfigSchema
```typescript
export const DatabaseConfigSchema = z.object({
    dsn: z.string(), // Single DSN string instead of individual fields
});
```

### DSN Format Examples

**MySQL:**
```
mysql://username:password@hostname:port/database_name?synchronize=false&logging=false&timezone=Z&charset=utf8mb4&migrationsRun=true
```

**SQLite:**
```
sqlite:///path/to/database.sqlite?synchronize=false&logging=false&migrationsRun=true
```

## Simple Implementation Plan

### 1. Update DatabaseConfigSchema
- Replace individual fields (host, port, username, password, database, logging) with single `dsn` string

### 2. Add parseDsnString() Method
- Add to `packages/database/src/config.ts`
- Takes DSN string, returns DataSourceOptions
- Parses URL and extracts connection parameters + query string config

### 3. Update createDataSourceOptions()
- Use `parseDsnString(repoConfig.database.dsn)` instead of spreading `repoConfig.database`

### 4. Update Documentation
- Simple DSN examples in README
- Update environment variable documentation

## Files to Modify

- `packages/shared-core/src/schemas/config/DatabaseConfigSchema.ts` - Update schema
- `packages/database/src/config.ts` - Add parseDsnString(), update createDataSourceOptions()
- `packages/database/README.md` - Update with DSN examples

## Breaking Changes

### Environment Variables
- **Removed**: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- **Added**: `DATABASE_URL` (single DSN string)

### DatabaseConfig Type
- Changes from individual fields to single `dsn` field

---

**Next Steps**: Simple, straightforward implementation - no over-engineering.