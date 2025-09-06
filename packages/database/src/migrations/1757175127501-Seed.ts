import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Seed1757175127501 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert Users
        await queryRunner.query(`
            INSERT INTO users (id, name, api_key, created_at, updated_at) VALUES
            ('00000000-0000-4000-8000-000000000001', 'Admin User', 'dev_admin_key_0123456789abcdef0123456789abcdef01234567', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000002', 'John Developer', 'dev_john_key_fedcba9876543210fedcba9876543210fedcba98', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000003', 'Jane Designer', 'dev_jane_key_abcdef0123456789abcdef0123456789abcdef01', NOW(), NOW())
        `);

        // Insert Workspaces
        await queryRunner.query(`
            INSERT INTO workspaces (id, name, description, created_at, updated_at) VALUES
            ('00000000-0000-4000-8000-000000000011', 'Default Workspace', 'Default workspace for development and testing', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000012', 'Personal Notes', 'Personal knowledge management workspace', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000013', 'Project Alpha', 'Collaborative workspace for Project Alpha development', NOW(), NOW())
        `);

        // Insert User Permissions
        await queryRunner.query(`
            INSERT INTO user_permissions (user_id, workspace_id, can_write, created_at) VALUES
            ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', true, NOW()),
            ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', true, NOW()),
            ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', true, NOW()),
            ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', true, NOW()),
            ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013', true, NOW()),
            ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000012', false, NOW()),
            ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', false, NOW())
        `);

        // Insert Tags
        await queryRunner.query(`
            INSERT INTO tags (id, name, display_name, created_at, updated_at) VALUES
            ('00000000-0000-4000-8000-000000000021', 'work', 'Work', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000022', 'personal', 'Personal', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000023', 'project', 'Project', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000024', 'idea', 'Idea', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000025', 'research', 'Research', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000026', 'meeting', 'Meeting', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000027', 'documentation', 'Documentation', NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000028', 'urgent', 'Urgent', NOW(), NOW())
        `);

        // Insert Notes
        await queryRunner.query(
            `
            INSERT INTO notes (id, workspace_id, title, content, version, created_at, updated_at) VALUES
            (?, ?, ?, ?, ?, NOW(), NOW()),
            (?, ?, ?, ?, ?, NOW(), NOW()),
            (?, ?, ?, ?, ?, NOW(), NOW()),
            (?, ?, ?, ?, ?, NOW(), NOW()),
            (?, ?, ?, ?, ?, NOW(), NOW()),
            (?, ?, ?, ?, ?, NOW(), NOW())
        `,
            [
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000011',
                'Welcome to Memshelf',
                `Welcome to your Memshelf knowledge management system!

This is your first note. You can:
- Create and organize notes
- Add tags for better organization
- Link notes together
- Track changes with version history
- Collaborate with team members

Get started by creating your own notes and organizing your knowledge!`,
                1,

                '00000000-0000-4000-8000-000000000032',
                '00000000-0000-4000-8000-000000000011',
                'API Documentation',
                `# Memshelf API

## Authentication
All API requests require an API key in the Authorization header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Notes
- GET /api/notes - List notes
- POST /api/notes - Create note  
- GET /api/notes/:id - Get note
- PUT /api/notes/:id - Update note
- DELETE /api/notes/:id - Delete note

### Workspaces
- GET /api/workspaces - List workspaces
- POST /api/workspaces - Create workspace

## Response Format
\`\`\`json
{
  "success": true,
  "data": {...}
}
\`\`\``,
                1,

                '00000000-0000-4000-8000-000000000033',
                '00000000-0000-4000-8000-000000000012',
                'Personal Goals 2024',
                `# Personal Goals for 2024

## Learning Goals
- [ ] Master TypeScript advanced patterns
- [ ] Learn system design principles
- [ ] Improve technical writing skills

## Health Goals  
- [ ] Exercise 3x per week
- [ ] Read 12 books this year
- [ ] Maintain work-life balance

## Career Goals
- [ ] Lead a major project
- [ ] Mentor junior developers
- [ ] Speak at a conference

## Progress Tracking
Updated monthly to track progress and adjust goals as needed.`,
                1,

                '00000000-0000-4000-8000-000000000034',
                '00000000-0000-4000-8000-000000000013',
                'Project Alpha Requirements',
                `# Project Alpha - Requirements Document

## Overview
Project Alpha aims to create a modern, scalable web application for knowledge management.

## Functional Requirements
1. User authentication and authorization
2. Note creation and editing with markdown support
3. Real-time collaboration
4. Search functionality with filters
5. Tag-based organization
6. Version history tracking

## Technical Requirements
- TypeScript for type safety
- Modern web framework (React/Vue/Svelte)
- RESTful API design
- Database with proper indexing
- Real-time updates via WebSockets
- Mobile-responsive design

## Success Criteria
- Support 1000+ concurrent users
- < 200ms API response times
- 99.9% uptime
- Intuitive user experience`,
                1,

                '00000000-0000-4000-8000-000000000035',
                '00000000-0000-4000-8000-000000000013',
                'Team Meeting Notes - Jan 15',
                `# Team Meeting - January 15, 2024

## Attendees
- John Developer
- Jane Designer
- Admin User

## Agenda
1. Project Alpha progress review
2. Technical architecture decisions
3. Timeline and milestones
4. Resource allocation

## Key Decisions
- Adopt TypeScript for all new development
- Use Memshelf as our primary knowledge base
- Weekly sprint planning meetings

## Action Items
- [ ] John: Set up CI/CD pipeline by Jan 20
- [ ] Jane: Complete user interface mockups by Jan 18  
- [ ] Admin: Review and approve technical specifications

## Next Meeting
January 22, 2024 at 2:00 PM`,
                1,

                '00000000-0000-4000-8000-000000000036',
                '00000000-0000-4000-8000-000000000011',
                'Database Schema Design',
                `# Database Schema Overview

## Core Entities

### Users
- Unique API keys for authentication
- Name and basic profile information

### Workspaces  
- Organizational containers for notes
- Support collaboration with permissions

### Notes
- Markdown content with version tracking
- Belong to workspaces
- Can be tagged and linked

### Tags
- Flexible categorization system
- Both machine-readable names and display names

## Relationships
- Users have permissions on workspaces
- Notes belong to workspaces
- Notes can have multiple tags via junction table
- Notes can link to other notes

## Indexing Strategy
- UUID primary keys for all entities
- Indexes on foreign keys and commonly queried fields
- Full-text search support for note content`,
                1,
            ]
        );

        // Insert Workspace Tags (which tags are available in which workspaces)
        await queryRunner.query(`
            INSERT INTO workspace_tags (workspace_id, tag_id, created_at) VALUES
            ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', NOW()),
            ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000023', NOW()),
            ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000027', NOW()),
            ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000022', NOW()),
            ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000024', NOW()),
            ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000021', NOW()),
            ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000023', NOW()),
            ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000026', NOW()),
            ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000028', NOW())
        `);

        // Insert Note Tags (which tags are applied to which notes)
        await queryRunner.query(`
            INSERT INTO note_tags (note_id, tag_id, created_at) VALUES
            ('00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000027', NOW()),
            ('00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000021', NOW()),
            ('00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000027', NOW()),
            ('00000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000022', NOW()),
            ('00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000021', NOW()),
            ('00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000023', NOW()),
            ('00000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000021', NOW()),
            ('00000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000026', NOW()),
            ('00000000-0000-4000-8000-000000000036', '00000000-0000-4000-8000-000000000027', NOW())
        `);

        // Insert Links between notes
        await queryRunner.query(`
            INSERT INTO links (id, source_note_id, target_note_id, link_text, position, created_at, updated_at) VALUES
            ('00000000-0000-4000-8000-000000000061', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000032', 'API Documentation', 1, NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000062', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000036', 'Database Schema Design', 1, NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000063', '00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000035', 'Team Meeting Notes', 1, NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000064', '00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000036', 'Database Schema', 2, NOW(), NOW())
        `);

        // Insert Diffs (version history for notes)
        await queryRunner.query(`
            INSERT INTO diffs (id, note_id, position, length, new_text, applied_at, created_at, updated_at) VALUES
            ('00000000-0000-4000-8000-000000000071', '00000000-0000-4000-8000-000000000034', 0, 0, 'Initial project requirements document with basic structure and goals.', NOW(), NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000072', '00000000-0000-4000-8000-000000000035', 0, 0, 'Meeting notes from January 15 team meeting with decisions and action items.', NOW(), NOW(), NOW()),
            ('00000000-0000-4000-8000-000000000073', '00000000-0000-4000-8000-000000000032', 0, 0, 'Initial API documentation with authentication and basic endpoints.', NOW(), NOW(), NOW())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete in reverse order to respect foreign key constraints
        await queryRunner.query(`DELETE FROM diffs WHERE id LIKE '00000000-0000-4000-8000-0000000000%'`);
        await queryRunner.query(`DELETE FROM links WHERE id LIKE '00000000-0000-4000-8000-0000000000%'`);
        await queryRunner.query(`DELETE FROM note_tags WHERE note_id LIKE '00000000-0000-4000-8000-0000000000%'`);
        await queryRunner.query(
            `DELETE FROM workspace_tags WHERE workspace_id LIKE '00000000-0000-4000-8000-0000000000%'`
        );
        await queryRunner.query(`DELETE FROM notes WHERE id LIKE '00000000-0000-4000-8000-0000000000%'`);
        await queryRunner.query(`DELETE FROM tags WHERE id LIKE '00000000-0000-4000-8000-0000000000%'`);
        await queryRunner.query(
            `DELETE FROM user_permissions WHERE user_id LIKE '00000000-0000-4000-8000-0000000000%'`
        );
        await queryRunner.query(`DELETE FROM workspaces WHERE id LIKE '00000000-0000-4000-8000-0000000000%'`);
        await queryRunner.query(`DELETE FROM users WHERE id LIKE '00000000-0000-4000-8000-0000000000%'`);
    }
}
