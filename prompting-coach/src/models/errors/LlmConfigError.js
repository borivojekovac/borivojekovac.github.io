/**
 * LlmConfigError
 * Error thrown when LLM configuration is invalid
 */
export class LlmConfigError extends Error {
  /** @type {string} Configuration field that's invalid */
  field;

  /**
   * Creates a new LlmConfigError
   * @param {string} message - Error message
   * @param {string} [field] - The invalid configuration field
   */
  constructor(message, field) {
    super(message);
    this.name = 'LlmConfigError';
    this.field = field;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LlmConfigError);
    }
  }

  /**
   * Creates error for missing API key
   * @param {string} provider - Provider name
   * @returns {LlmConfigError}
   */
  static missingApiKey(provider) {
    return new LlmConfigError(
      `API key not configured for ${provider}. Please add your API key in Settings.`,
      'apiKey'
    );
  }

  /**
   * Creates error for invalid API key
   * @param {string} provider - Provider name
   * @returns {LlmConfigError}
   */
  static invalidApiKey(provider) {
    return new LlmConfigError(
      `Invalid API key for ${provider}. Please check your API key in Settings.`,
      'apiKey'
    );
  }

  /**
   * Creates error for unsupported provider
   * @param {string} provider - Provider name
   * @returns {LlmConfigError}
   */
  static unsupportedProvider(provider) {
    return new LlmConfigError(
      `Provider "${provider}" is not supported.`,
      'provider'
    );
  }

  /**
   * Creates error for unsupported model
   * @param {string} model - Model name
   * @param {string} provider - Provider name
   * @returns {LlmConfigError}
   */
  static unsupportedModel(model, provider) {
    return new LlmConfigError(
      `Model "${model}" is not supported by ${provider}.`,
      'model'
    );
  }
}
