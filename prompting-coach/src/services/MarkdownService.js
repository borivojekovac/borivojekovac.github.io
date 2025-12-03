/**
 * MarkdownService
 * Centralized markdown parsing and HTML sanitization service
 * Uses marked for parsing and DOMPurify for XSS protection
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { LogService } from './LogService.js';

/**
 * MarkdownService - Singleton service for markdown parsing
 */
export class MarkdownService {
  /** @type {LogService} */
  #log;

  /** @type {boolean} */
  #initialized = false;

  /**
   * Creates a new MarkdownService
   */
  constructor() {
    this.#log = LogService.getInstance();
    this.#initialize();
  }

  /**
   * Initializes marked configuration
   */
  #initialize() {
    if (this.#initialized) return;

    // Configure marked options for GFM
    marked.setOptions({
      gfm: true,           // GitHub Flavored Markdown
      breaks: true,        // GFM line breaks (single newline = <br>)
      pedantic: false,     // Don't be strict about original markdown spec
      headerIds: false,    // Don't add IDs to headers (security)
      mangle: false        // Don't mangle email addresses
    });

    // Custom link renderer for target="_blank"
    const renderer = {
      link(href, title, text) {
        // Block javascript: URLs
        if (href?.toLowerCase().startsWith('javascript:')) {
          return text;
        }
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    };

    marked.use({ renderer });
    this.#initialized = true;
    this.#log.debug('MarkdownService initialized');
  }

  /**
   * DOMPurify configuration
   * @returns {Object}
   */
  #getSanitizeConfig() {
    return {
      ADD_ATTR: ['target'],
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'b', 'i', 's', 'del',
        'code', 'pre',
        'blockquote',
        'ul', 'ol', 'li',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'input'  // For task list checkboxes
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'target', 'rel',
        'type', 'checked', 'disabled'  // For task list checkboxes
      ]
    };
  }

  /**
   * Escapes HTML to prevent XSS (fallback)
   * @param {string} text
   * @returns {string}
   */
  #escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Parse markdown text to sanitized HTML
   * @param {string} markdown - Raw markdown text
   * @returns {string} Sanitized HTML string
   */
  parse(markdown) {
    // Handle empty/null input
    if (!markdown?.trim()) {
      return '';
    }

    // Log warning for very large content
    const contentSize = markdown.length;
    if (contentSize > 50000) {
      this.#log.warn(`MarkdownService.parse: Large content detected (${contentSize} chars)`);
    }

    try {
      // Preserve empty lines by replacing them with a special marker before parsing
      // This prevents markdown from collapsing multiple newlines
      const preserved = markdown.replace(/\n\n/g, '\n&nbsp;\n');
      const rawHtml = marked.parse(preserved);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, this.#getSanitizeConfig());
      return sanitizedHtml;
    } catch (error) {
      this.#log.error('MarkdownService.parse error:', error);
      // Fallback to escaped HTML
      return this.#escapeHtml(markdown);
    }
  }

  /**
   * Check if text contains any markdown syntax
   * @param {string} text - Text to check
   * @returns {boolean} True if markdown syntax detected
   */
  hasMarkdown(text) {
    if (!text) return false;
    
    // Common markdown patterns
    const patterns = [
      /\*\*[^*]+\*\*/,           // Bold
      /\*[^*]+\*/,               // Italic
      /__[^_]+__/,               // Bold (underscore)
      /_[^_]+_/,                 // Italic (underscore)
      /~~[^~]+~~/,               // Strikethrough
      /`[^`]+`/,                 // Inline code
      /```[\s\S]*```/,           // Code block
      /^#{1,6}\s/m,              // Headings
      /^\s*[-*+]\s/m,            // Unordered list
      /^\s*\d+\.\s/m,            // Ordered list
      /^\s*>\s/m,                // Blockquote
      /\[.+\]\(.+\)/,            // Links
      /!\[.*\]\(.+\)/,           // Images
      /^\s*\|.+\|/m,             // Tables
      /^\s*[-*_]{3,}\s*$/m,      // Horizontal rule
      /^\s*-\s*\[[ x]\]/mi,      // Task list
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Parse markdown with performance logging
   * @param {string} markdown - Raw markdown text
   * @param {string} context - Context label for logging
   * @returns {string} Sanitized HTML string
   */
  parseWithTiming(markdown, context = 'unknown') {
    const start = performance.now();
    const result = this.parse(markdown);
    const duration = performance.now() - start;

    // Log if parsing takes longer than expected or content is large
    const contentSize = markdown?.length || 0;
    if (duration > 50 || contentSize > 50000) {
      this.#log.warn(`MarkdownService.parse [${context}]: ${duration.toFixed(2)}ms for ${contentSize} chars`);
    } else {
      this.#log.trace(`MarkdownService.parse [${context}]: ${duration.toFixed(2)}ms`);
    }

    return result;
  }
}

// Singleton instance
let instance = null;

/**
 * Gets the singleton MarkdownService instance
 * @returns {MarkdownService}
 */
export function getMarkdownService() {
  if (!instance) {
    instance = new MarkdownService();
  }
  return instance;
}

// Also export singleton for direct import
export const markdownService = new MarkdownService();
