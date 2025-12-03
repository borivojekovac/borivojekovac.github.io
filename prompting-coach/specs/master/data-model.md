# Data Model: Prompting Coach PWA

**Date**: 2025-12-02  
**Purpose**: Define entities, relationships, and state structures

## Core Entities

### 1. Prompt

Represents the user's prompt being crafted and refined.

```javascript
class Prompt {
  /** @type {string} Unique identifier */
  id;
  
  /** @type {string} The prompt text content */
  text;
  
  /** @type {AttachedFile[]} Files attached as context */
  files;
  
  /** @type {Date} When the prompt was created */
  createdAt;
  
  /** @type {Date} When the prompt was last modified */
  updatedAt;
  
  /** @type {string} Optional title/name for the prompt */
  title;
}
```

**Validation Rules**:
- `text` MUST NOT be empty when testing against LLM
- `text` SHOULD be under 10,000 characters (soft limit, warning only)
- `files` total size MUST NOT exceed 500KB

### 2. AttachedFile

Represents a file uploaded as context for the prompt.

```javascript
class AttachedFile {
  /** @type {string} Unique identifier */
  id;
  
  /** @type {string} Original filename */
  name;
  
  /** @type {string} MIME type */
  mimeType;
  
  /** @type {number} File size in bytes */
  size;
  
  /** @type {string} File content (text or base64) */
  content;
  
  /** @type {Date} When the file was attached */
  attachedAt;
}
```

**Validation Rules**:
- `size` MUST NOT exceed 100KB per file
- `mimeType` MUST be one of: `text/plain`, `text/markdown`, `application/json`, `text/csv`

### 3. Principle

Represents a coaching principle from the AIM/MAP/OCEAN frameworks.

```javascript
class Principle {
  /** @type {string} Unique identifier (e.g., 'aim-actor') */
  id;
  
  /** @type {string} Display name (e.g., 'Actor (A)') */
  name;
  
  /** @type {string} Framework this belongs to (AIM, MAP, DEBUG, OCEAN) */
  framework;
  
  /** @type {string} Description of what this principle checks */
  description;
  
  /** @type {string} Question to ask the user */
  question;
  
  /** @type {string[]} Example improvements */
  examples;
  
  /** @type {number} Order in the coaching sequence */
  order;
}
```

**Note**: Principles are static configuration, not user data.

### 4. CoachingSession

Represents an active or completed coaching session with progress state.

```javascript
class CoachingSession {
  /** @type {string} Unique identifier */
  id;
  
  /** @type {string} Reference to the Prompt being coached */
  promptId;
  
  /** @type {number} Index of current principle being evaluated */
  currentPrincipleIndex;
  
  /** @type {PrincipleResult[]} Results for each evaluated principle */
  principleResults;
  
  /** @type {ChatMessage[]} Conversation history with coach */
  chatHistory;
  
  /** @type {'active'|'completed'|'abandoned'} Session status */
  status;
  
  /** @type {Date} When the session started */
  startedAt;
  
  /** @type {Date} When the session was last updated */
  updatedAt;
  
  /** @type {Date|null} When the session was completed */
  completedAt;
  
  /** @type {boolean} Whether this session is starred/favorited */
  isStarred;
  
  /** @type {string} User-provided title for the session (auto-generated if empty) */
  title;
  
  /** @type {string[]} User-defined tags for filtering */
  tags;
  
  /** @type {string} The final prompt text when session completed */
  finalPromptText;
  
  /** @type {string} Brief summary of improvements made (auto-generated) */
  summary;
}
```

**Indexing for Search**:
- `title` - Full-text searchable
- `tags` - Exact match filtering
- `finalPromptText` - Full-text searchable
- `isStarred` - Boolean filter
- `status` - Enum filter
- `completedAt` - Date range filter

### 5. PrincipleResult

Represents the evaluation result for a single principle.

```javascript
class PrincipleResult {
  /** @type {string} Reference to Principle.id */
  principleId;
  
  /** @type {boolean} Whether the principle is satisfied */
  satisfied;
  
  /** @type {string} Feedback from the coach */
  feedback;
  
  /** @type {string[]} Suggested improvements */
  suggestions;
  
  /** @type {Date} When this was evaluated */
  evaluatedAt;
  
  /** @type {string} The prompt text at time of evaluation */
  promptSnapshot;
}
```

### 6. ChatMessage

Represents a message in the coaching conversation.

