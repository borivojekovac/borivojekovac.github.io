/**
 * AttachedFile
 * Represents a file uploaded as context for the prompt
 */

export const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'text/javascript',
  'text/html',
  'text/css',
  'application/xml',
  'text/xml',
];

export const MAX_FILE_SIZE = 100 * 1024; // 100KB per file
export const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total

export class AttachedFile {
  /** @type {string} Unique identifier */
  id;

  /** @type {string} Original filename */
  name;

  /** @type {string} MIME type */
  mimeType;

  /** @type {number} File size in bytes */
  size;

  /** @type {string} File content (text) */
  content;

  /** @type {Date} When the file was attached */
  attachedAt;

  /**
   * Creates a new AttachedFile
   * @param {Object} data
   */
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || 'untitled';
    this.mimeType = data.mimeType || 'text/plain';
    this.size = data.size || 0;
    this.content = data.content || '';
    this.attachedAt = data.attachedAt ? new Date(data.attachedAt) : new Date();
  }

  /**
   * Creates an AttachedFile from a File object
   * @param {File} file
   * @returns {Promise<AttachedFile>}
   */
  static async fromFile(file) {
    const content = await file.text();
    return new AttachedFile({
      name: file.name,
      mimeType: file.type || 'text/plain',
      size: file.size,
      content,
    });
  }

  /**
   * Validates the file
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (this.size > MAX_FILE_SIZE) {
      errors.push(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024}KB`);
    }

    if (!this.isAllowedType()) {
      errors.push(`File type "${this.mimeType}" is not supported`);
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push('File is empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if the file type is allowed
   * @returns {boolean}
   */
  isAllowedType() {
    // Check exact match
    if (ALLOWED_MIME_TYPES.includes(this.mimeType)) {
      return true;
    }

    // Check by extension for common text files
    const ext = this.name.split('.').pop()?.toLowerCase();
    const textExtensions = ['txt', 'md', 'json', 'csv', 'js', 'ts', 'html', 'css', 'xml', 'yaml', 'yml', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'rb', 'php', 'sh', 'bat', 'ps1', 'sql', 'log'];
    
    return textExtensions.includes(ext);
  }

  /**
   * Gets a human-readable file size
   * @returns {string}
   */
  getFormattedSize() {
    if (this.size < 1024) {
      return `${this.size} B`;
    }
    return `${(this.size / 1024).toFixed(1)} KB`;
  }

  /**
   * Gets a preview of the content
   * @param {number} [maxLength=100]
   * @returns {string}
   */
  getPreview(maxLength = 100) {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      mimeType: this.mimeType,
      size: this.size,
      content: this.content,
      attachedAt: this.attachedAt.toISOString(),
    };
  }

  /**
   * Creates an AttachedFile from stored data
   * @param {Object} data
   * @returns {AttachedFile}
   */
  static fromJSON(data) {
    return new AttachedFile(data);
  }
}
