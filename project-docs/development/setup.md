# Development Setup Guide

## Prerequisites

### Required Software
- **Bun** v1.0+ - JavaScript runtime and package manager
- **Docker** v20.0+ & **Docker Compose** v2.0+ - Container management
- **Git** v2.28+ - Version control
- **Node.js** v18+ (for tooling compatibility if needed)

### Operating System Support
- **Linux** (Ubuntu 20.04+, Debian 11+)
- **macOS** (10.15+)
- **Windows** (with WSL2)

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/memshelf.git
cd memshelf
```

### 2. Install Dependencies
```bash
# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Install project dependencies
bun install
```

### 3. Start Development Environment
```bash
# Start all services (database, cache, search)
docker-compose up -d

# Run database migrations
bun run db:migrate

# Seed development data (optional)
bun run db:seed

# Start development server
bun run dev
```

### 4. Verify Setup
```bash
# Check API health
curl http://localhost:3000/health

# Run tests
bun test

# Check linting
bun run lint
```

---

## Repository Structure

```
memshelf/
├── apps/
│   ├── api/                 # Main API application
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── entities/    # Database entities
│   │   │   ├── middleware/  # HTTP middleware
│   │   │   └── utils/       # Utility functions
│   │   ├── tests/           # API tests
│   │   └── package.json
│   └── cli/                 # CLI tools (future)
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── database/            # Database schemas and migrations
│   └── search/              # Search service integration
├── docker/
│   ├── api.dockerfile       # API container
│   ├── dev.dockerfile       # Development container
│   └── nginx.conf           # Reverse proxy config
├── docs/                    # Documentation
├── scripts/                 # Development scripts
├── docker-compose.yml       # Development services
├── docker-compose.prod.yml  # Production services
├── turbo.json              # Monorepo configuration
├── package.json            # Root package configuration
└── README.md
```

---

## Environment Configuration

### Environment Files
Create the following environment files:

**.env.local** (development):
```bash
# Database
DATABASE_URL="mysql://memshelf:password@localhost:3306/memshelf_dev"

# Cache
REDIS_URL="redis://localhost:6379"

# Search
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_MASTER_KEY="development_key"

# API
API_PORT=3000
API_KEY_SALT="your_development_salt_here"
JWT_SECRET="your_jwt_secret_here"

# Logging
LOG_LEVEL="debug"
LOG_FORMAT="pretty"

# Development
NODE_ENV="development"
```

**.env.test** (testing):
```bash
DATABASE_URL="mysql://memshelf:password@localhost:3306/memshelf_test"
REDIS_URL="redis://localhost:6379/1"
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_MASTER_KEY="test_key"
API_PORT=3001
NODE_ENV="test"
LOG_LEVEL="error"
```

### Environment Variables Reference
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MariaDB connection string | - | Yes |
| `REDIS_URL` | Valkey/Redis connection string | - | Yes |
| `MEILISEARCH_URL` | Meilisearch server URL | - | Yes |
| `MEILISEARCH_MASTER_KEY` | Meilisearch admin key | - | Yes |
| `API_PORT` | HTTP server port | 3000 | No |
| `API_KEY_SALT` | Salt for API key hashing | - | Yes |
| `LOG_LEVEL` | Logging level | info | No |
| `NODE_ENV` | Environment mode | development | No |

---

## Docker Compose Services

### Development Services
```yaml
# docker-compose.yml
services:
  database:
    image: mariadb:11
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: memshelf_dev
      MYSQL_USER: memshelf
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  cache:
    image: valkey/valkey:7
    ports:
      - "6379:6379"
    command: valkey-server --appendonly yes
    volumes:
      - cache_data:/data

  search:
    image: getmeili/meilisearch:v1.5
    environment:
      MEILI_MASTER_KEY: development_key
      MEILI_ENV: development
    ports:
      - "7700:7700"
    volumes:
      - search_data:/meili_data

  api:
    build:
      context: .
      dockerfile: docker/dev.dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://memshelf:password@database:3306/memshelf_dev
      REDIS_URL: redis://cache:6379
      MEILISEARCH_URL: http://search:7700
      MEILISEARCH_MASTER_KEY: development_key
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - database
      - cache
      - search
    command: bun run dev

volumes:
  db_data:
  cache_data:
  search_data:
```

### Service Management
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d database

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Reset all data
docker-compose down -v
```

---

## Database Setup

### Running Migrations
```bash
# Generate new migration
bun run db:migration:generate -- MigrationName

# Run pending migrations
bun run db:migrate

# Revert last migration
bun run db:migrate:revert

# Reset database (development only)
bun run db:reset
```

