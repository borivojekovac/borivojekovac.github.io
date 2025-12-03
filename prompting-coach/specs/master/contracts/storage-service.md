# Storage Service Contract

**Purpose**: Manages persistence of prompts, sessions, and settings

## Class: StorageService

### Constructor

```javascript
/**
 * Creates a new StorageService instance
 * Initializes IndexedDB connection
 */
constructor()
```

### Initialization

```javascript
/**
 * Initializes the database connection
 * Must be called before any other methods
 * @returns {Promise<void>}
 * @throws {StorageInitError} If database cannot be opened
 */
async initialize()
```

### Prompt Methods

```javascript
/**
 * Saves a prompt to storage
 * @param {Prompt} prompt - The prompt to save
 * @returns {Promise<Prompt>} The saved prompt with ID
 */
async savePrompt(prompt)

/**
 * Gets a prompt by ID
 * @param {string} id - The prompt ID
 * @returns {Promise<Prompt|null>} The prompt or null if not found
 */
async getPrompt(id)

/**
 * Gets all prompts, optionally filtered
 * @param {Object} [options]
 * @param {number} [options.limit=50] - Maximum results
 * @param {string} [options.sortBy='updatedAt'] - Sort field
 * @param {'asc'|'desc'} [options.sortOrder='desc'] - Sort order
 * @returns {Promise<Prompt[]>} List of prompts
 */
async getPrompts(options = {})

/**
 * Deletes a prompt by ID
 * @param {string} id - The prompt ID
 * @returns {Promise<boolean>} True if deleted
 */
async deletePrompt(id)
```

### Session Methods

```javascript
/**
 * Saves a coaching session
 * @param {CoachingSession} session - The session to save
 * @returns {Promise<CoachingSession>} The saved session
 */
async saveSession(session)

/**
 * Gets a session by ID
 * @param {string} id - The session ID
 * @returns {Promise<CoachingSession|null>} The session or null
 */
async getSession(id)

/**
 * Gets sessions for a prompt
 * @param {string} promptId - The prompt ID
 * @returns {Promise<CoachingSession[]>} List of sessions
 */
async getSessionsByPrompt(promptId)

/**
 * Gets active sessions
 * @returns {Promise<CoachingSession[]>} List of active sessions
 */
async getActiveSessions()

/**
 * Deletes a session by ID
 * @param {string} id - The session ID
 * @returns {Promise<boolean>} True if deleted
 */
async deleteSession(id)

/**
 * Toggles the starred status of a session
 * @param {string} id - The session ID
 * @returns {Promise<boolean>} New starred status
 */
async toggleSessionStar(id)

/**
 * Updates session title
 * @param {string} id - The session ID
 * @param {string} title - New title
 * @returns {Promise<CoachingSession>} Updated session
 */
async updateSessionTitle(id, title)

/**
 * Adds tags to a session
 * @param {string} id - The session ID
 * @param {string[]} tags - Tags to add
 * @returns {Promise<CoachingSession>} Updated session
 */
async addSessionTags(id, tags)

/**
 * Removes a tag from a session
 * @param {string} id - The session ID
 * @param {string} tag - Tag to remove
 * @returns {Promise<CoachingSession>} Updated session
 */
async removeSessionTag(id, tag)

/**
 * Gets all unique tags across all sessions
 * @returns {Promise<string[]>} List of unique tags
 */
async getAllTags()
```

### Session Search & History Methods

```javascript
/**
 * Searches sessions with filtering and pagination
 * @param {SessionSearchQuery} query - Search criteria
 * @returns {Promise<SessionSearchResult>} Paginated results
 */
async searchSessions(query)

/**
 * Gets starred sessions
 * @param {number} [limit=20] - Maximum results
 * @returns {Promise<CoachingSession[]>} Starred sessions
 */
async getStarredSessions(limit = 20)

/**
 * Gets recent sessions (for history view)
 * @param {number} [limit=20] - Maximum results
 * @returns {Promise<CoachingSession[]>} Recent sessions
 */
async getRecentSessions(limit = 20)

/**
 * Gets completed sessions
 * @param {number} [limit=50] - Maximum results
 * @returns {Promise<CoachingSession[]>} Completed sessions
 */
async getCompletedSessions(limit = 50)

/**
 * Gets session statistics
 * @returns {Promise<SessionStats>} Statistics
 */
async getSessionStats()
```

