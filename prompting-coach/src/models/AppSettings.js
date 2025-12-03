/**
 * AppSettings
 * Represents user preferences and configuration
 */

export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  google: {
    id: 'google',
    name: 'Google (Gemini)',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    defaultModel: 'gemini-1.5-flash',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    models: ['grok-beta', 'grok-2-1212', 'grok-2-vision-1212'],
    defaultModel: 'grok-beta',
  },
};

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'];
export const THEMES = ['light', 'dark', 'system'];

export class AppSettings {
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

  /**
   * Creates new AppSettings
   * @param {Object} data
   */
  constructor(data = {}) {
    this.provider = data.provider || 'openai';
    this.model = data.model || PROVIDERS[this.provider]?.defaultModel || 'gpt-4o-mini';
    this.apiKeys = data.apiKeys || {};
    this.logLevel = data.logLevel || 'info';
    this.theme = data.theme || 'system';
    this.autoSave = data.autoSave !== false;
  }

  /**
   * Gets the API key for the current provider
   * @returns {string|null}
   */
  getCurrentApiKey() {
    return this.apiKeys[this.provider] || null;
  }

  /**
   * Sets the API key for a provider
   * @param {string} provider
   * @param {string} apiKey
   */
  setApiKey(provider, apiKey) {
    this.apiKeys[provider] = apiKey;
  }

  /**
   * Checks if the current provider has an API key configured
   * @returns {boolean}
   */
  hasApiKey() {
    const key = this.getCurrentApiKey();
    return key && key.trim().length > 0;
  }

  /**
   * Gets available models for the current provider
   * @returns {string[]}
   */
  getAvailableModels() {
    return PROVIDERS[this.provider]?.models || [];
  }

  /**
   * Gets provider info
   * @param {string} [providerId]
   * @returns {Object|null}
   */
  getProviderInfo(providerId) {
    return PROVIDERS[providerId || this.provider] || null;
  }

  /**
   * Validates settings
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (!PROVIDERS[this.provider]) {
      errors.push(`Invalid provider: ${this.provider}`);
    }

    if (!LOG_LEVELS.includes(this.logLevel)) {
      errors.push(`Invalid log level: ${this.logLevel}`);
    }

    if (!THEMES.includes(this.theme)) {
      errors.push(`Invalid theme: ${this.theme}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      provider: this.provider,
      model: this.model,
      apiKeys: this.apiKeys,
      logLevel: this.logLevel,
      theme: this.theme,
      autoSave: this.autoSave,
    };
  }

  /**
   * Creates AppSettings from stored data
   * @param {Object} data
   * @returns {AppSettings}
   */
  static fromJSON(data) {
    return new AppSettings(data);
  }

  /**
   * Gets all available providers
   * @returns {Object[]}
   */
  static getAllProviders() {
    return Object.values(PROVIDERS);
  }
}
