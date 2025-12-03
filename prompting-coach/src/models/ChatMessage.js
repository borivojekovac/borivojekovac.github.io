/**
 * ChatMessage
 * Represents a message in the coaching conversation
 */

import { markdownService } from '../services/MarkdownService.js';

export class ChatMessage {
  /** @type {string} Unique identifier */
  id;

  /** @type {'user'|'coach'|'system'} Who sent the message */
  role;

  /** @type {string} Message content */
  content;

  /** @type {Date} When the message was sent */
  timestamp;

  /** @type {string|null} Related principle ID if applicable */
  principleId;

  /** @type {'text'|'evaluation'|'suggestion'|'summary'|'llm_response'} Message type */
  messageType;

  /** @type {Object|null} LLM metadata for llm_response type */
  llmMetadata;

  /** @type {string} Rendered HTML content for display */
  renderedContent;

  /**
   * Creates a new ChatMessage
   * @param {Object} data
   */
  constructor(data = {}) {
    this.id = data.id || this.#generateId();
    this.role = data.role || 'user';
    this.content = data.content || '';
    this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    this.principleId = data.principleId || null;
    this.messageType = data.messageType || 'text';
    this.llmMetadata = data.llmMetadata || null;
    
    // Compute rendered content from markdown
    this.renderedContent = this.#renderContent();
  }

  /**
   * Renders content as sanitized HTML
   * @returns {string}
   */
  #renderContent() {
    if (!this.content) return '';
    try {
      return markdownService.parse(this.content);
    } catch (error) {
      // Fallback to escaped content
      const div = document.createElement('div');
      div.textContent = this.content;
      return div.innerHTML;
    }
  }

  /**
   * Updates the content and re-renders
   * @param {string} newContent
   */
  updateContent(newContent) {
    this.content = newContent;
    this.renderedContent = this.#renderContent();
  }

  /**
   * Generates a unique ID
   * @returns {string}
   */
  #generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Checks if this is a user message
   * @returns {boolean}
   */
  isFromUser() {
    return this.role === 'user';
  }

  /**
   * Checks if this is a coach message
   * @returns {boolean}
   */
  isFromCoach() {
    return this.role === 'coach';
  }

  /**
   * Checks if this is a system message
   * @returns {boolean}
   */
  isSystem() {
    return this.role === 'system';
  }

  /**
   * Gets a preview of the content
   * @param {number} maxLength
   * @returns {string}
   */
  getPreview(maxLength = 100) {
    if (this.content.length <= maxLength) return this.content;
    return this.content.slice(0, maxLength) + '...';
  }

  /**
   * Gets formatted timestamp
   * @returns {string}
   */
  getFormattedTime() {
    return this.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      principleId: this.principleId,
      messageType: this.messageType,
      llmMetadata: this.llmMetadata,
    };
  }

  /**
   * Checks if this is an LLM response message
   * @returns {boolean}
   */
  isLlmResponse() {
    return this.messageType === 'llm_response';
  }

  /**
   * Creates a ChatMessage from stored data
   * @param {Object} data
   * @returns {ChatMessage}
   */
  static fromJSON(data) {
    return new ChatMessage(data);
  }

  /**
   * Creates a user message
   * @param {string} content
   * @param {string|null} principleId
   * @returns {ChatMessage}
   */
  static createUserMessage(content, principleId = null) {
    return new ChatMessage({
      role: 'user',
      content,
      principleId,
      messageType: 'text',
    });
  }

  /**
   * Creates a coach message
   * @param {string} content
   * @param {string|null} principleId
   * @param {'text'|'evaluation'|'suggestion'|'summary'} messageType
   * @returns {ChatMessage}
   */
  static createCoachMessage(content, principleId = null, messageType = 'text') {
    return new ChatMessage({
      role: 'coach',
      content,
      principleId,
      messageType,
    });
  }

  /**
   * Creates a system message
   * @param {string} content
   * @returns {ChatMessage}
   */
  static createSystemMessage(content) {
    return new ChatMessage({
      role: 'system',
      content,
      messageType: 'text',
    });
  }

  /**
   * Creates an LLM response message
   * @param {string} content - The LLM response content
   * @param {Object} metadata - LLM metadata (provider, model, responseTime, tokenCount)
   * @returns {ChatMessage}
   */
  static createLlmResponse(content, metadata = {}) {
    return new ChatMessage({
      role: 'system',
      content,
      messageType: 'llm_response',
      llmMetadata: {
        provider: metadata.provider || 'unknown',
        model: metadata.model || 'unknown',
        responseTime: metadata.responseTime || 0,
        tokenCount: metadata.tokenCount || 0,
      },
    });
  }
}
