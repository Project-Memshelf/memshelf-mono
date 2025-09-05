# Changelog

All notable changes to `@memshelf/typeorm-zod` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-XX

### Added
- Initial release of `@memshelf/typeorm-zod`
- `@ZodProperty(zodSchema)` decorator for adding Zod validation to entity properties
- `@ZodColumn(columnOptions, zodSchema)` decorator combining TypeORM column with Zod validation
- `createEntitySchemas(entityClass)` function generating 5 schema variants:
  - `full` - Complete entity schema
  - `create` - Schema for creating new entities (omits auto-generated fields)
  - `update` - Schema for updating entities (id required, others optional)
  - `patch` - Schema for partial updates (all fields optional)
  - `query` - Schema for querying/filtering (all fields optional)
- Full TypeScript type inference support
- Comprehensive test suite
- Complete documentation with examples
- Zero-duplication solution for TypeORM + Zod integration

### Features
- Perfect TypeScript integration with full type safety
- Automatic schema generation from decorated entities
- Support for custom validation messages
- Handles TypeORM column constraints (nullable, default values)
- Easy migration path for existing projects
- No breaking changes to existing TypeORM code