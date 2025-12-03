# LLM Service Contract

**Purpose**: Unified interface for interacting with multiple LLM providers

## Class: LlmService

### Constructor

```javascript
/**
 * Creates a new LlmService instance
 * @param {AppSettings} settings - Application settings with API keys
 */
constructor(settings)
```

### Methods

#### sendMessage

```javascript
/**
 * Sends a message to the configured LLM provider
 * @param {string} message - The user message/prompt
 * @param {Object} options - Optional configuration
 * @param {string} [options.systemPrompt] - System prompt to prepend
 * @param {AttachedFile[]} [options.files] - Files to include as context
 * @param {number} [options.maxTokens=1000] - Maximum response tokens
 * @param {number} [options.temperature=0.7] - Response randomness (0-1)
 * @returns {Promise<LlmResponse>} The LLM response
 * @throws {LlmApiError} If the API call fails
 * @throws {LlmConfigError} If API key is missing or invalid
 */
async sendMessage(message, options = {})
```

#### streamMessage

```javascript
/**
 * Streams a message response from the LLM
 * @param {string} message - The user message/prompt
 * @param {Object} options - Same as sendMessage
 * @param {function(string): void} onChunk - Callback for each chunk
 * @returns {Promise<LlmResponse>} Final complete response
 * @throws {LlmApiError} If the API call fails
 */
async streamMessage(message, options, onChunk)
```

#### validateApiKey

```javascript
/**
 * Validates the API key for a provider
 * @param {string} provider - Provider name (openai, google, anthropic, xai)
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<boolean>} True if valid
 * @throws {LlmConfigError} If validation fails
 */
async validateApiKey(provider, apiKey)
```

#### getAvailableModels

```javascript
/**
 * Gets available models for the current provider
 * @returns {Promise<ModelInfo[]>} List of available models
 */
async getAvailableModels()
```

### Response Types

```javascript
/**
 * @typedef {Object} LlmResponse
 * @property {string} content - The response text
 * @property {string} model - Model that generated the response
 * @property {number} tokensUsed - Total tokens consumed
 * @property {number} responseTimeMs - Time to generate response
 * @property {string} finishReason - Why generation stopped
 */

/**
 * @typedef {Object} ModelInfo
 * @property {string} id - Model identifier
 * @property {string} name - Display name
 * @property {number} maxTokens - Maximum context window
 * @property {boolean} supportsStreaming - Whether streaming is supported
 */
```

### Error Classes

```javascript
class LlmApiError extends Error {
  /** @type {number} HTTP status code */
  statusCode;
  /** @type {string} Provider-specific error code */
  errorCode;
  /** @type {string} Provider name */
  provider;
}

class LlmConfigError extends Error {
  /** @type {string} Configuration field that's invalid */
  field;
}

class LlmRateLimitError extends LlmApiError {
  /** @type {number} Seconds until rate limit resets */
  retryAfter;
}
```

## Provider Implementations

### OpenAI Adapter

```javascript
// Uses: openai npm package
// Endpoint: https://api.openai.com/v1/chat/completions
// Auth: Bearer token in Authorization header
// Models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
```

### Google (Gemini) Adapter

```javascript
// Uses: @google/generative-ai npm package
// Endpoint: https://generativelanguage.googleapis.com/v1beta/
// Auth: API key in x-goog-api-key header
// Models: gemini-1.5-pro, gemini-1.5-flash, gemini-pro
```

### Anthropic (Claude) Adapter

```javascript
// Uses: fetch (REST API)
// Endpoint: https://api.anthropic.com/v1/messages
// Auth: x-api-key header + anthropic-dangerous-direct-browser-access: true
// Models: claude-3-opus, claude-3-sonnet, claude-3-haiku
```

### xAI (Grok) Adapter

```javascript
// Uses: fetch (REST API)
// Endpoint: https://api.x.ai/v1/chat/completions
// Auth: Bearer token in Authorization header
// Models: grok-beta
```
