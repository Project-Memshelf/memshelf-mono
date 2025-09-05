# Search Overview

## Overview

Memshelf's search system is powered by **Meilisearch**, providing fast, typo-tolerant, and faceted search across all notes with real-time indexing and advanced filtering capabilities.

---

## Meilisearch Configuration

### Core Settings
```json
{
  "displayedAttributes": [
    "id",
    "title", 
    "content",
    "workspace_id",
    "workspace_name",
    "tags",
    "workspace_tags",
    "created_at",
    "updated_at"
  ],
  "searchableAttributes": [
    "title",
    "content",
    "tags",
    "workspace_tags",
    "workspace_name"
  ],
  "filterableAttributes": [
    "workspace_id",
    "tags",
    "workspace_tags", 
    "created_at",
    "updated_at"
  ],
  "sortableAttributes": [
    "created_at",
    "updated_at",
    "title"
  ],
  "rankingRules": [
    "words",
    "typo", 
    "proximity",
    "attribute",
    "sort",
    "exactness"
  ],
  "stopWords": ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"],
  "synonyms": {},
  "distinctAttribute": "id"
}
```

### Index Structure
**Primary Index**: `notes`
- Contains all searchable note content
- Updated in real-time on content changes
- Filtered by user workspace permissions

---

## Document Schema

### Meilisearch Document Format
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Meeting Notes - Project Alpha",
  "content": "# Meeting Summary\n\nDiscussed roadmap for Q4...",
  "content_preview": "Meeting Summary - Discussed roadmap for Q4 featuring new integrations and performance improvements...",
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "workspace_name": "Project Alpha",
  "tags": ["meeting", "project-alpha", "roadmap"],
  "workspace_tags": ["work", "2025"],
  "all_tags": ["meeting", "project-alpha", "roadmap", "work", "2025"],
  "created_at": 1693574400,
  "updated_at": 1693578000,
  "character_count": 1250,
  "word_count": 180
}
```

### Field Descriptions
- **id**: Note UUID (primary key)
- **title**: Note title for headline matching
- **content**: Full Markdown content for text search
- **content_preview**: First 300 characters for result previews
- **workspace_id**: For permission filtering
- **workspace_name**: Searchable workspace identifier
- **tags**: Direct note tags array
- **workspace_tags**: Inherited workspace tags array  
- **all_tags**: Combined tags for unified filtering
- **timestamps**: Unix timestamps for sorting/filtering
- **counts**: Content metrics for relevance scoring

---

## Search Operations

### Basic Text Search
```http
GET /api/v1/search?q=meeting notes&limit=20&page=1
```

**Meilisearch Query**:
```json
{
  "q": "meeting notes",
  "limit": 20,
  "offset": 0,
  "attributesToHighlight": ["title", "content"],
  "highlightPreTag": "<mark>",
  "highlightPostTag": "</mark>",
  "attributesToCrop": ["content"],
  "cropLength": 200,
  "cropMarker": "..."
}
```

### Filtered Search
```http
GET /api/v1/search?q=project&tags=meeting,roadmap&workspace_ids=uuid1,uuid2
```

**Meilisearch Query**:
```json
{
  "q": "project",
  "filter": [
    "workspace_id IN [uuid1, uuid2]",
    "all_tags IN [meeting, roadmap]"
  ],
  "limit": 20,
  "offset": 0
}
```

### Advanced Search with Sorting
```http
GET /api/v1/search?q=alpha&sort=updated_at:desc&created_after=2025-08-01
```

**Meilisearch Query**:
```json
{
  "q": "alpha",
  "filter": "created_at > 1722470400",
  "sort": ["updated_at:desc"],
  "limit": 20,
  "offset": 0
}
```

---

## Permission-Based Filtering

### User Workspace Access
Before executing any search, filter by user's accessible workspaces:

```typescript
async function getUserAccessibleWorkspaces(userId: string): Promise<string[]> {
  const permissions = await db.query(`
    SELECT workspace_id FROM user_permissions 
    WHERE user_id = ?
  `, [userId]);
  
  return permissions.map(p => p.workspace_id);
}

async function searchWithPermissions(
  query: string, 
  userId: string, 
  options: SearchOptions
): Promise<SearchResult> {
  const accessibleWorkspaces = await getUserAccessibleWorkspaces(userId);
  
  if (accessibleWorkspaces.length === 0) {
    return { hits: [], totalHits: 0, query };
  }
  
  const meilisearchQuery = {
    q: query,
    filter: [`workspace_id IN [${accessibleWorkspaces.join(', ')}]`],
    ...options
  };
  
  return await meilisearchClient.index('notes').search(meilisearchQuery);
}
```

---

## Real-Time Indexing

### Document Synchronization
```typescript
interface IndexOperation {
  operation: 'create' | 'update' | 'delete';
  noteId: string;
  document?: MeilisearchDocument;
}

