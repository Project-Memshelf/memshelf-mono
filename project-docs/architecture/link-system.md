# Link System Specification

## Overview

The Memshelf link system creates **bidirectional connections** between notes using UUID-based references. This enables building knowledge graphs, automatic backlink discovery, and robust link management that survives note title changes.

---

## Core Concepts

### UUID-Based Linking
Links use **note UUIDs** instead of titles to ensure:
- **Stability**: Links survive title changes
- **Uniqueness**: No ambiguity with duplicate titles
- **Validation**: Foreign key constraints prevent broken links
- **Performance**: Direct UUID lookups are faster than title searches

### Link Components
- **Source Note**: The note containing the link
- **Target Note**: The note being linked to
- **Link Text**: Human-readable text displayed for the link
- **Position**: Character position within source content
- **Context**: Surrounding text for link previews

---

## Data Model

### Database Schema
```sql
links (
  id UUID PRIMARY KEY,
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  link_text VARCHAR(500) NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_self_links CHECK (source_note_id != target_note_id),
  UNIQUE (source_note_id, target_note_id, position)
)
```

### Link Object Structure
```json
{
  "id": "link-uuid",
  "source_note_id": "source-note-uuid",
  "target_note_id": "target-note-uuid", 
  "link_text": "see related discussion",
  "position": 145,
  "created_at": "2025-09-01T12:00:00Z"
}
```

---

## Link Syntax & Formats

### Markdown Link Format
**Standard Markdown with UUID**:
```markdown
[link text](memshelf://550e8400-e29b-41d4-a716-446655440000)
```

**Components**:
- `[link text]`: Human-readable display text
- `memshelf://`: Custom protocol identifier
- `uuid`: Target note UUID

### Alternative Syntax (Future)
**Short UUID Format**:
```markdown
[link text](ms://550e8400)
```
Using first 8 characters when unique within workspace.

**Wiki-style with Resolution**:
```markdown
[[Note Title]]
```
Auto-resolved to UUID during processing (requires title lookup).

---

## Link Processing

### Link Detection in Content
```typescript
interface DetectedLink {
  match: string;
  linkText: string;
  targetUuid: string;
  position: number;
}

function detectLinks(content: string): DetectedLink[] {
  const linkPattern = /\[([^\]]+)\]\(memshelf:\/\/([0-9a-f-]{36})\)/gi;
  const links: DetectedLink[] = [];
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    links.push({
      match: match[0],
      linkText: match[1],
      targetUuid: match[2],
      position: match.index
    });
  }
  
  return links;
}
```

### Link Validation
```typescript
async function validateLink(
  sourceNoteId: string, 
  targetNoteId: string,
  userId: string
): Promise<ValidationResult> {
  // Check if source note exists and user has access
  const sourceNote = await getAccessibleNote(sourceNoteId, userId);
  if (!sourceNote) {
    return { valid: false, error: 'Source note not accessible' };
  }
  
  // Check if target note exists and user has access  
  const targetNote = await getAccessibleNote(targetNoteId, userId);
  if (!targetNote) {
    return { valid: false, error: 'Target note not accessible' };
  }
  
  // Prevent self-links
  if (sourceNoteId === targetNoteId) {
    return { valid: false, error: 'Cannot link note to itself' };
  }
  
  return { valid: true };
}
```

---

## Link Operations

### Creating Links
**Manual Link Creation**:
```http
POST /api/v1/links
{
  "source_note_id": "source-uuid",
  "target_note_id": "target-uuid", 
  "link_text": "see related notes",
  "position": 145
}
```

**Automatic Link Extraction**:
```typescript
async function extractAndCreateLinks(
  noteId: string, 
  content: string
): Promise<Link[]> {
  const detectedLinks = detectLinks(content);
  const createdLinks: Link[] = [];
  
  for (const detected of detectedLinks) {
    // Validate link
    const validation = await validateLink(noteId, detected.targetUuid, userId);
    if (!validation.valid) continue;
    
    // Create link record
    const link = await createLink({
      source_note_id: noteId,
      target_note_id: detected.targetUuid,
      link_text: detected.linkText,
      position: detected.position
    });
    
    createdLinks.push(link);
  }
  
  return createdLinks;
}
```

