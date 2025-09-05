# Memshelf Overview

## What is Memshelf?

Memshelf is a **shared knowledge backend** that unifies your fragmented thoughts, notes, and ideas into a single, searchable, and collaborative knowledge base. Designed for the modern workflow where AI agents, humans, and various tools need seamless access to shared knowledge.

## The Problem We Solve

### Knowledge Fragmentation
- Notes scattered across multiple apps (Obsidian, Notion, Apple Notes, etc.)
- Ideas lost in chat conversations (Slack, Discord, WhatsApp)
- Research buried in different tools and platforms
- No unified way for AI agents to access and contribute to your knowledge

### Collaboration Friction
- Difficult to share knowledge across teams and tools
- No single source of truth for evolving ideas
- Manual synchronization between different knowledge systems
- Limited AI integration with existing note-taking workflows

### Search and Discovery Issues
- Knowledge exists but is impossible to find
- No cross-platform search capabilities
- Ideas remain isolated without connections
- Context is lost when switching between tools

## Core Features

### 🔗 Universal Knowledge Backend
- **API-first design** that integrates with any tool or application
- **Cross-platform compatibility** - works with CLI tools, web apps, mobile apps, and AI agents
- **Unified storage** for all your notes and ideas, regardless of source

### ✏️ Intelligent Editing System
- **Diff-based editing** for efficient, incremental updates (like Git for prose)
- **Conflict detection** prevents data loss from concurrent edits
- **Version tracking** maintains edit history automatically
- **AI-friendly** editing that works seamlessly with LLM-generated content

### 🏷️ Flexible Organization
- **Workspaces** for grouping related notes and projects
- **Tag system** with inheritance for powerful categorization
- **Smart linking** between notes using UUID-based references
- **Permission management** for collaborative workspaces

### 🔍 Powerful Search
- **Full-text search** across all content using Meilisearch
- **Tag-based filtering** for precise content discovery
- **Cross-workspace search** when permissions allow
- **Real-time search** with instant results

### 🤖 AI-Native Design
- **API key authentication** designed for AI agents and automated tools
- **Structured data format** that AI systems can easily understand and manipulate
- **Incremental editing** perfect for LLM-driven content updates
- **Metadata-rich** responses provide context for intelligent processing

## Who Is This For?

### Knowledge Workers
- Researchers who need to connect ideas across multiple sources
- Writers building interconnected knowledge bases
- Teams collaborating on complex projects
- Anyone frustrated with knowledge silos

### Developers and AI Enthusiasts
- Building AI agents that need persistent memory
- Creating tools that require shared knowledge access
- Developing note-taking applications without backend complexity
- Integrating knowledge management into existing workflows

### Organizations
- Teams needing centralized, searchable knowledge
- Companies building internal knowledge management solutions
- Open-source projects requiring collaborative documentation
- Educational institutions managing research and learning materials

## Why Memshelf?

### Open Source with Hosted Options
- **AGPL v3 licensed** - completely open and transparent
- **Self-hostable** for complete control and privacy
- **Hosted solutions available** for convenience and support
- **Community-driven development** with contributor-friendly codebase

### Modern Architecture
- Built with modern tools: Bun, TypeScript, Hono, MariaDB
- **Docker-ready** for easy deployment anywhere
- **High-performance** search and retrieval
- **Scalable design** that grows with your knowledge base

### Developer-Friendly
- **Comprehensive API** with OpenAPI documentation
- **Type-safe** throughout with TypeScript and Zod validation
- **Well-documented** with clear examples and guides
- **Extensible** architecture for custom integrations

## Getting Started

1. **Self-Host**: Deploy using Docker Compose for full control
2. **Use Hosted Version**: Quick start with our managed service
3. **Integrate**: Connect your existing tools via our REST API
4. **Expand**: Build custom integrations and AI workflows

---

**Ready to unify your knowledge?** Check out our [Quick Start Guide](./development/setup.md) or explore the [API documentation](./api/api-schema.md).