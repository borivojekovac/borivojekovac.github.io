/**
 * StorageError
 * Error thrown when storage operations fail
 */
export class StorageError extends Error {
  /** @type {string} Storage operation that failed */
  operation;
  
  /** @type {string} Store/collection name */
  store;

  /**
   * Creates a new StorageError
   * @param {string} message - Error message
   * @param {Object} [options] - Error options
   * @param {string} [options.operation] - Operation that failed
   * @param {string} [options.store] - Store name
   */
  constructor(message, { operation, store } = {}) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
    this.store = store;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError);
    }
  }

  /**
   * Creates error for database initialization failure
   * @param {string} reason - Failure reason
   * @returns {StorageError}
   */
  static initFailed(reason) {
    return new StorageError(
      `Failed to initialize database: ${reason}`,
      { operation: 'init' }
    );
  }

  /**
   * Creates error for read operation failure
   * @param {string} store - Store name
   * @param {string} [id] - Record ID
   * @returns {StorageError}
   */
  static readFailed(store, id) {
    const message = id 
      ? `Failed to read record "${id}" from ${store}`
      : `Failed to read from ${store}`;
    return new StorageError(message, { operation: 'read', store });
  }

  /**
   * Creates error for write operation failure
   * @param {string} store - Store name
   * @param {string} [id] - Record ID
   * @returns {StorageError}
   */
  static writeFailed(store, id) {
    const message = id
      ? `Failed to write record "${id}" to ${store}`
      : `Failed to write to ${store}`;
    return new StorageError(message, { operation: 'write', store });
  }

  /**
   * Creates error for delete operation failure
   * @param {string} store - Store name
   * @param {string} id - Record ID
   * @returns {StorageError}
   */
  static deleteFailed(store, id) {
    return new StorageError(
      `Failed to delete record "${id}" from ${store}`,
      { operation: 'delete', store }
    );
  }

  /**
   * Creates error for quota exceeded
   * @returns {StorageError}
   */
  static quotaExceeded() {
    return new StorageError(
      'Storage quota exceeded. Please delete some data to free up space.',
      { operation: 'write' }
    );
  }
}

/**
 * StorageInitError
 * Error thrown when storage initialization fails
 */
export class StorageInitError extends StorageError {
  /** @type {string} Reason for initialization failure */
  reason;

  /**
   * Creates a new StorageInitError
   * @param {string} reason - Failure reason
   */
  constructor(reason) {
    super(`Storage initialization failed: ${reason}`, { operation: 'init' });
    this.name = 'StorageInitError';
    this.reason = reason;
  }
}