class SearchIndexManager {
  private queue: IndexOperation[] = [];
  private processing = false;
  
  async onNoteCreated(note: Note): Promise<void> {
    const document = await this.buildSearchDocument(note);
    this.queue.push({
      operation: 'create',
      noteId: note.id,
      document
    });
    
    this.processQueue();
  }
  
  async onNoteUpdated(note: Note): Promise<void> {
    const document = await this.buildSearchDocument(note);
    this.queue.push({
      operation: 'update',
      noteId: note.id,
      document
    });
    
    this.processQueue();
  }
  
  async onNoteDeleted(noteId: string): Promise<void> {
    this.queue.push({
      operation: 'delete',
      noteId
    });
    
    this.processQueue();
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    try {
      const batch = this.queue.splice(0, 100); // Process in batches
      
      const creates = batch.filter(op => op.operation === 'create');
      const updates = batch.filter(op => op.operation === 'update');
      const deletes = batch.filter(op => op.operation === 'delete');
      
      // Execute operations
      if (creates.length > 0) {
        await this.meilisearch.index('notes').addDocuments(
          creates.map(op => op.document)
        );
      }
      
      if (updates.length > 0) {
        await this.meilisearch.index('notes').updateDocuments(
          updates.map(op => op.document)
        );
      }
      
      if (deletes.length > 0) {
        await this.meilisearch.index('notes').deleteDocuments(
          deletes.map(op => op.noteId)
        );
      }
      
    } finally {
      this.processing = false;
      
      // Process remaining queue items
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }
}
```

### Diff-Based Updates
```typescript
async function onDiffApplied(noteId: string, diff: Diff): Promise<void> {
  // For small diffs, update the document directly
  if (diff.new_text.length < 1000) {
    const note = await getNote(noteId);
    const document = await buildSearchDocument(note);
    
    await meilisearchClient.index('notes').updateDocuments([document]);
  } else {
    // For large changes, defer update to next snapshot
    await scheduleIndexUpdate(noteId);
  }
}
```

---

## Search Features

### Typo Tolerance
Meilisearch automatically handles:
- **1 typo**: For words 5-8 characters
- **2 typos**: For words 9+ characters
- **Prefix matching**: Partial word matches
- **Diacritic insensitivity**: café matches cafe

**Example**:
```
Query: "meting notes" → Matches: "meeting notes"
Query: "roadmep" → Matches: "roadmap" 
Query: "proj" → Matches: "project", "projects"
```

### Faceted Search
```json
{
  "facets": {
    "workspace_name": {
      "Project Alpha": 15,
      "Research Notes": 8,
      "Personal": 3
    },
    "all_tags": {
      "meeting": 12,
      "roadmap": 7,
      "research": 5,
      "draft": 3
    },
    "created_at_range": {
      "last_week": 8,
      "last_month": 25,
      "last_year": 120
    }
  }
}
```

### Highlighting & Snippets
```json
{
  "id": "note-uuid",
  "title": "Meeting Notes - Project Alpha",
  "content_preview": "...discussed the <mark>roadmap</mark> for Q4...",
  "_formatted": {
    "title": "<mark>Meeting</mark> Notes - Project Alpha",
    "content": "...the <mark>meeting</mark> covered several key topics including the project <mark>roadmap</mark>..."
  }
}
```

---

## Search API Response Format

### Standard Search Response
```json
{
  "success": true,
  "data": [
    {
      "id": "note-uuid",
      "title": "Meeting Notes - Project Alpha",
      "workspace_id": "workspace-uuid",
      "workspace_name": "Project Alpha",
      "tags": ["meeting", "project-alpha"],
      "workspace_tags": ["work", "2025"],
      "created_at": "2025-09-01T10:00:00Z",
      "updated_at": "2025-09-01T11:30:00Z",
      "content_preview": "Meeting Summary - Discussed <mark>roadmap</mark> for Q4...",
      "highlights": {
        "title": ["<mark>Meeting</mark> Notes - Project Alpha"],
        "content": ["...discussed the <mark>roadmap</mark> for Q4..."]
      },
      "score": 0.95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "search_meta": {
    "query": "roadmap meeting",
    "total_time_ms": 15,
    "facets": {
      "workspace_name": {
        "Project Alpha": 15,
        "Research": 8
      },
      "all_tags": {
        "meeting": 12,
        "roadmap": 7
      }
    },
    "suggestions": [
      "roadmap meetings",
      "meeting roadmap 2025"
    ]
  }
}
```

---

## Performance Optimization

### Index Size Management
```typescript
interface IndexStats {
  documentCount: number;
  indexSize: string; // "45.2 MB"
  averageDocumentSize: number;
  lastUpdate: Date;
}

class IndexManager {
  async getIndexStats(): Promise<IndexStats> {
    const stats = await this.meilisearch.index('notes').getStats();
    
    return {
      documentCount: stats.numberOfDocuments,
      indexSize: this.formatBytes(stats.databaseSize),
      averageDocumentSize: stats.databaseSize / stats.numberOfDocuments,
      lastUpdate: new Date(stats.processingTimeMs)
    };
  }
  
  async optimizeIndex(): Promise<void> {
    // Remove old deleted documents
    await this.compactIndex();
    
    // Rebuild synonyms from tag relationships
    await this.updateSynonyms();
    
    // Update stop words based on content analysis
    await this.updateStopWords();
  }
}
```

### Caching Strategy
```typescript
// Cache frequent queries
const cacheKey = `search:${hashQuery(query, filters)}:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const results = await performSearch(query, filters, userId);

// Cache for 5 minutes
await redis.setex(cacheKey, 300, JSON.stringify(results));

return results;
```

---

## Advanced Search Features

### Saved Searches
```typescript
interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: SearchFilters;
  notifications: boolean; // Alert on new matches
  created_at: Date;
}

// API endpoint for saved searches
POST /api/v1/search/saved
{
  "name": "Recent Project Updates",
  "query": "project alpha",
  "filters": {
    "tags": ["update", "progress"],
    "created_after": "2025-08-01"
  },
  "notifications": true
}
```

### Search Analytics
```typescript
interface SearchAnalytics {
  topQueries: Array<{ query: string; count: number }>;
  noResultQueries: Array<{ query: string; count: number }>;
  averageResponseTime: number;
  searchVolume: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  popularTags: Array<{ tag: string; searchCount: number }>;
}

async function getSearchAnalytics(
  userId: string,
  timeRange: TimeRange
): Promise<SearchAnalytics> {
  // Aggregate search logs and metrics
  return await analyzeSearchPatterns(userId, timeRange);
}
```

### AI-Enhanced Search
```typescript
interface SemanticSearchResult {
  traditionalResults: SearchResult[];
  semanticResults: SearchResult[];
  combinedScore: number;
}

async function performSemanticSearch(
  query: string,
  userId: string
): Promise<SemanticSearchResult> {
  // Traditional keyword search
  const traditional = await performTraditionalSearch(query, userId);
  
  // Vector-based semantic search (future enhancement)
  const semantic = await performVectorSearch(query, userId);
  
  // Combine and re-rank results
  return combineSearchResults(traditional, semantic);
}
```

---

## Search Monitoring

### Performance Metrics
- **Search latency**: 95th percentile response time < 100ms
- **Index update time**: Real-time updates < 50ms
- **Cache hit rate**: >80% for repeated queries
- **Search success rate**: >95% of queries return results

### Error Handling
```typescript
class SearchError extends Error {
  constructor(
    public code: string,
    public message: string,
    public query?: string,
    public userId?: string
  ) {
    super(message);
  }
}

async function handleSearchError(error: Error, query: string): Promise<SearchResult> {
  if (error instanceof MeilisearchError) {
    // Log search service error
    logger.error('Meilisearch error', { error, query });
    
    // Fallback to database search
    return await performDatabaseFallbackSearch(query);
  }
  
  throw new SearchError('SEARCH_001', 'Search service unavailable', query);
}
```

### Health Monitoring
```typescript
interface SearchHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  indexHealth: {
    documentsIndexed: number;
    lastUpdate: Date;
    queueSize: number;
  };
  errors: Array<{
    timestamp: Date;
    error: string;
    query?: string;
  }>;
}

async function checkSearchHealth(): Promise<SearchHealth> {
  try {
    const start = Date.now();
    await meilisearchClient.index('notes').search({ q: 'health-check' });
    const latency = Date.now() - start;
    
    const stats = await meilisearchClient.index('notes').getStats();
    
    return {
      status: latency < 100 ? 'healthy' : 'degraded',
      latency,
      indexHealth: {
        documentsIndexed: stats.numberOfDocuments,
        lastUpdate: new Date(),
        queueSize: await getIndexQueueSize()
      },
      errors: await getRecentSearchErrors()
    };
  } catch (error) {
    return {
      status: 'down',
      latency: -1,
      indexHealth: {
        documentsIndexed: 0,
        lastUpdate: new Date(0),
        queueSize: -1
      },
      errors: [{ timestamp: new Date(), error: error.message }]
    };
  }
}
```

---

This search system provides **fast, intelligent search** across all user content while maintaining **security** and **performance** at scale, with comprehensive **monitoring** and **analytics** capabilities.