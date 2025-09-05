# Memshelf Database Schema

## Overview

The Memshelf database schema is designed for **flexibility**, **performance**, and **data integrity**. Built for MariaDB
with TypeORM, it supports complex knowledge relationships while maintaining query efficiency.

### Soft Delete Pattern

The database implements **soft delete** functionality through the `AppEntity` base class:

* All entities extending `AppEntity` inherit a `deleted_at` TIMESTAMP column
* Records are marked as deleted by setting `deleted_at` instead of being physically removed
* Queries automatically filter out soft-deleted records unless explicitly included
* Allows for data recovery and audit trails while maintaining referential integrity

---

## Core Tables

### users

Represents system users (primarily AI agents and service accounts).

**Columns:**

* `id` - UUID, Primary Key
* `name` - VARCHAR(255), NOT NULL - Display name for the user
* `api_key` - VARCHAR(255), UNIQUE, NOT NULL - Authentication token
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP
* `updated_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP
* `deleted_at` - TIMESTAMP, NULLABLE - Soft delete timestamp

**Indexes:**

* PRIMARY KEY (`id`)
* UNIQUE INDEX `idx_users_api_key` (`api_key`)
* INDEX `idx_users_created_at` (`created_at`)

**Constraints:**

* `api_key` must be unique across all users
* `name` cannot be empty string

---

### workspaces

Logical groupings of related notes with shared permissions.

**Columns:**

* `id` - UUID, Primary Key
* `name` - VARCHAR(255), NOT NULL - Workspace display name
* `description` - TEXT, NULLABLE - Optional workspace description
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP
* `updated_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP
* `deleted_at` - TIMESTAMP, NULLABLE - Soft delete timestamp

**Indexes:**

* PRIMARY KEY (`id`)
* INDEX `idx_workspaces_name` (`name`)
* INDEX `idx_workspaces_created_at` (`created_at`)

**Constraints:**

* `name` must be unique per workspace
* `name` cannot be empty string

---

### user\_permissions

Junction table managing user access to workspaces.

**Columns:**

* `user_id` - UUID, Foreign Key → users.id
* `workspace_id` - UUID, Foreign Key → workspaces.id
* `can_write` - BOOLEAN, NOT NULL, DEFAULT FALSE - Write permission flag
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP

**Indexes:**

* PRIMARY KEY (`user_id`, `workspace_id`) - Composite primary key
* INDEX `idx_user_permissions_user_id` (`user_id`)
* INDEX `idx_user_permissions_workspace_id` (`workspace_id`)
* INDEX `idx_user_permissions_can_write` (`can_write`)

**Constraints:**

