/**
 * XaiAdapter
 * Adapter for xAI Grok API integration
 */

import { LlmApiError, LlmRateLimitError } from '../../models/errors/LlmApiError.js';
import { LlmConfigError } from '../../models/errors/LlmConfigError.js';
import { LogService } from '../LogService.js';

const API_BASE_URL = 'https://api.x.ai/v1';

const MODELS = {
  'grok-beta': { maxTokens: 131072, supportsStreaming: true },
  'grok-2-1212': { maxTokens: 131072, supportsStreaming: true },
  'grok-2-vision-1212': { maxTokens: 32768, supportsStreaming: true },
};

export class XaiAdapter {
  /** @type {string} */
  #apiKey;

  /** @type {LogService} */
  #log;

  /**
   * Creates a new XaiAdapter
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
    return 'xai';
  }

  /**
   * Sends a message to the xAI Grok API
   * @param {string} message - The user message
   * @param {Object} options
   * @param {string} [options.model='grok-beta']
   * @param {string} [options.systemPrompt]
   * @param {number} [options.maxTokens=1000]
   * @param {number} [options.temperature=0.7]
   * @returns {Promise<Object>}
   */
  async sendMessage(message, options = {}) {
    const {
      model = 'grok-beta',
      systemPrompt,
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    if (!this.#apiKey) {
      throw LlmConfigError.missingApiKey('xAI');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: message });

    const timerId = this.#log.startTimer('xai-request');

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
          throw new LlmRateLimitError('Rate limit exceeded', { retryAfter, provider: 'xai' });
        }
        throw await LlmApiError.fromResponse(response, 'xai');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      this.#log.debug('xAI response received', { model, tokensUsed });

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
      this.#log.error('xAI request failed', { model }, error);
      throw new LlmApiError(error.message, { provider: 'xai' });
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
    // grok-beta -> Grok Beta, grok-2-1212 -> Grok 2
    if (modelId === 'grok-beta') return 'Grok Beta';
    if (modelId === 'grok-2-1212') return 'Grok 2';
    if (modelId === 'grok-2-vision-1212') return 'Grok 2 Vision';
    return modelId;
  }
}
