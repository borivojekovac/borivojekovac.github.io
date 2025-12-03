/**
 * LlmApiError
 * Error thrown when LLM API calls fail
 */
export class LlmApiError extends Error {
  /** @type {number} HTTP status code */
  statusCode;
  
  /** @type {string} Provider-specific error code */
  errorCode;
  
  /** @type {string} Provider name */
  provider;

  /**
   * Creates a new LlmApiError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {number} [options.statusCode] - HTTP status code
   * @param {string} [options.errorCode] - Provider error code
   * @param {string} [options.provider] - Provider name
   */
  constructor(message, { statusCode, errorCode, provider } = {}) {
    super(message);
    this.name = 'LlmApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.provider = provider;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LlmApiError);
    }
  }

  /**
   * Creates error from API response
   * @param {Response} response - Fetch response
   * @param {string} provider - Provider name
   * @returns {Promise<LlmApiError>}
   */
  static async fromResponse(response, provider) {
    let errorCode = '';
    let message = `API request failed with status ${response.status}`;
    
    try {
      const data = await response.json();
      message = data.error?.message || data.message || message;
      errorCode = data.error?.code || data.code || '';
    } catch {
      // Response body not JSON, use default message
    }
    
    return new LlmApiError(message, {
      statusCode: response.status,
      errorCode,
      provider,
    });
  }
}

/**
 * LlmRateLimitError
 * Error thrown when rate limit is exceeded
 */
export class LlmRateLimitError extends LlmApiError {
  /** @type {number} Seconds until rate limit resets */
  retryAfter;

  /**
   * Creates a new LlmRateLimitError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {number} [options.retryAfter] - Seconds until reset
   * @param {string} [options.provider] - Provider name
   */
  constructor(message, { retryAfter, provider } = {}) {
    super(message, { statusCode: 429, errorCode: 'rate_limit_exceeded', provider });
    this.name = 'LlmRateLimitError';
    this.retryAfter = retryAfter;
  }
}
