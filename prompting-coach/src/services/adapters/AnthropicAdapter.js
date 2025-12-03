/**
 * AnthropicAdapter
 * Adapter for Anthropic Claude API integration
 */

import { LlmApiError, LlmRateLimitError } from '../../models/errors/LlmApiError.js';
import { LlmConfigError } from '../../models/errors/LlmConfigError.js';
import { LogService } from '../LogService.js';

const API_BASE_URL = 'https://api.anthropic.com/v1';

const MODELS = {
  'claude-3-5-sonnet-20241022': { maxTokens: 200000, supportsStreaming: true },
  'claude-3-5-haiku-20241022': { maxTokens: 200000, supportsStreaming: true },
  'claude-3-opus-20240229': { maxTokens: 200000, supportsStreaming: true },
  'claude-3-sonnet-20240229': { maxTokens: 200000, supportsStreaming: true },
  'claude-3-haiku-20240307': { maxTokens: 200000, supportsStreaming: true },
};

export class AnthropicAdapter {
  /** @type {string} */
  #apiKey;

  /** @type {LogService} */
  #log;

  /**
   * Creates a new AnthropicAdapter
   * @param {string} apiKey
   */
  constructor(apiKey) {
    this.#apiKey = apiKey;
    this.#log = LogService.getInstance();
  }

  /**
   * Gets the provider name
   * @returns {string}
   */
  get provider() {
    return 'anthropic';
  }

  /**
   * Sends a message to the Anthropic Claude API
   * @param {string} message - The user message
   * @param {Object} options
   * @param {string} [options.model='claude-3-5-sonnet-20241022']
   * @param {string} [options.systemPrompt]
   * @param {number} [options.maxTokens=1000]
   * @param {number} [options.temperature=0.7]
   * @returns {Promise<Object>}
   */
  async sendMessage(message, options = {}) {
    const {
      model = 'claude-3-5-sonnet-20241022',
      systemPrompt,
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    if (!this.#apiKey) {
      throw LlmConfigError.missingApiKey('Anthropic');
    }

    const requestBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'user', content: message },
      ],
    };

    // Anthropic uses a separate system field
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const timerId = this.#log.startTimer('anthropic-request');

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.#apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(requestBody),
      });

      const responseTimeMs = this.#log.endTimer(timerId, { model });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
          throw new LlmRateLimitError('Rate limit exceeded', { retryAfter, provider: 'anthropic' });
        }
        throw await LlmApiError.fromResponse(response, 'anthropic');
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      this.#log.debug('Anthropic response received', { model, tokensUsed });

      return {
        content,
        model: data.model,
        tokensUsed,
        responseTimeMs,
        finishReason: data.stop_reason || 'unknown',
      };
    } catch (error) {
      if (error instanceof LlmApiError) {
        throw error;
      }
      this.#log.error('Anthropic request failed', { model }, error);
      throw new LlmApiError(error.message, { provider: 'anthropic' });
    }
  }

  /**
   * Validates the API key
   * @returns {Promise<boolean>}
   */
  async validateApiKey() {
    if (!this.#apiKey) {
      return false;
    }

    try {
      // Anthropic doesn't have a simple validation endpoint
      // We'll try a minimal request to check the key
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.#apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      // 200 = valid, 401 = invalid key, other errors might be rate limits etc.
      return response.ok || response.status === 429;
    } catch {
      return false;
    }
  }

  /**
   * Gets available models
   * @returns {Object[]}
   */
  getAvailableModels() {
    return Object.entries(MODELS).map(([id, info]) => ({
      id,
      name: this.#formatModelName(id),
      maxTokens: info.maxTokens,
      supportsStreaming: info.supportsStreaming,
    }));
  }

  /**
   * Formats model ID into a readable name
   * @param {string} modelId
   * @returns {string}
   */
  #formatModelName(modelId) {
    // claude-3-5-sonnet-20241022 -> Claude 3.5 Sonnet
    const parts = modelId.split('-');
    if (parts.length >= 3) {
      const version = parts[1] === '3' && parts[2] === '5' ? '3.5' : parts[1];
      const variant = parts[2] === '5' ? parts[3] : parts[2];
      return `Claude ${version} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
    }
    return modelId;
  }
}