```javascript
class ChatMessage {
  /** @type {string} Unique identifier */
  id;
  
  /** @type {'user'|'coach'|'system'} Who sent the message */
  role;
  
  /** @type {string} Message content */
  content;
  
  /** @type {Date} When the message was sent */
  timestamp;
  
  /** @type {string|null} Related principle ID if applicable */
  principleId;
}
```

### 7. LlmTestResult

Represents a test run of the prompt against an LLM.

```javascript
class LlmTestResult {
  /** @type {string} Unique identifier */
  id;
  
  /** @type {string} Reference to Prompt.id */
  promptId;
  
  /** @type {string} Provider used (openai, google, anthropic, xai) */
  provider;
  
  /** @type {string} Model used (e.g., 'gpt-4o-mini') */
  model;
  
  /** @type {string} The prompt text that was sent */
  promptText;
  
  /** @type {string} The response from the LLM */
  response;
  
  /** @type {number} Response time in milliseconds */
  responseTimeMs;
  
  /** @type {number} Tokens used (if available) */
  tokensUsed;
  
  /** @type {Date} When the test was run */
  testedAt;
  
  /** @type {string|null} Error message if failed */
  error;
}
```

### 8. AppSettings

Represents user preferences and configuration.

```javascript
class AppSettings {
  /** @type {string} Selected LLM provider */
  provider;
  
  /** @type {string} Selected model for the provider */
  model;
  
  /** @type {Object<string, string>} API keys by provider */
  apiKeys;
  
  /** @type {'error'|'warn'|'info'|'debug'|'trace'} Log level */
  logLevel;
  
  /** @type {'light'|'dark'|'system'} Theme preference */
  theme;
  
  /** @type {boolean} Whether to auto-save prompts */
  autoSave;
}
```

**Security Note**: `apiKeys` stored in localStorage. Users warned about risks.

### 9. SessionSearchQuery

Represents search/filter criteria for session history.

```javascript
class SessionSearchQuery {
  /** @type {string} Free-text search across title, prompt, summary */
  searchText;
  
  /** @type {string[]} Filter by tags (AND logic) */
  tags;
  
  /** @type {boolean|null} Filter starred only (null = all) */
  starredOnly;
  
  /** @type {('active'|'completed'|'abandoned')[]} Filter by status */
  statuses;
  
  /** @type {Date|null} Filter sessions after this date */
  fromDate;
  
  /** @type {Date|null} Filter sessions before this date */
  toDate;
  
  /** @type {'updatedAt'|'createdAt'|'title'|'completedAt'} Sort field */
  sortBy;
  
  /** @type {'asc'|'desc'} Sort direction */
  sortOrder;
  
  /** @type {number} Page number (0-indexed) */
  page;
  
  /** @type {number} Results per page */
  pageSize;
}
```

### 10. SessionSearchResult

Represents paginated search results.

```javascript
class SessionSearchResult {
  /** @type {CoachingSession[]} Matching sessions */
  sessions;
  
  /** @type {number} Total matching count (for pagination) */
  totalCount;
  
  /** @type {number} Current page */
  page;
  
  /** @type {number} Total pages */
  totalPages;
  
  /** @type {string[]} All unique tags across results (for filter UI) */
  availableTags;
}
```

## State Transitions

### CoachingSession State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Start Session]                                            │
│        │                                                    │
│        ▼                                                    │
│   ┌─────────┐                                               │
│   │ active  │◄──────────────────────────────┐               │
│   └────┬────┘                               │               │
│        │                                    │               │
│        ├──[Evaluate Principle]──────────────┤               │
│        │        │                           │               │
│        │        ▼                           │               │
│        │   satisfied?                       │               │
│        │     │    │                         │               │
│        │    Yes   No                        │               │
│        │     │    │                         │               │
│        │     │    └──[User Updates Prompt]──┘               │
│        │     │                                              │
│        │     ▼                                              │
│        │   More principles?                                 │
│        │     │    │                                         │
│        │    Yes   No                                        │
│        │     │    │                                         │
│        │     │    ▼                                         │
│        │     │  ┌───────────┐                               │
│        │     │  │ completed │                               │
│        │     │  └───────────┘                               │
│        │     │                                              │
│        │     └──[Next Principle]────────────►[active]       │
│        │                                                    │
│        └──[User Abandons]──────►┌───────────┐               │
│                                 │ abandoned │               │
│                                 └───────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Relationships

```
┌─────────────┐       1:N       ┌──────────────┐
│   Prompt    │◄────────────────│ AttachedFile │
└──────┬──────┘                 └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐     1:N    ┌─────────────────┐
│ CoachingSession  │◄───────────│  ChatMessage    │
└────────┬─────────┘            └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ PrincipleResult │
└────────┬────────┘
         │
         │ N:1
         ▼
┌─────────────────┐
│   Principle     │ (static config)
└─────────────────┘

┌─────────────┐       1:N       ┌───────────────┐
│   Prompt    │◄────────────────│ LlmTestResult │
└─────────────┘                 └───────────────┘
```

