# Memshelf

**A shared knowledge backend that unifies fragmented thoughts, notes, and ideas into a single, searchable, and collaborative knowledge base.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)

> **API-first design** for AI agents, humans, and tools to seamlessly access shared knowledge

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/memshelf-mono.git
cd memshelf-mono
bun install

# Start development environment
docker-compose up -d
bun run dev

# Verify setup
curl http://localhost:3000/health
```

For detailed setup instructions, see **[Development Setup Guide](./project-docs/development/setup.md)**.

## What is Memshelf?

Memshelf solves **knowledge fragmentation** by providing a unified backend for notes, ideas, and collaborative knowledge management. Designed for modern workflows where AI agents and humans need seamless knowledge access.

**Core Problems Solved:**
- 📝 Notes scattered across multiple apps (Obsidian, Notion, etc.)
- 🤖 No unified way for AI agents to access knowledge
- 🔍 Knowledge exists but is impossible to find
- 🔗 Ideas remain isolated without connections

For complete overview and features, see **[Project Overview](./project-docs/README.md)**.

## Architecture

### 🏗️ **System Design**
- **API-first backend** with RESTful endpoints
- **Type-safe** throughout with TypeScript and Zod
- **Diff-based editing** for incremental updates (like Git for prose)
- **Production-ready** queue system for background jobs
- **Scalable** with horizontal worker processes

### 🛠️ **Tech Stack**
- **Runtime:** Bun with TypeScript
- **API:** Hono web framework
- **Databases:** MariaDB (main), MongoDB (jobs), Valkey (cache)
- **Search:** Meilisearch for full-text search
- **Queue:** Agenda with automatic code generation

See **[Complete Tech Stack](./project-docs/tech-stack.md)** for detailed technology choices.

## Project Structure

```
memshelf-mono/
├── apps/
│   ├── api/                 # Main REST API server
│   ├── cli/                 # CLI tools and dev commands  
│   └── workers/             # Background job processing
├── packages/
│   ├── shared-core/         # Configuration and utilities
│   ├── shared-services/     # Dependency injection
│   ├── queues/              # Type-safe job queue system
│   ├── database/            # TypeORM entities and migrations
│   └── ...                  # Additional shared packages
├── project-docs/            # Architecture and API documentation
└── docker/                  # Container configurations
```

## Key Features

### ✅ **Currently Implemented**
- **🔧 Development Environment** - Complete Docker setup with all services
- **⚡ Queue System** - Production-ready job processing with MongoDB
- **🏗️ Project Architecture** - Monorepo with shared packages and type safety
- **📋 CLI Tools** - Development commands and utilities
- **📚 Comprehensive Documentation** - Architecture, setup, and development guides

### 🚧 **In Development**
- **🔑 API Authentication** - API key management and validation
- **📝 Notes CRUD** - Core note creation and management
- **🏷️ Tag System** - Flexible note categorization
- **🔍 Search Integration** - Meilisearch setup and indexing

### 📋 **Planned**
- **✏️ Diff System** - Incremental content updates
- **🔗 Link System** - Automatic note relationships
- **👥 Workspaces** - Collaborative note organization
- **🤖 AI Integration** - Smart content processing

See **[Complete Development Roadmap](./project-docs/tasks.md)** for detailed task breakdown.

## Development

### Prerequisites
- [Bun](https://bun.sh/) 1.0+
- [Docker](https://docker.com/) & Docker Compose
- [Git](https://git-scm.com/) 2.28+

### Common Commands
```bash
# Development
bun run dev                  # Start API server
bun run workers:dev          # Start background workers
bun run queue:test           # Test queue system

# Quality
bun run lint                 # Code formatting and linting
bun run typecheck           # TypeScript validation
bun test                    # Run test suite

# Database
bun run db:migrate          # Run database migrations
bun run db:seed             # Seed development data
bun run queue:codegen       # Generate queue types
```

### Docker Services
- **API Server** - http://localhost:3000
- **Mongo Express** - http://localhost:8382 (Queue monitoring)
- **Meilisearch** - http://localhost:7700 (Search engine)

## Documentation

### 📖 **For Users**
- **[Project Overview](./project-docs/README.md)** - What Memshelf does and why
- **[API Documentation](./project-docs/api/api-schema.md)** - REST endpoints and schemas
- **[Authentication Guide](./project-docs/api/authentication.md)** - API key usage

### 🏗️ **For Developers**  
- **[Development Setup](./project-docs/development/setup.md)** - Local development environment
- **[Architecture Docs](./project-docs/architecture/)** - System design and specifications
- **[Tech Stack Guide](./project-docs/tech-stack.md)** - Technology choices and rationale
- **[Development Tasks](./project-docs/tasks.md)** - Current roadmap and priorities

### 🔧 **For AI/Claude**
- **[CLAUDE.md](./CLAUDE.md)** - Project context and development guidelines

## Contributing

1. **Setup** - Follow the [Development Setup Guide](./project-docs/development/setup.md)
2. **Architecture** - Review [system design](./project-docs/architecture/) before major changes
3. **Standards** - Use conventional commits, maintain type safety, add tests
4. **Quality** - Run `bun run lint` and `bun run typecheck` before commits

## Production Deployment

Memshelf is designed for flexible deployment:

- **🐳 Docker** - Production-ready containers with docker-compose
- ☁️ **Cloud Platforms** - Deploy on AWS, GCP, Azure, or any container platform
- 🏠 **Self-Hosted** - Run on your own infrastructure for complete control

See deployment documentation (coming soon) for detailed instructions.

## License

**AGPL v3** - Open source with network copyleft provisions.
- ✅ **Free** to use, modify, and self-host
- ✅ **Commercial licensing** available for proprietary use
- 🔒 **Modifications** must be shared if provided as a service

See [LICENSE](./LICENSE) for complete terms.

## Links

- **Documentation**: [project-docs/](./project-docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/memshelf-mono/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/memshelf-mono/discussions)

---

**Ready to unify your knowledge?** Start with the [Quick Start](#quick-start) guide above.