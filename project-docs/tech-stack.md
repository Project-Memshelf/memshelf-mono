# Memshelf Tech Stack

## Runtime & Language

### Bun
- **JavaScript/TypeScript runtime** - Fast, modern alternative to Node.js
- **Built-in package manager** - Replaces npm/yarn with better performance
- **Native TypeScript support** - No additional compilation step needed
- **Built-in test runner** - Integrated testing without external dependencies

### TypeScript
- **Type safety** throughout the entire codebase
- **Enhanced developer experience** with IDE support and autocomplete
- **Compile-time error checking** reduces runtime issues
- **Better refactoring** and code maintainability

## Project Structure & Tooling

### Turbo (Monorepo)
- **Monorepo management** for organizing multiple packages
- **Intelligent caching** for faster builds and tests
- **Parallel task execution** across packages
- **Simplified dependency management** between related projects

### Docker
- **Containerization** for consistent environments
- **Docker Compose** for local development setup
- **Production images** for deployment flexibility
- **Multi-stage builds** for optimized container sizes

## Web Framework & API

### Hono
- **Lightweight web framework** optimized for edge computing
- **TypeScript-first** with excellent type inference
- **Middleware ecosystem** for common functionality
- **High performance** with minimal overhead
- **Web Standards compliant** (Request/Response objects)

### @hono/swagger
- **OpenAPI documentation** generation from code
- **Interactive API explorer** for testing endpoints
- **Type-safe client generation** possibilities
- **Automatic schema validation** documentation

## Database & Caching

### MariaDB
- **Relational database** with excellent performance
- **MySQL compatibility** with enhanced features
- **ACID compliance** for data integrity
- **JSON support** for flexible data structures
- **Full-text search** capabilities (complementing Meilisearch)

### TypeORM
- **Object-Relational Mapping** for database interactions
- **Migration management** for schema versioning
- **Type-safe database queries** with TypeScript
- **Active Record and Data Mapper** patterns support
- **Cross-database compatibility** for future flexibility

### MongoDB
- **Document database** for job queue persistence
- **High-performance** job storage and retrieval
- **Flexible schema** for varying job data structures
- **Built-in clustering** and replication support
- **Optimized for Agenda** job queue operations

### Valkey (Redis)
- **In-memory caching** for improved performance
- **Session storage** for API key validation
- **Rate limiting** support
- **Pub/sub capabilities** for future real-time features
- **Data structure operations** (sets, lists, hashes)

## Queue System & Background Jobs

### Agenda
- **MongoDB-based job queue** for reliable task processing
- **Persistent job storage** with automatic retries
- **Cron-like scheduling** for recurring tasks
- **Graceful shutdown** and job recovery
- **Concurrency control** and job prioritization
- **Dashboard monitoring** capabilities

### TypeScript Code Generation
- **Automatic type-safe job definitions** using ts-morph
- **Schema validation** with Zod for job data
- **Generated JobQueue class** with typed methods
- **DRY principles** - single job definition, multiple interfaces
- **Build-time safety** with comprehensive TypeScript checking

### Worker Architecture
- **Dedicated worker processes** for background job processing
- **Dependency injection** integration with tsyringe
- **Robust error handling** and logging throughout
- **Health monitoring** and graceful shutdown patterns
- **Horizontal scaling** support for multiple workers

## Search & Indexing

### Meilisearch
- **Full-text search engine** optimized for user-facing search
- **Typo tolerance** and fuzzy matching
- **Faceted search** with tag-based filtering
- **Real-time indexing** for instant search results
- **REST API** for easy integration
- **Lightweight deployment** with minimal resource requirements

## Validation & Data Processing

### Zod v3
- **Runtime type validation** for API inputs and outputs
- **Schema-first approach** with TypeScript integration
- **Composable validators** for complex data structures
- **Error handling** with detailed validation messages
- **Transform capabilities** for data normalization

## Development Tools

### BiomeJS v2.2
- **Fast linting and formatting** - Single tool for code quality
- **TypeScript and JavaScript support** with excellent performance
- **Import sorting** and organization
- **Consistent code style** enforcement across the team

### Lefthook
- **Git hooks management** for automated quality checks
- **Pre-commit validation** (linting, formatting, tests)
- **Conventional commit enforcement** for clean git history
- **Language-agnostic** hook configuration

### Conventional Commits
- **Standardized commit messages** for better project history
- **Automated changelog generation** from commit history
- **Semantic versioning** support
- **Better collaboration** through clear commit intent

## Logging & Monitoring

### Pino
- **High-performance JSON logging** for structured logs
- **Low overhead** logging suitable for production
- **Child loggers** for request context
- **Multiple transport options** (file, stdout, external services)
- **Redaction support** for sensitive data

## Process Management

### PM2
- **Process manager** for production deployments
- **Automatic restarts** on failure
- **Load balancing** across multiple processes
- **Memory and CPU monitoring** built-in
- **Log management** and rotation
- **Zero-downtime deployments** support

## Testing

### Bun Test Runner
- **Built-in test runner** - No additional dependencies needed
- **Fast execution** with parallel test running
- **TypeScript support** out of the box
- **Jest-compatible API** for easy migration
- **Code coverage reporting** built-in

## License & Legal

### AGPL v3
- **Copyleft license** ensuring modifications remain open source
- **Network copyleft** prevents proprietary SaaS without contribution
- **Commercial licensing** options available for proprietary use
- **Strong community protection** while allowing hosted services

## Development Environment

### Recommended Setup
- **Operating System**: Linux, macOS, or Windows with WSL2
- **Container Runtime**: Docker Desktop or Podman
- **IDE**: VS Code with TypeScript and Docker extensions
- **Git**: Version 2.28+ for modern Git features

### Performance Characteristics
- **Fast startup time** with Bun runtime
- **Efficient memory usage** with optimized dependencies
- **Quick development iteration** with hot reloading
- **Scalable architecture** supporting horizontal scaling

---

This tech stack prioritizes **developer experience**, **performance**, and **maintainability** while providing a solid foundation for both self-hosted and cloud deployments.