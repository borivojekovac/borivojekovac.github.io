/**
 * OpenAiAdapter
 * Adapter for OpenAI API integration
 */

import { LlmApiError, LlmRateLimitError } from '../../models/errors/LlmApiError.js';
import { LlmConfigError } from '../../models/errors/LlmConfigError.js';
import { LogService } from '../LogService.js';

const API_BASE_URL = 'https://api.openai.com/v1';

const MODELS = {
  'gpt-4o': { maxTokens: 128000, supportsStreaming: true },
  'gpt-4o-mini': { maxTokens: 128000, supportsStreaming: true },
  'gpt-4-turbo': { maxTokens: 128000, supportsStreaming: true },
  'gpt-3.5-turbo': { maxTokens: 16385, supportsStreaming: true },
};

export class OpenAiAdapter {
  /** @type {string} */
  #apiKey;

  /** @type {LogService} */
  #log;

  /**
   * Creates a new OpenAiAdapter
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
    return 'openai';
  }

  /**
   * Sends a message to the OpenAI API
   * @param {string} message - The user message
   * @param {Object} options
   * @param {string} [options.model='gpt-4o-mini']
   * @param {string} [options.systemPrompt]
   * @param {number} [options.maxTokens=1000]
   * @param {number} [options.temperature=0.7]
   * @returns {Promise<Object>}
   */
  async sendMessage(message, options = {}) {
    const {
      model = 'gpt-4o-mini',
      systemPrompt,
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    if (!this.#apiKey) {
      throw LlmConfigError.missingApiKey('OpenAI');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: message });

    const timerId = this.#log.startTimer('openai-request');

    try {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      const responseTimeMs = this.#log.endTimer(timerId, { model });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
          throw new LlmRateLimitError('Rate limit exceeded', { retryAfter, provider: 'openai' });
        }
        throw await LlmApiError.fromResponse(response, 'openai');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      this.#log.debug('OpenAI response received', { model, tokensUsed });

      return {
        content,
        model: data.model,
        tokensUsed,
        responseTimeMs,
        finishReason: data.choices?.[0]?.finish_reason || 'unknown',
      };
    } catch (error) {
      if (error instanceof LlmApiError) {
        throw error;
      }
      this.#log.error('OpenAI request failed', { model }, error);
      throw new LlmApiError(error.message, { provider: 'openai' });
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
      const response = await fetch(`${API_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.#apiKey}`,
        },
      });

      return response.ok;
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
      name: id,
      maxTokens: info.maxTokens,
      supportsStreaming: info.supportsStreaming,
    }));
  }
}
