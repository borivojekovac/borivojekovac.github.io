/**
 * GoogleAdapter
 * Adapter for Google Gemini API integration
 */

import { LlmApiError, LlmRateLimitError } from '../../models/errors/LlmApiError.js';
import { LlmConfigError } from '../../models/errors/LlmConfigError.js';
import { LogService } from '../LogService.js';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const MODELS = {
  'gemini-1.5-pro': { maxTokens: 1048576, supportsStreaming: true },
  'gemini-1.5-flash': { maxTokens: 1048576, supportsStreaming: true },
  'gemini-pro': { maxTokens: 32768, supportsStreaming: true },
};

export class GoogleAdapter {
  /** @type {string} */
  #apiKey;

  /** @type {LogService} */
  #log;

  /**
   * Creates a new GoogleAdapter
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
    return 'google';
  }

  /**
   * Sends a message to the Google Gemini API
   * @param {string} message - The user message
   * @param {Object} options
   * @param {string} [options.model='gemini-1.5-flash']
   * @param {string} [options.systemPrompt]
   * @param {number} [options.maxTokens=1000]
   * @param {number} [options.temperature=0.7]
   * @returns {Promise<Object>}
   */
  async sendMessage(message, options = {}) {
    const {
      model = 'gemini-1.5-flash',
      systemPrompt,
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    if (!this.#apiKey) {
      throw LlmConfigError.missingApiKey('Google');
    }

    const contents = [];
    
    // Gemini uses a different structure for system prompts
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `System instruction: ${systemPrompt}\n\nUser message: ${message}` }],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const timerId = this.#log.startTimer('google-request');

    try {
      const response = await fetch(
        `${API_BASE_URL}/models/${model}:generateContent?key=${this.#apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature,
            },
          }),
        }
      );

      const responseTimeMs = this.#log.endTimer(timerId, { model });

      if (!response.ok) {
        if (response.status === 429) {
          throw new LlmRateLimitError('Rate limit exceeded', { retryAfter: 60, provider: 'google' });
        }
        throw await LlmApiError.fromResponse(response, 'google');
      }

      const data = await response.json();
      
      // Handle blocked content
      if (data.promptFeedback?.blockReason) {
        throw new LlmApiError(`Content blocked: ${data.promptFeedback.blockReason}`, { 
          provider: 'google',
          statusCode: 400,
        });
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = (data.usageMetadata?.promptTokenCount || 0) + 
                         (data.usageMetadata?.candidatesTokenCount || 0);
      const finishReason = data.candidates?.[0]?.finishReason || 'unknown';

      this.#log.debug('Google response received', { model, tokensUsed });

      return {
        content,
        model,
        tokensUsed,
        responseTimeMs,
        finishReason: finishReason.toLowerCase(),
      };
    } catch (error) {
      if (error instanceof LlmApiError) {
        throw error;
      }
      this.#log.error('Google request failed', { model }, error);
      throw new LlmApiError(error.message, { provider: 'google' });
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
      const response = await fetch(
        `${API_BASE_URL}/models?key=${this.#apiKey}`,
        {
          method: 'GET',
        }
      );

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