* FOREIGN KEY `fk_user_permissions_user` (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
* FOREIGN KEY `fk_user_permissions_workspace` (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE

---

### notes

Core content storage with full Markdown support.

**Columns:**

* `id` - UUID, Primary Key
* `workspace_id` - UUID, Foreign Key → workspaces.id, NOT NULL
* `title` - VARCHAR(500), NOT NULL - Note title/headline
* `content` - LONGTEXT, DEFAULT '' - Current Markdown content snapshot
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP
* `updated_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP
* `deleted_at` - TIMESTAMP, NULLABLE - Soft delete timestamp
* `version` - INT, DEFAULT 1 - TypeORM optimistic locking for conflict detection

**Indexes:**

* PRIMARY KEY (`id`)
* INDEX `idx_notes_workspace_id` (`workspace_id`)
* INDEX `idx_notes_title` (`title`)
* INDEX `idx_notes_updated_at` (`updated_at`)
* INDEX `idx_notes_created_at` (`created_at`)
* FULLTEXT INDEX `idx_notes_content_fulltext` (`content`)

**Constraints:**

* FOREIGN KEY `fk_notes_workspace` (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
* `title` cannot be empty string
* `content` can be empty but not NULL

---

### diffs

Incremental edit operations for efficient content updates.

**Columns:**

* `id` - UUID, Primary Key
* `note_id` - UUID, Foreign Key → notes.id, NOT NULL
* `position` - INT, NOT NULL - Starting character index for the edit
* `length` - INT, NOT NULL, DEFAULT 0 - Characters to delete (0 for pure insert)
* `new_text` - TEXT, DEFAULT '' - Replacement text (empty for pure delete)
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP
* `updated_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP
* `deleted_at` - TIMESTAMP, NULLABLE - Soft delete timestamp
* `applied_at` - TIMESTAMP, NULLABLE - When diff was applied to note content

**Indexes:**

* PRIMARY KEY (`id`)
* INDEX `idx_diffs_note_id` (`note_id`)
* INDEX `idx_diffs_created_at` (`created_at`)
* INDEX `idx_diffs_note_position` (`note_id`, `position`) - For ordered diff application
* INDEX `idx_diffs_applied_at` (`applied_at`)

**Constraints:**

* FOREIGN KEY `fk_diffs_note` (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
* `position` must be >= 0
* `length` must be >= 0
* CHECK constraint: `position + length <= MAX_CONTENT_LENGTH`

---

### tags

Reusable labels for categorizing content.

**Columns:**

* `id` - UUID, Primary Key
* `name` - VARCHAR(100), UNIQUE, NOT NULL - Tag label (lowercase, hyphen-separated)
* `display_name` - VARCHAR(100), NOT NULL - Human-readable tag name
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP
* `updated_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP
* `deleted_at` - TIMESTAMP, NULLABLE - Soft delete timestamp

**Indexes:**

* PRIMARY KEY (`id`)
* UNIQUE INDEX `idx_tags_name` (`name`)
* INDEX `idx_tags_display_name` (`display_name`)

**Constraints:**

* `name` must match pattern: `^[a-z0-9-]+$` (lowercase, numbers, hyphens only)
* `display_name` cannot be empty string
* `name` must be unique across all tags

---

### note\_tags

Many-to-many relationship between notes and tags.

**Columns:**

* `note_id` - UUID, Foreign Key → notes.id
* `tag_id` - UUID, Foreign Key → tags.id
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP

**Indexes:**

* PRIMARY KEY (`note_id`, `tag_id`) - Composite primary key
* INDEX `idx_note_tags_note_id` (`note_id`)
* INDEX `idx_note_tags_tag_id` (`tag_id`)

**Constraints:**

* FOREIGN KEY `fk_note_tags_note` (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
* FOREIGN KEY `fk_note_tags_tag` (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE

---

### workspace\_tags

Many-to-many relationship between workspaces and tags.

**Columns:**

* `workspace_id` - UUID, Foreign Key → workspaces.id
* `tag_id` - UUID, Foreign Key → tags.id
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP

**Indexes:**

* PRIMARY KEY (`workspace_id`, `tag_id`) - Composite primary key
* INDEX `idx_workspace_tags_workspace_id` (`workspace_id`)
* INDEX `idx_workspace_tags_tag_id` (`tag_id`)

**Constraints:**

* FOREIGN KEY `fk_workspace_tags_workspace` (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
* FOREIGN KEY `fk_workspace_tags_tag` (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE

---

### links

UUID-based links between notes for knowledge graph functionality.

**Columns:**

* `id` - UUID, Primary Key
* `source_note_id` - UUID, Foreign Key → notes.id, NOT NULL
* `target_note_id` - UUID, Foreign Key → notes.id, NOT NULL
* `link_text` - VARCHAR(500), NOT NULL - The display text used for the link
* `position` - INT, NOT NULL - Character position in source note content
* `created_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP
* `updated_at` - TIMESTAMP, DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP
* `deleted_at` - TIMESTAMP, NULLABLE - Soft delete timestamp

**Indexes:**

* PRIMARY KEY (`id`)
* INDEX `idx_links_source_note_id` (`source_note_id`)
* INDEX `idx_links_target_note_id` (`target_note_id`)
* INDEX `idx_links_source_position` (`source_note_id`, `position`)
* UNIQUE INDEX `idx_links_source_target` (`source_note_id`, `target_note_id`, `position`)

**Constraints:**

* FOREIGN KEY `fk_links_source` (`source_note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
* FOREIGN KEY `fk_links_target` (`target_note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE
* `position` must be >= 0
* `link_text` cannot be empty string
* `source_note_id` cannot equal `target_note_id` (no self-links)

---

## Data Relationships

### User → Workspace Access

* Users access workspaces through `user_permissions`
* Read access: `can_write = FALSE`
* Write access: `can_write = TRUE`
* Cascade delete: removing user removes all their permissions

### Workspace → Notes Hierarchy

* Each note belongs to exactly one workspace
* Workspace deletion cascades to all contained notes
* Notes inherit workspace permissions for access control

### Note → Content Evolution

* Current content stored in `notes.content` for fast retrieval
* Edit history preserved in `diffs` table
* Diffs applied in reverse position order for consistency

### Tagging System

* **Direct tags**: `note_tags` for note-specific categorization
* **Inherited tags**: `workspace_tags` automatically apply to all workspace notes
* **Tag normalization**: `name` field enforces consistent tag format

### Link Graph

* **Bidirectional discovery**: Links table enables both forward and backward traversal
* **Position tracking**: Links maintain their location within source content
* **Broken link detection**: Foreign key constraints prevent dangling references

---

## Performance Considerations

### Query Optimization

* **Composite indexes** on frequently joined columns
* **Covering indexes** for common query patterns
* **Partial indexes** for boolean flags and status columns

### Scaling Strategies

* **Read replicas** for search-heavy workloads
* **Partitioning** on `created_at` for time-based queries
* **Archive strategy** for old diffs after content snapshots

### Cache Integration

* **Valkey caching** for frequently accessed notes and workspace permissions
* **Meilisearch indexing** for full-text search offloading
* **Application-level caching** for user sessions and API key validation

---

## Migration Strategy

All schema changes managed through **TypeORM migrations** with:

* **Versioned migrations** for reproducible deployments
* **Rollback procedures** for safe schema changes
* **Data migration scripts** for complex transformations
* **Index creation** with online DDL for zero-downtime updates
