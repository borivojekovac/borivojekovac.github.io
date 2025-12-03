/**
 * LogService
 * Provides configurable, structured logging throughout the application
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const MAX_LOG_ENTRIES = 500;

/** @type {LogService|null} */
let instance = null;

export class LogService {
  /** @type {string} */
  #level = 'info';
  
  /** @type {boolean} */
  #consoleEnabled = true;
  
  /** @type {string|null} */
  #correlationId = null;
  
  /** @type {Array<LogEntry>} */
  #logBuffer = [];
  
  /** @type {Map<string, number>} */
  #timers = new Map();

  constructor() {
    // Read log level from environment
    const envLevel = import.meta.env?.VITE_LOG_LEVEL;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      this.#level = envLevel;
    }
  }

  /**
   * Gets the singleton LogService instance
   * @returns {LogService}
   */
  static getInstance() {
    if (!instance) {
      instance = new LogService();
    }
    return instance;
  }

  /**
   * Sets the log level
   * @param {'error'|'warn'|'info'|'debug'|'trace'} level
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.#level = level;
    }
  }

  /**
   * Gets the current log level
   * @returns {string}
   */
  getLevel() {
    return this.#level;
  }

  /**
   * Enables or disables console output
   * @param {boolean} enabled
   */
  setConsoleEnabled(enabled) {
    this.#consoleEnabled = enabled;
  }

  /**
   * Sets a correlation ID for request tracing
   * @param {string} correlationId
   */
  setCorrelationId(correlationId) {
    this.#correlationId = correlationId;
  }

  /**
   * Clears the correlation ID
   */
  clearCorrelationId() {
    this.#correlationId = null;
  }

  /**
   * Checks if a level should be logged
   * @param {string} level
   * @returns {boolean}
   */
  #shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.#level];
  }

  /**
   * Creates a log entry
   * @param {string} level
   * @param {string} message
   * @param {Object} context
   * @param {Error|null} error
   * @returns {LogEntry}
   */
  #createEntry(level, message, context, error = null) {
    /** @type {LogEntry} */
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      correlationId: this.#correlationId,
      operation: null,
      durationMs: null,
      error: null,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Writes a log entry
   * @param {LogEntry} entry
   */
  #write(entry) {
    // Add to buffer
    this.#logBuffer.push(entry);
    if (this.#logBuffer.length > MAX_LOG_ENTRIES) {
      this.#logBuffer.shift();
    }

    // Write to console if enabled
    if (this.#consoleEnabled) {
      const consoleMethod = entry.level === 'error' ? 'error' 
        : entry.level === 'warn' ? 'warn' 
        : entry.level === 'debug' || entry.level === 'trace' ? 'debug'
        : 'log';
      
      const logData = { ...entry };
      delete logData.timestamp;
      delete logData.level;
      delete logData.message;
      
      // Clean up empty fields
      if (!logData.correlationId) delete logData.correlationId;
      if (!logData.operation) delete logData.operation;
      if (!logData.durationMs) delete logData.durationMs;
      if (!logData.error) delete logData.error;
      if (Object.keys(logData.context).length === 0) delete logData.context;

      const hasExtra = Object.keys(logData).length > 0;
      
      console[consoleMethod](
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
        hasExtra ? logData : ''
      );
    }
  }

  /**
   * Logs an error message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   * @param {Error} [error] - Error object if applicable
   */
  error(message, context = {}, error = null) {
    if (this.#shouldLog('error')) {
      this.#write(this.#createEntry('error', message, context, error));
    }
  }

  /**
   * Logs a warning message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   */
  warn(message, context = {}) {
    if (this.#shouldLog('warn')) {
      this.#write(this.#createEntry('warn', message, context));
    }
  }

  /**
   * Logs an info message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   */
  info(message, context = {}) {
    if (this.#shouldLog('info')) {
      this.#write(this.#createEntry('info', message, context));
    }
  }

  /**
   * Logs a debug message
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   */
  debug(message, context = {}) {
    if (this.#shouldLog('debug')) {
      this.#write(this.#createEntry('debug', message, context));
    }
  }

  /**
   * Logs a trace message (most verbose)
   * @param {string} message - Log message
   * @param {Object} [context] - Additional context
   */
  trace(message, context = {}) {
    if (this.#shouldLog('trace')) {
      this.#write(this.#createEntry('trace', message, context));
    }
  }

  /**
   * Starts a performance timer
   * @param {string} operation - Name of the operation
   * @returns {string} Timer ID
   */
  startTimer(operation) {
    const timerId = `${operation}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.#timers.set(timerId, performance.now());
    return timerId;
  }

  /**
   * Ends a performance timer and logs duration
   * @param {string} timerId - Timer ID from startTimer
   * @param {Object} [context] - Additional context
   * @returns {number} Duration in milliseconds
   */
  endTimer(timerId, context = {}) {
    const startTime = this.#timers.get(timerId);
    if (startTime === undefined) {
      this.warn('Timer not found', { timerId });
      return 0;
    }

    const durationMs = Math.round(performance.now() - startTime);
    this.#timers.delete(timerId);

    const operation = timerId.split('-')[0];
    this.logPerformance(operation, durationMs, context);

    return durationMs;
  }

  /**
   * Logs a performance metric directly
   * @param {string} operation - Name of the operation
   * @param {number} durationMs - Duration in milliseconds
   * @param {Object} [context] - Additional context
   */
  logPerformance(operation, durationMs, context = {}) {
    if (this.#shouldLog('debug')) {
      const entry = this.#createEntry('debug', `${operation} completed`, context);
      entry.operation = operation;
      entry.durationMs = durationMs;
      this.#write(entry);
    }
  }

  /**
   * Gets recent log entries (stored in memory)
   * @param {Object} [options]
   * @param {string} [options.level] - Filter by level
   * @param {number} [options.limit=100] - Maximum entries
   * @param {string} [options.correlationId] - Filter by correlation ID
   * @returns {LogEntry[]}
   */
  getRecentLogs(options = {}) {
    let results = [...this.#logBuffer];

    if (options.level) {
      results = results.filter(e => e.level === options.level);
    }

    if (options.correlationId) {
      results = results.filter(e => e.correlationId === options.correlationId);
    }

    const limit = options.limit || 100;
    return results.slice(-limit);
  }

  /**
   * Clears the in-memory log buffer
   */
  clearLogs() {
    this.#logBuffer = [];
  }

  /**
   * Exports logs as JSON
   * @returns {string}
   */
  exportLogs() {
    return JSON.stringify(this.#logBuffer, null, 2);
  }
}

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
