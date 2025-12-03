/**
 * LlmService
 * Unified interface for interacting with multiple LLM providers
 */

import { OpenAiAdapter } from './adapters/OpenAiAdapter.js';
import { GoogleAdapter } from './adapters/GoogleAdapter.js';
import { AnthropicAdapter } from './adapters/AnthropicAdapter.js';
import { XaiAdapter } from './adapters/XaiAdapter.js';
import { LlmConfigError } from '../models/errors/LlmConfigError.js';
import { LogService } from './LogService.js';

export class LlmService {
  /** @type {Object} */
  #settings;

  /** @type {LogService} */
  #log;

  /** @type {Map<string, Object>} */
  #adapters = new Map();

  /**
   * Creates a new LlmService
   * @param {Object} settings - Application settings with API keys
   */
  constructor(settings) {
    this.#settings = settings;
    this.#log = LogService.getInstance();
  }

  /**
   * Updates settings
   * @param {Object} settings
   */
  updateSettings(settings) {
    this.#settings = settings;
    this.#adapters.clear(); // Clear cached adapters
  }

  /**
   * Checks if the service is properly configured with an API key
   * @param {string} [provider] - Optional provider to check, defaults to current provider
   * @returns {boolean}
   */
  isConfigured(provider) {
    const providerName = provider || this.#settings.provider || 'openai';
    const apiKey = this.#settings.apiKeys?.[providerName];
    return Boolean(apiKey && apiKey.trim());
  }

  /**
   * Gets the current provider name
   * @returns {string}
   */
  getProvider() {
    return this.#settings.provider || 'openai';
  }

  /**
   * Gets or creates an adapter for the specified provider
   * @param {string} [provider]
   * @returns {Object}
   */
  #getAdapter(provider) {
    const providerName = provider || this.#settings.provider || 'openai';
    
    if (this.#adapters.has(providerName)) {
      return this.#adapters.get(providerName);
    }

    const apiKey = this.#settings.apiKeys?.[providerName];
    
    let adapter;
    switch (providerName) {
      case 'openai':
        adapter = new OpenAiAdapter(apiKey);
        break;
      case 'google':
        adapter = new GoogleAdapter(apiKey);
        break;
      case 'anthropic':
        adapter = new AnthropicAdapter(apiKey);
        break;
      case 'xai':
        adapter = new XaiAdapter(apiKey);
        break;
      default:
        throw LlmConfigError.unsupportedProvider(providerName);
    }

    this.#adapters.set(providerName, adapter);
    return adapter;
  }

  /**
   * Sends a message to the configured LLM provider
   * @param {string} message - The user message/prompt
   * @param {Object} [options]
   * @param {string} [options.systemPrompt]
   * @param {Object[]} [options.files]
   * @param {number} [options.maxTokens=1000]
   * @param {number} [options.temperature=0.7]
   * @param {string} [options.provider]
   * @param {string} [options.model]
   * @returns {Promise<Object>}
   */
  async sendMessage(message, options = {}) {
    const provider = options.provider || this.#settings.provider;
    const model = options.model || this.#settings.model;

    this.#log.debug('Sending message to LLM', { provider, model });

    const adapter = this.#getAdapter(provider);

    // Build the full message with file context if provided
    let fullMessage = message;
    if (options.files && options.files.length > 0) {
      const fileContext = this.#buildFileContext(options.files);
      fullMessage = `${fileContext}\n\n${message}`;
    }

    const result = await adapter.sendMessage(fullMessage, {
      model,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });

    this.#log.info('LLM response received', { 
      provider, 
      model: result.model, 
      tokensUsed: result.tokensUsed,
      responseTimeMs: result.responseTimeMs,
    });

    return result;
  }

  /**
   * Builds file context string for inclusion in prompt
   * @param {Object[]} files
   * @returns {string}
   */
  #buildFileContext(files) {
    if (!files || files.length === 0) return '';

    const parts = ['--- Attached Files ---'];
    
    for (const file of files) {
      parts.push(`\n### File: ${file.name}`);
      parts.push('```');
      parts.push(file.content);
      parts.push('```');
    }
    
    parts.push('\n--- End of Attached Files ---');
    
    return parts.join('\n');
  }

  /**
   * Validates the API key for a provider
   * @param {string} provider
   * @param {string} apiKey
   * @returns {Promise<boolean>}
   */
  async validateApiKey(provider, apiKey) {
    this.#log.debug('Validating API key', { provider });

    // Create a temporary adapter with the provided key
    let adapter;
    switch (provider) {
      case 'openai':
        adapter = new OpenAiAdapter(apiKey);
        break;
      case 'google':
        adapter = new GoogleAdapter(apiKey);
        break;
      case 'anthropic':
        adapter = new AnthropicAdapter(apiKey);
        break;
      case 'xai':
        adapter = new XaiAdapter(apiKey);
        break;
      default:
        throw LlmConfigError.unsupportedProvider(provider);
    }

    const isValid = await adapter.validateApiKey();
    this.#log.debug('API key validation result', { provider, isValid });
    
    return isValid;
  }

  /**
   * Gets available models for the current or specified provider
   * @param {string} [provider]
   * @returns {Object[]}
   */
  getAvailableModels(provider) {
    const adapter = this.#getAdapter(provider);
    return adapter.getAvailableModels();
  }

  /**
   * Checks if the current provider is configured
   * @returns {boolean}
   */
  isConfigured() {
    const apiKey = this.#settings.apiKeys?.[this.#settings.provider];
    return apiKey && apiKey.trim().length > 0;
  }

  /**
   * Gets the current provider name
   * @returns {string}
   */
  getCurrentProvider() {
    return this.#settings.provider || 'openai';
  }

  /**
   * Gets the current model name
   * @returns {string}
   */
  getCurrentModel() {
    return this.#settings.model || this.getDefaultModel(this.#settings.provider);
  }

  /**
   * Gets the default model for a provider
   * @param {string} [provider]
   * @returns {string}
   */
  getDefaultModel(provider) {
    const providerName = provider || this.#settings.provider || 'openai';
    switch (providerName) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'google':
        return 'gemini-1.5-flash';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'xai':
        return 'grok-beta';
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Gets all supported providers
   * @returns {Object[]}
   */
  getSupportedProviders() {
    return [
      { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4 Turbo, GPT-3.5' },
      { id: 'google', name: 'Google', description: 'Gemini 1.5 Pro, Gemini 1.5 Flash' },
      { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet, Claude 3 Opus' },
      { id: 'xai', name: 'xAI', description: 'Grok Beta, Grok 2' },
    ];
  }
}