## Storage Mapping

| Entity | Storage | Key Pattern |
|--------|---------|-------------|
| Prompt | IndexedDB | `prompts/{id}` |
| AttachedFile | IndexedDB | Embedded in Prompt |
| CoachingSession | IndexedDB | `sessions/{id}` |
| PrincipleResult | IndexedDB | Embedded in Session |
| ChatMessage | IndexedDB | Embedded in Session |
| LlmTestResult | IndexedDB | `tests/{id}` |
| AppSettings | localStorage | `settings` |
| Principle | Static JS | `config/principles.js` |
| UIState | sessionStorage | `uiState` |
| ActiveWorkState | IndexedDB | `activeWork` |

## IndexedDB Schema

```javascript
const DB_NAME = 'PromptingCoachDB';
const DB_VERSION = 1;

const stores = {
  prompts: { 
    keyPath: 'id', 
    indexes: ['createdAt', 'title', 'updatedAt'] 
  },
  sessions: { 
    keyPath: 'id', 
    indexes: [
      'promptId',
      'status',
      'startedAt',
      'updatedAt',
      'completedAt',
      'isStarred',
      'title',
      { name: 'tags', multiEntry: true }  // Allows querying by individual tag
    ] 
  },
  tests: { 
    keyPath: 'id', 
    indexes: ['promptId', 'testedAt'] 
  },
  activeWork: { 
    keyPath: 'key'  // Single record for current work state
  }
};
```

### Search Implementation Notes

IndexedDB doesn't support full-text search natively. Implementation approach:

1. **Simple text search**: Load sessions into memory, filter with `includes()`
2. **Tag filtering**: Use multiEntry index for efficient tag queries
3. **Boolean/enum filters**: Use indexes directly
4. **Pagination**: Use cursor with skip/limit pattern

```javascript
// Example: Search with multiple filters
async searchSessions(query) {
  let results = await this.getAllSessions();
  
  // Text search (in-memory)
  if (query.searchText) {
    const search = query.searchText.toLowerCase();
    results = results.filter(s => 
      s.title?.toLowerCase().includes(search) ||
      s.finalPromptText?.toLowerCase().includes(search) ||
      s.summary?.toLowerCase().includes(search)
    );
  }
  
  // Tag filter
  if (query.tags?.length) {
    results = results.filter(s => 
      query.tags.every(tag => s.tags?.includes(tag))
    );
  }
  
  // Starred filter
  if (query.starredOnly) {
    results = results.filter(s => s.isStarred);
  }
  
  // Status filter
  if (query.statuses?.length) {
    results = results.filter(s => query.statuses.includes(s.status));
  }
  
  // Sort and paginate
  results.sort(/* by query.sortBy, query.sortOrder */);
  const totalCount = results.length;
  const paged = results.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
  
  return { sessions: paged, totalCount, page: query.page, totalPages: Math.ceil(totalCount / query.pageSize) };
}
```

## Refresh Recovery: ActiveWorkState

Special entity that captures the current working state for seamless page refresh recovery.

```javascript
class ActiveWorkState {
  /** @type {string} Always 'current' - single record */
  key = 'current';
  
  /** @type {string|null} ID of prompt being edited */
  activePromptId;
  
  /** @type {string} Current prompt text (may differ from saved) */
  draftPromptText;
  
  /** @type {AttachedFile[]} Currently attached files */
  draftFiles;
  
  /** @type {string|null} ID of active coaching session */
  activeSessionId;
  
  /** @type {Date} Last update timestamp */
  updatedAt;
}
```

**Persistence Rules**:
- Updated on every prompt text change (debounced 300ms)
- Updated immediately on file attach/detach
- Updated on coaching session state changes
- Cleared when user explicitly starts new prompt or completes session

## UIState (sessionStorage)

Transient UI state that survives refresh but not tab close.

```javascript
class UIState {
  /** @type {'editor'|'coach'|'test'|'settings'} Active tab */
  activeTab;
  
  /** @type {number} Scroll position of main content */
  scrollTop;
  
  /** @type {boolean} Whether settings dialog is open */
  settingsOpen;
  
  /** @type {string|null} ID of expanded chat message (if any) */
  expandedMessageId;
}
```

**Storage**: `sessionStorage.setItem('uiState', JSON.stringify(uiState))`
