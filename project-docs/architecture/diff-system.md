# Diff System Specification

## Overview

The Memshelf diff system enables **incremental content updates** instead of full document rewrites. This approach is optimized for AI-driven edits, maintaining edit history, and reducing network overhead while ensuring content consistency.

---

## Core Concepts

### Diff Operations
A diff represents a **single atomic edit** to a note's content, defined by:
- **Position**: Starting character index (0-based)
- **Length**: Number of characters to delete
- **New Text**: Replacement text to insert

### Operation Types
**Insert**: `length = 0, new_text = "inserted content"`
- Adds new content at the specified position
- Original content shifts right

**Delete**: `length > 0, new_text = ""`
- Removes characters from position to position + length
- Content after deletion shifts left  

**Replace**: `length > 0, new_text = "replacement"`
- Deletes characters and inserts new text
- Combines delete and insert in one operation

---

## Diff Data Model

### Database Schema
```sql
diffs (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  length INTEGER NOT NULL CHECK (length >= 0),
  new_text TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP NULL
)
```

### Diff Object Structure
```json
{
  "id": "diff-uuid",
  "note_id": "note-uuid", 
  "position": 45,
  "length": 12,
  "new_text": "updated content",
  "created_at": "2025-09-01T12:00:00Z",
  "applied_at": "2025-09-01T12:00:00Z"
}
```

---

## Diff Application Algorithm

### Single Diff Application
```typescript
function applyDiff(content: string, diff: Diff): string {
  const { position, length, new_text } = diff;
  
  // Validate position boundaries
  if (position < 0 || position > content.length) {
    throw new Error('Invalid diff position');
  }
  
  // Validate length boundaries  
  if (position + length > content.length) {
    throw new Error('Diff length exceeds content bounds');
  }
  
  // Apply the diff
  return content.slice(0, position) + 
         new_text + 
         content.slice(position + length);
}
```

### Multiple Diff Application
When applying multiple diffs, **order matters**. Diffs must be applied in **reverse position order** (highest position first) to maintain consistency:

```typescript
function applyMultipleDiffs(content: string, diffs: Diff[]): string {
  // Sort diffs by position in descending order
  const sortedDiffs = diffs.sort((a, b) => b.position - a.position);
  
  let result = content;
  for (const diff of sortedDiffs) {
    result = applyDiff(result, diff);
  }
  
  return result;
}
```

**Why Reverse Order?**
- Later positions are unaffected by edits at earlier positions
- Avoids position recalculation after each diff
- Ensures deterministic results regardless of diff arrival order

---

## Conflict Detection & Resolution

### Version-Based Conflict Detection
Each note has a `version` field that increments with every change:

```typescript
interface ConflictCheckResult {
  hasConflict: boolean;
  expectedVersion: number;
  actualVersion: number;
}

function checkForConflicts(
  noteId: string, 
  expectedVersion: number
): ConflictCheckResult {
  const currentNote = getCurrentNote(noteId);
  
  return {
    hasConflict: currentNote.version !== expectedVersion,
    expectedVersion,
    actualVersion: currentNote.version
  };
}
```

### Conflict Resolution Strategies
**Last-Writer-Wins (Current Implementation)**:
- Reject diff if version mismatch detected
- Client must fetch latest version and retry
- Simple but requires client-side conflict handling

**Future Enhancement - Auto-Merge**:
- Attempt to apply diff to current content
- Succeed if diff position is still valid
- Fail only if content boundaries violated

---

## Content Snapshotting

### Periodic Snapshots
To avoid applying hundreds of diffs for content retrieval, notes periodically snapshot their full content:

**Snapshot Triggers**:
- Every 50 diffs applied
- After 24 hours since last snapshot
- Before major operations (search indexing)
- Manual snapshot requests

**Snapshot Process**:
```typescript
async function createSnapshot(noteId: string): Promise<void> {
  // Get all unapplied diffs
  const unappliedDiffs = await getUnappliedDiffs(noteId);
  
  // Apply all diffs to current content
  const currentContent = await getCurrentNoteContent(noteId);
  const updatedContent = applyMultipleDiffs(currentContent, unappliedDiffs);
  
  // Update note content and mark diffs as applied
  await transaction(async (tx) => {
    await tx.update(notes)
      .set({ 
        content: updatedContent,
        updated_at: new Date()
      })
      .where({ id: noteId });
      
    await tx.update(diffs)
      .set({ applied_at: new Date() })
      .where({ 
        note_id: noteId,
        applied_at: null
      });
  });
}
```

---

## Performance Optimizations

### Diff Batching
**Batch Multiple Edits**: Group related diffs into single transactions
```typescript
interface DiffBatch {
  noteId: string;
  diffs: Diff[];
  expectedVersion: number;
}

async function applyDiffBatch(batch: DiffBatch): Promise<Note> {
  return await transaction(async (tx) => {
    // Check version conflict
    const note = await tx.findOne(Note, { id: batch.noteId });
    if (note.version !== batch.expectedVersion) {
      throw new ConflictError('Version mismatch');
    }
    
    // Insert all diffs
    await tx.insert(Diff, batch.diffs);
    
    // Update note version
    const newVersion = note.version + batch.diffs.length;
    await tx.update(Note, { id: batch.noteId }, { 
      version: newVersion,
      updated_at: new Date()
    });
    
    return { ...note, version: newVersion };
  });
}
```

