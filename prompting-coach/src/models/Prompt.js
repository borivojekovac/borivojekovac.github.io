/**
 * Prompt
 * Represents the user's prompt being crafted and refined
 */

export class Prompt {
  /** @type {string} Unique identifier */
  id;

  /** @type {string} The prompt text content */
  text;

  /** @type {AttachedFile[]} Files attached as context */
  files;

  /** @type {Date} When the prompt was created */
  createdAt;

  /** @type {Date} When the prompt was last modified */
  updatedAt;

  /** @type {string} Optional title/name for the prompt */
  title;

  /**
   * Creates a new Prompt
   * @param {Object} data
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.text = data.text || '';
    this.files = data.files || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.title = data.title || '';
  }

  /**
   * Validates the prompt for testing
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (!this.text || this.text.trim().length === 0) {
      errors.push('Prompt text is required');
    }

    if (this.text && this.text.length > 50000) {
      errors.push('Prompt text exceeds maximum length of 50,000 characters');
    }

    const totalFileSize = this.files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalFileSize > 500 * 1024) {
      errors.push('Total attached files exceed 500KB limit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets character count
   * @returns {number}
   */
  getCharacterCount() {
    return this.text?.length || 0;
  }

  /**
   * Gets word count
   * @returns {number}
   */
  getWordCount() {
    if (!this.text) return 0;
    return this.text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Checks if prompt has content
   * @returns {boolean}
   */
  hasContent() {
    return this.text && this.text.trim().length > 0;
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      files: this.files,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      title: this.title,
    };
  }

  /**
   * Creates a Prompt from stored data
   * @param {Object} data
   * @returns {Prompt}
   */
  static fromJSON(data) {
    return new Prompt(data);
  }
}