### Link Updates During Content Changes
**Position Adjustment After Diffs**:
```typescript
function adjustLinkPositions(
  links: Link[], 
  diff: Diff
): Link[] {
  return links.map(link => {
    // If diff is before link position, adjust position
    if (diff.position < link.position) {
      const positionDelta = diff.new_text.length - diff.length;
      return {
        ...link,
        position: Math.max(0, link.position + positionDelta)
      };
    }
    
    // If diff overlaps with link, mark for review
    if (diff.position <= link.position && 
        diff.position + diff.length > link.position) {
      return {
        ...link,
        needs_review: true
      };
    }
    
    return link;
  });
}
```

---

## Bidirectional Link Queries

### Outgoing Links (From Note)
```sql
SELECT 
  l.id,
  l.target_note_id,
  l.link_text,
  l.position,
  n.title as target_title,
  l.created_at
FROM links l
JOIN notes n ON l.target_note_id = n.id  
WHERE l.source_note_id = ?
ORDER BY l.position ASC
```

### Incoming Links (To Note)
```sql
SELECT 
  l.id,
  l.source_note_id,
  l.link_text,
  l.position,
  n.title as source_title,
  l.created_at
FROM links l
JOIN notes n ON l.source_note_id = n.id
WHERE l.target_note_id = ?
ORDER BY l.created_at DESC
```

### Bidirectional Link API Response
```json
{
  "success": true,
  "data": {
    "outgoing": [
      {
        "id": "link-uuid-1",
        "target_note_id": "target-uuid",
        "target_note_title": "Related Discussion",
        "link_text": "see related discussion",
        "position": 145,
        "created_at": "2025-09-01T10:00:00Z"
      }
    ],
    "incoming": [
      {
        "id": "link-uuid-2", 
        "source_note_id": "source-uuid",
        "source_note_title": "Main Article",
        "link_text": "detailed analysis",
        "position": 78,
        "created_at": "2025-09-01T09:00:00Z"
      }
    ]
  }
}
```

---

## Link Context & Previews

### Context Extraction
```typescript
interface LinkContext {
  before: string;
  linkText: string;
  after: string;
  fullSentence?: string;
}

function extractLinkContext(
  content: string, 
  position: number, 
  linkText: string,
  contextLength: number = 100
): LinkContext {
  const beforeStart = Math.max(0, position - contextLength);
  const afterEnd = Math.min(
    content.length, 
    position + linkText.length + contextLength
  );
  
  const before = content.slice(beforeStart, position);
  const after = content.slice(position + linkText.length, afterEnd);
  
  // Extract full sentence if possible
  const sentencePattern = /[.!?]\s*$/;
  const fullSentence = extractFullSentence(content, position);
  
  return {
    before: before.trim(),
    linkText,
    after: after.trim(),
    fullSentence
  };
}
```

### Link Previews
```json
{
  "link": {
    "id": "link-uuid",
    "target_note_id": "target-uuid",
    "link_text": "related discussion"
  },
  "context": {
    "before": "As mentioned in the previous section,",
    "linkText": "related discussion", 
    "after": "provides additional insights into this topic.",
    "fullSentence": "As mentioned in the previous section, related discussion provides additional insights into this topic."
  },
  "target_preview": {
    "title": "Related Discussion",
    "preview": "This note explores the connection between...",
    "tags": ["research", "analysis"]
  }
}
```

---

## Broken Link Management

### Broken Link Detection
Links become broken when:
- Target note is deleted
- User loses access to target workspace
- Target note is moved to inaccessible workspace

### Broken Link Handling
```typescript
async function detectBrokenLinks(userId: string): Promise<BrokenLink[]> {
  const query = `
    SELECT l.*, n.title as source_title
    FROM links l
    JOIN notes source ON l.source_note_id = source.id
    LEFT JOIN notes target ON l.target_note_id = target.id
    JOIN user_permissions up ON source.workspace_id = up.workspace_id
    WHERE up.user_id = ? 
    AND (
      target.id IS NULL OR 
      NOT EXISTS (
        SELECT 1 FROM user_permissions up2 
        WHERE up2.user_id = ? 
        AND up2.workspace_id = target.workspace_id
      )
    )
  `;
  
  return await db.query(query, [userId, userId]);
}
```