### Database Scripts
```json
{
  "scripts": {
    "db:migrate": "bun run --cwd packages/database migrate",
    "db:migration:generate": "bun run --cwd packages/database migration:generate",
    "db:seed": "bun run --cwd packages/database seed",
    "db:reset": "bun run --cwd packages/database reset"
  }
}
```

### Sample Data
```bash
# Create development user and workspace
bun run db:seed

# Creates:
# - User: "Development User" with API key
# - Workspace: "Development Workspace"  
# - Sample notes with content and tags
```

---

## Development Workflow

### Code Quality Tools
```bash
# Format code
bun run format

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Type check
bun run type-check

# Run all quality checks
bun run quality
```

### Testing
```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific test suite
bun test --test-name-pattern="auth"

# Watch mode
bun test --watch

# Integration tests (requires Docker services)
bun run test:integration
```

### Git Hooks (Lefthook)
Automatic quality checks on commits:

```yaml
# lefthook.yml
pre-commit:
  commands:
    lint:
      glob: "*.{ts,js,json}"
      run: bun run lint
    type-check:
      glob: "*.{ts}"
      run: bun run type-check
    test:
      glob: "*.{ts,js}"
      run: bun test --bail
```

### Conventional Commits
```bash
# Feature
git commit -m "feat: add note linking functionality"

# Bug fix
git commit -m "fix: resolve diff position calculation error"

# Documentation
git commit -m "docs: update API schema documentation"

# Refactor
git commit -m "refactor: simplify search service interface"

# Test
git commit -m "test: add integration tests for auth middleware"
```

---

## IDE Configuration

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": true,
    "source.organizeImports.biome": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true
  }
}
```

### VS Code Extensions
Recommended extensions in `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode-remote.remote-containers",
    "redhat.vscode-yaml"
  ]
}
```

### IntelliJ/WebStorm
Configure TypeScript service and enable:
- ESLint integration
- Prettier formatting
- TypeScript error highlighting
- Docker integration

---

## Debugging

### API Debugging
```bash
# Debug mode with inspector
bun --inspect run dev

# Verbose logging
LOG_LEVEL=debug bun run dev

# Profile performance
bun --prof run dev
```

### Database Debugging
```bash
# Connect to database
docker-compose exec database mysql -u memshelf -p memshelf_dev

# View slow queries
docker-compose exec database mysql -u root -p -e "SHOW PROCESSLIST;"

# Database logs
docker-compose logs database
```

### Search Debugging
```bash
# Meilisearch dashboard
open http://localhost:7700

# Search service logs
docker-compose logs search

# Index stats
curl http://localhost:7700/indexes/notes/stats
```

---

## Performance Monitoring

### Development Metrics
```bash
# API response times
bun run dev:metrics

# Memory usage
bun --inspect --inspect-port=9229 run dev

# Database query profiling
LOG_LEVEL=debug bun run dev | grep "query:"
```

### Load Testing
```bash
# Install k6
brew install k6  # macOS
# or
curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz

# Run load tests
k6 run scripts/load-test.js
```

**Load Test Script** (`scripts/load-test.js`):
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

const API_KEY = 'your_dev_api_key_here';
const BASE_URL = 'http://localhost:3000/api/v1';

export default function() {
  let response = http.get(`${BASE_URL}/notes`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port
API_PORT=3001 bun run dev
```

**Database Connection Failed**:
```bash
# Check service status
docker-compose ps

# Restart database
docker-compose restart database

# Check logs
docker-compose logs database
```

**Dependency Issues**:
```bash
# Clear cache and reinstall
rm -rf node_modules .turbo
bun install
```

**TypeScript Errors**:
```bash
# Rebuild declarations
bun run build

# Check for circular dependencies
bun run deps:check
```

### Debug Commands
```bash
# System info
bun --version
docker --version
docker-compose --version

# Service health
curl http://localhost:3000/health
curl http://localhost:7700/health
redis-cli ping

# Logs with timestamps
docker-compose logs --timestamps api
```

---

## Contributing Guidelines

### Pull Request Process
1. **Branch**: Create feature branch from `main`
2. **Develop**: Make changes with tests
3. **Quality**: Run `bun run quality` 
4. **Test**: Ensure all tests pass
5. **Commit**: Use conventional commits
6. **PR**: Create pull request with description
7. **Review**: Address feedback
8. **Merge**: Squash and merge

### Code Standards
- **TypeScript**: Strict mode enabled
- **Testing**: Minimum 80% coverage
- **Documentation**: Update relevant docs
- **Performance**: No significant regressions
- **Security**: Follow security best practices

---

This development setup provides a **complete development environment** with all necessary tools, clear workflows, and comprehensive debugging capabilities for productive Memshelf development.