### Test Result Methods

```javascript
/**
 * Saves an LLM test result
 * @param {LlmTestResult} result - The test result to save
 * @returns {Promise<LlmTestResult>} The saved result
 */
async saveTestResult(result)

/**
 * Gets test results for a prompt
 * @param {string} promptId - The prompt ID
 * @param {number} [limit=10] - Maximum results
 * @returns {Promise<LlmTestResult[]>} List of test results
 */
async getTestResults(promptId, limit = 10)

/**
 * Deletes test results for a prompt
 * @param {string} promptId - The prompt ID
 * @returns {Promise<number>} Number of deleted results
 */
async deleteTestResults(promptId)
```

### Settings Methods

```javascript
/**
 * Gets application settings
 * @returns {AppSettings} Current settings
 */
getSettings()

/**
 * Saves application settings
 * @param {Partial<AppSettings>} settings - Settings to update
 * @returns {AppSettings} Updated settings
 */
saveSettings(settings)

/**
 * Clears all settings (reset to defaults)
 * @returns {AppSettings} Default settings
 */
clearSettings()
```

### Active Work State Methods (Refresh Recovery)

```javascript
/**
 * Gets the current active work state for refresh recovery
 * @returns {Promise<ActiveWorkState|null>} Current work state or null
 */
async getActiveWorkState()

/**
 * Saves the current active work state
 * Called automatically on state changes (debounced)
 * @param {ActiveWorkState} state - Current work state
 * @returns {Promise<void>}
 */
async saveActiveWorkState(state)

/**
 * Clears the active work state
 * Called when starting fresh or completing a session
 * @returns {Promise<void>}
 */
async clearActiveWorkState()
```

### UI State Methods (Session Storage)

```javascript
/**
 * Gets the UI state from sessionStorage
 * @returns {UIState} Current UI state
 */
getUIState()

/**
 * Saves UI state to sessionStorage
 * @param {Partial<UIState>} state - UI state to save
 * @returns {UIState} Updated UI state
 */
saveUIState(state)

/**
 * Clears UI state
 * @returns {UIState} Default UI state
 */
clearUIState()
```

### Utility Methods

```javascript
/**
 * Exports all data as JSON
 * @returns {Promise<string>} JSON string of all data
 */
async exportData()

/**
 * Imports data from JSON
 * @param {string} json - JSON string to import
 * @param {boolean} [merge=false] - Merge with existing or replace
 * @returns {Promise<ImportResult>} Import statistics
 */
async importData(json, merge = false)

/**
 * Clears all stored data
 * @returns {Promise<void>}
 */
async clearAll()

/**
 * Gets storage usage statistics
 * @returns {Promise<StorageStats>} Usage information
 */
async getStorageStats()
```

### Response Types

```javascript
/**
 * @typedef {Object} ImportResult
 * @property {number} promptsImported
 * @property {number} sessionsImported
 * @property {number} testsImported
 * @property {string[]} errors - Any import errors
 */

/**
 * @typedef {Object} StorageStats
 * @property {number} promptCount
 * @property {number} sessionCount
 * @property {number} testCount
 * @property {number} totalSizeBytes - Estimated storage used
 */

/**
 * @typedef {Object} SessionStats
 * @property {number} totalSessions - All sessions count
 * @property {number} completedSessions - Completed sessions count
 * @property {number} starredSessions - Starred sessions count
 * @property {number} activeSessions - Currently active sessions
 * @property {number} averagePrinciplesSatisfied - Avg principles completed per session
 * @property {string[]} topTags - Most used tags (top 10)
 */
```

### Error Classes

```javascript
class StorageInitError extends Error {
  /** @type {string} */
  reason;
}

class StorageQuotaError extends Error {
  /** @type {number} */
  requiredBytes;
  /** @type {number} */
  availableBytes;
}
```

## Default Settings

```javascript
const DEFAULT_SETTINGS = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKeys: {},
  logLevel: 'info',
  theme: 'system',
  autoSave: true
};
```