### Diff Compaction
**Remove Redundant Diffs**: Periodically compact diff history
- Delete diffs older than snapshot
- Merge consecutive diffs at same position
- Remove diffs that cancel each other out

**Compaction Rules**:
```typescript
// Example: Two consecutive replacements at same position
// Diff 1: position=10, length=5, new_text="hello" 
// Diff 2: position=10, length=5, new_text="world"
// Result: position=10, length=5, new_text="world" (Diff 1 removed)

function compactDiffs(diffs: Diff[]): Diff[] {
  // Sort by position and created_at
  const sorted = diffs.sort((a, b) => 
    a.position - b.position || 
    a.created_at.getTime() - b.created_at.getTime()
  );
  
  const compacted: Diff[] = [];
  
  for (const diff of sorted) {
    const lastDiff = compacted[compacted.length - 1];
    
    // Check if diffs can be merged
    if (lastDiff && canMergeDiffs(lastDiff, diff)) {
      compacted[compacted.length - 1] = mergeDiffs(lastDiff, diff);
    } else {
      compacted.push(diff);
    }
  }
  
  return compacted;
}
```

---

## Edge Cases & Error Handling

### Invalid Diff Scenarios
**Position Out of Bounds**:
```json
{
  "error": "diff_invalid_position",
  "message": "Diff position 150 exceeds content length 100",
  "code": "NOTE_006"
}
```

**Length Exceeds Content**:
```json
{
  "error": "diff_invalid_length", 
  "message": "Diff length 25 at position 90 exceeds content bounds",
  "code": "NOTE_006"
}
```

**Content Size Limits**:
```json
{
  "error": "content_too_large",
  "message": "Applied diff would exceed maximum content size of 1MB", 
  "code": "NOTE_007"
}
```

### Recovery Procedures
**Corrupted Content Recovery**:
1. Identify last known good snapshot
2. Reapply diffs from snapshot timestamp
3. Validate content integrity
4. Create new snapshot if successful

**Diff Inconsistency Detection**:
```typescript
async function validateDiffConsistency(noteId: string): Promise<boolean> {
  const note = await getNote(noteId);
  const allDiffs = await getAllDiffs(noteId);
  
  // Reconstruct content from diffs
  const reconstructed = applyMultipleDiffs('', allDiffs);
  
  // Compare with stored content
  return reconstructed === note.content;
}
```

---

## API Integration

### Diff Application Endpoint
**Request**:
```http
PATCH /api/v1/notes/:id/diff
Content-Type: application/json

{
  "position": 45,
  "length": 12, 
  "new_text": "updated content",
  "version": 3
}
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "id": "note-uuid",
    "title": "Note Title",
    "content": "Updated content with diff applied...",
    "version": 4,
    "diff_applied": {
      "id": "diff-uuid",
      "position": 45,
      "length": 12,
      "new_text": "updated content"
    }
  }
}
```

### Batch Diff Application
**Request**:
```http
PATCH /api/v1/notes/:id/diffs/batch
Content-Type: application/json

{
  "diffs": [
    {
      "position": 45,
      "length": 12,
      "new_text": "updated content"
    },
    {
      "position": 100, 
      "length": 0,
      "new_text": "\n\nNew paragraph"
    }
  ],
  "version": 3
}
```

---

## AI Integration Patterns

### LLM-Friendly Diff Generation
**Structured Prompts** for AI agents:
```
Apply the following edit to the note:
- Position: 45 (after "Meeting summary:")  
- Replace: "initial thoughts" (12 characters)
- With: "updated insights"

Generate diff object:
{
  "position": 45,
  "length": 12, 
  "new_text": "updated insights"
}
```

### Diff Validation for AI Agents
**Pre-application Checks**:
```typescript
function validateAIDiff(content: string, diff: Diff): ValidationResult {
  const validations = [
    validatePosition(content, diff.position),
    validateLength(content, diff.position, diff.length),  
    validateContentSize(content, diff),
    validateCharacterEncoding(diff.new_text)
  ];
  
  return {
    valid: validations.every(v => v.valid),
    errors: validations.filter(v => !v.valid).map(v => v.error)
  };
}
```

---

## Monitoring & Metrics

### Diff System Metrics
- **Diff application rate**: Diffs applied per minute
- **Conflict rate**: Version conflicts per hour  
- **Snapshot frequency**: Snapshots created per day
- **Diff queue size**: Unapplied diffs per note
- **Content reconstruction time**: Time to rebuild content from diffs

### Performance Alerts
- **High conflict rate**: >5% of diff applications failing
- **Large diff queues**: >100 unapplied diffs per note  
- **Slow reconstruction**: >500ms to apply diff batch
- **Content corruption**: Validation failures detected

---

This diff system provides **efficient incremental updates** while maintaining **data consistency** and **performance** at scale, making it ideal for AI-driven content editing workflows.