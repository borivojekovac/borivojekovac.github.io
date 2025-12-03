# Log Service Contract

**Purpose**: Provides configurable, structured logging throughout the application

## Class: LogService

### Static Instance

```javascript
/**
 * Gets the singleton LogService instance
 * @returns {LogService}
 */
static getInstance()
```

### Configuration

```javascript
/**
 * Sets the log level
 * @param {'error'|'warn'|'info'|'debug'|'trace'} level
 */
setLevel(level)

/**
 * Gets the current log level
 * @returns {string}
 */
getLevel()

/**
 * Enables or disables console output
 * @param {boolean} enabled
 */
setConsoleEnabled(enabled)

/**
 * Sets a correlation ID for request tracing
 * @param {string} correlationId
 */
setCorrelationId(correlationId)

/**
 * Clears the correlation ID
 */
clearCorrelationId()
```

### Logging Methods

```javascript
/**
 * Logs an error message
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context
 * @param {Error} [error] - Error object if applicable
 */
error(message, context = {}, error = null)

/**
 * Logs a warning message
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context
 */
warn(message, context = {})

/**
 * Logs an info message
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context
 */
info(message, context = {})

/**
 * Logs a debug message
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context
 */
debug(message, context = {})

/**
 * Logs a trace message (most verbose)
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context
 */
trace(message, context = {})
```

### Performance Logging

```javascript
/**
 * Starts a performance timer
 * @param {string} operation - Name of the operation
 * @returns {string} Timer ID
 */
startTimer(operation)

/**
 * Ends a performance timer and logs duration
 * @param {string} timerId - Timer ID from startTimer
 * @param {Object} [context] - Additional context
 * @returns {number} Duration in milliseconds
 */
endTimer(timerId, context = {})

/**
 * Logs a performance metric directly
 * @param {string} operation - Name of the operation
 * @param {number} durationMs - Duration in milliseconds
 * @param {Object} [context] - Additional context
 */
logPerformance(operation, durationMs, context = {})
```

### Log Retrieval

```javascript
/**
 * Gets recent log entries (stored in memory)
 * @param {Object} [options]
 * @param {string} [options.level] - Filter by level
 * @param {number} [options.limit=100] - Maximum entries
 * @param {string} [options.correlationId] - Filter by correlation ID
 * @returns {LogEntry[]}
 */
getRecentLogs(options = {})

/**
 * Clears the in-memory log buffer
 */
clearLogs()

/**
 * Exports logs as JSON
 * @returns {string}
 */
exportLogs()
```

### Log Entry Structure

```javascript
/**
 * @typedef {Object} LogEntry
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} level - Log level
 * @property {string} message - Log message
 * @property {Object} context - Additional context
 * @property {string|null} correlationId - Request correlation ID
 * @property {string|null} operation - Operation name (for perf logs)
 * @property {number|null} durationMs - Duration (for perf logs)
 * @property {Object|null} error - Serialized error (for error logs)
 */
```

### Log Level Hierarchy

| Level | Value | Description |
|-------|-------|-------------|
| error | 0 | Errors that need attention |
| warn | 1 | Warnings about potential issues |
| info | 2 | General information (default) |
| debug | 3 | Detailed debugging information |
| trace | 4 | Very detailed trace information |

### Console Output Format

```javascript
// Structured JSON format for machine parsing
{
  "timestamp": "2025-12-02T15:45:30.123Z",
  "level": "info",
  "message": "LLM request completed",
  "context": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "tokensUsed": 150
  },
  "correlationId": "abc-123",
  "durationMs": 1234
}
```

### Environment Variable

```javascript
// Log level can be set via environment variable
// Reads from: import.meta.env.VITE_LOG_LEVEL
// Falls back to: 'info'
```

### Usage Example

```javascript
import { LogService } from './services/LogService.js';

const log = LogService.getInstance();

// Basic logging
log.info('Application started');
log.debug('Loading settings', { provider: 'openai' });

// Error logging
try {
  await llmService.sendMessage(prompt);
} catch (error) {
  log.error('LLM request failed', { prompt: prompt.substring(0, 100) }, error);
}

// Performance logging
const timerId = log.startTimer('llm-request');
const response = await llmService.sendMessage(prompt);
log.endTimer(timerId, { tokensUsed: response.tokensUsed });
```