### Broken Link Resolution
**Options for handling broken links**:
1. **Mark as Broken**: Add `broken: true` flag, display with warning
2. **Remove Link**: Delete link record and update content
3. **Convert to Text**: Replace link with plain text
4. **Archive**: Move to broken_links table for recovery

---

## Knowledge Graph Features

### Graph Traversal
```typescript
interface GraphNode {
  noteId: string;
  title: string;
  connections: number;
  tags: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  linkText: string;
  weight: number;
}

async function buildKnowledgeGraph(
  workspaceId: string,
  maxDepth: number = 3
): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
  // Get all notes in workspace
  const notes = await getWorkspaceNotes(workspaceId);
  
  // Get all links between these notes
  const links = await getWorkspaceLinks(workspaceId);
  
  // Build graph structure
  const nodes = notes.map(note => ({
    noteId: note.id,
    title: note.title,
    connections: links.filter(l => 
      l.source_note_id === note.id || l.target_note_id === note.id
    ).length,
    tags: note.tags
  }));
  
  const edges = links.map(link => ({
    source: link.source_note_id,
    target: link.target_note_id,
    linkText: link.link_text,
    weight: 1 // Could be calculated based on link frequency
  }));
  
  return { nodes, edges };
}
```

### Link Analytics
```typescript
interface LinkAnalytics {
  totalLinks: number;
  averageLinksPerNote: number;
  mostLinkedNotes: Array<{
    noteId: string;
    title: string; 
    incomingLinks: number;
    outgoingLinks: number;
  }>;
  orphanedNotes: string[]; // Notes with no links
  linkClusters: Array<{
    notes: string[];
    interconnections: number;
  }>;
}
```

---

## Performance Optimizations

### Link Indexing Strategy
**Database Indexes**:
```sql
-- Fast lookups for outgoing links
CREATE INDEX idx_links_source_note_id ON links(source_note_id);

-- Fast lookups for incoming links  
CREATE INDEX idx_links_target_note_id ON links(target_note_id);

-- Prevent duplicate links at same position
CREATE UNIQUE INDEX idx_links_source_target_position 
ON links(source_note_id, target_note_id, position);

-- Fast position-based queries
CREATE INDEX idx_links_source_position 
ON links(source_note_id, position);
```

### Caching Strategy
**Link Cache (Valkey/Redis)**:
```typescript
// Cache outgoing links
const cacheKey = `links:outgoing:${noteId}`;
await redis.setex(cacheKey, 300, JSON.stringify(outgoingLinks));

// Cache incoming links
const cacheKey = `links:incoming:${noteId}`;
await redis.setex(cacheKey, 300, JSON.stringify(incomingLinks));

// Invalidate cache on link changes
await redis.del(`links:outgoing:${sourceNoteId}`);
await redis.del(`links:incoming:${targetNoteId}`);
```

---

## AI Integration

### AI-Assisted Link Discovery
```typescript
interface LinkSuggestion {
  targetNoteId: string;
  targetTitle: string;
  relevanceScore: number;
  suggestedLinkText: string;
  position: number;
  context: string;
}

async function suggestLinks(
  noteContent: string,
  workspaceId: string
): Promise<LinkSuggestion[]> {
  // Use vector similarity or keyword matching
  // to find related notes in workspace
  const candidates = await findRelatedNotes(noteContent, workspaceId);
  
  return candidates.map(candidate => ({
    targetNoteId: candidate.id,
    targetTitle: candidate.title,
    relevanceScore: candidate.similarity,
    suggestedLinkText: generateLinkText(candidate.title),
    position: findBestInsertionPoint(noteContent, candidate),
    context: extractRelevantContext(noteContent, candidate)
  }));
}
```

---

This link system provides **robust knowledge connections** while maintaining **performance** and **data integrity**, enabling rich knowledge graph functionality for AI-driven knowledge management.