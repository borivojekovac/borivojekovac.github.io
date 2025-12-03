/**
 * LlmTestResult
 * Represents a test run of the prompt against an LLM
 */

export class LlmTestResult {
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

  /**
   * Creates a new LlmTestResult
   * @param {Object} data
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.promptId = data.promptId || null;
    this.provider = data.provider || 'openai';
    this.model = data.model || 'gpt-4o-mini';
    this.promptText = data.promptText || '';
    this.response = data.response || '';
    this.responseTimeMs = data.responseTimeMs || 0;
    this.tokensUsed = data.tokensUsed || 0;
    this.testedAt = data.testedAt ? new Date(data.testedAt) : new Date();
    this.error = data.error || null;
  }

  /**
   * Checks if the test was successful
   * @returns {boolean}
   */
  isSuccess() {
    return !this.error && this.response.length > 0;
  }

  /**
   * Gets a truncated preview of the response
   * @param {number} maxLength
   * @returns {string}
   */
  getResponsePreview(maxLength = 200) {
    if (!this.response) return '';
    if (this.response.length <= maxLength) return this.response;
    return this.response.substring(0, maxLength) + '...';
  }

  /**
   * Gets formatted response time
   * @returns {string}
   */
  getFormattedResponseTime() {
    if (this.responseTimeMs < 1000) {
      return `${this.responseTimeMs}ms`;
    }
    return `${(this.responseTimeMs / 1000).toFixed(2)}s`;
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      promptId: this.promptId,
      provider: this.provider,
      model: this.model,
      promptText: this.promptText,
      response: this.response,
      responseTimeMs: this.responseTimeMs,
      tokensUsed: this.tokensUsed,
      testedAt: this.testedAt.toISOString(),
      error: this.error,
    };
  }

  /**
   * Creates an LlmTestResult from stored data
   * @param {Object} data
   * @returns {LlmTestResult}
   */
  static fromJSON(data) {
    return new LlmTestResult(data);
  }
}
