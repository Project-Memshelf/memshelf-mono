# @repo/typescript-config

Centralized TypeScript configurations for the memshelf monorepo.

## Architecture

This package provides a hierarchical TypeScript configuration system:

```
tsconfig.json (base)
├── tsconfig.apps.json (base + app-specific)
└── tsconfig.packages.json (base + package-specific)
    └── tsconfig.decorators.json (packages + decorator support)
```

## Configurations

### `tsconfig.json` (Base)
Core TypeScript settings shared across all projects:
- ESNext target with bundler module resolution
- Strict mode enabled
- Modern JavaScript features

### `tsconfig.apps.json`
Extends decorators configuration for applications:
- Apps need decorator support to use database packages
- Build output configured per app

### `tsconfig.packages.json`
Minimal extension of base configuration for internal packages:
- No build outputs - packages remain as TypeScript source
- Source-first architecture support

### `tsconfig.decorators.json` 
Extends packages configuration for decorator-using packages:
- Experimental decorators enabled
- Decorator metadata emission
- Relaxed property initialization for TypeORM entities

## Usage

### For Apps (CLI, Web)
```json
{
  "extends": "@repo/typescript-config/tsconfig.apps.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### For Regular Packages (shared-core, shared-services)
```json
{
  "extends": "@repo/typescript-config/tsconfig.packages.json"
}
```

### For Decorator Packages (database, queues)
```json
{
  "extends": "@repo/typescript-config/tsconfig.decorators.json"
}
```

## Source-First Architecture

This configuration supports a source-first monorepo where:
- Internal packages remain as TypeScript source during development
- Apps bundle all dependencies from source at build time
- No intermediate build steps required for package changes
- Better debugging and development experience