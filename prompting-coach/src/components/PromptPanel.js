/**
 * PromptPanel
 * Displays and allows editing of the current prompt
 * Fixed to the top of the unified view
 */

import { BaseComponent } from './BaseComponent.js';
import { MarkdownField } from './MarkdownField.js';

export class PromptPanel extends BaseComponent {
  /** @type {Function} Callback when maximize is toggled */
  #onMaximize;

  /** @type {Function} Callback when test prompt is clicked */
  #onTestPrompt;

  /** @type {MarkdownField|null} The markdown field instance */
  #markdownField = null;

  /** @type {Function|null} Callback to open file upload dialog */
  #onOpenFileUpload = null;

  /**
   * Creates a PromptPanel
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {Function} options.onMaximize - Callback when maximize toggled
   * @param {Function} options.onTestPrompt - Callback when test prompt clicked
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#onMaximize = options.onMaximize || (() => {});
    this.#onTestPrompt = options.onTestPrompt || (() => {});
    this.#onOpenFileUpload = options.onOpenFileUpload || (() => {});
    // Don't watch prompt.text - we update stats manually to avoid re-render/focus loss
    this.watchState(['ui.maximizedPanel', 'ui.isLoading', 'attachedFiles']);
  }

  /**
   * Gets current prompt text
   * @returns {string}
   */
  getPromptText() {
    // Get from MarkdownField if available, otherwise from state
    if (this.#markdownField) {
      return this.#markdownField.getValue();
    }
    return this.appState?.get('prompt.text') || '';
  }

  /**
   * Sets prompt text programmatically
   * @param {string} text
   */
  setPromptText(text) {
    this.appState?.set('prompt.text', text);
    if (this.#markdownField) {
      this.#markdownField.setValue(text);
    }
  }

  /**
   * Focuses the prompt textarea
   */
  focus() {
    if (this.#markdownField) {
      this.#markdownField.focus();
    }
  }

  /**
   * Checks if this panel is maximized
   * @returns {boolean}
   */
  isMaximized() {
    return this.appState?.get('ui.maximizedPanel') === 'prompt';
  }

  /**
   * Calculates character and word count
   * @returns {{ chars: number, words: number }}
   */
  #getStats() {
    const text = this.getPromptText();
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { chars, words };
  }

  /**
   * Gets the SVG icon for maximize/restore
   * @param {boolean} isMaximized
   * @returns {string}
   */
  #getMaximizeIcon(isMaximized) {
    if (isMaximized) {
      return `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
  }

  template() {
    const text = this.getPromptText();
    const { chars, words } = this.#getStats();
    const isMaximized = this.isMaximized();
    const isLoading = this.appState?.get('ui.isLoading') || false;
    const isPromptEmpty = !text.trim();
    const maximizeLabel = isMaximized ? 'Restore' : 'Maximize';

    const attachedFiles = this.appState?.get('attachedFiles') || [];
    const fileCount = attachedFiles.length;

    // Test button HTML
    const testButtonHtml = `
      <button 
        class="btn btn-secondary prompt-panel__test-btn" 
        id="test-prompt-btn"
        ${isPromptEmpty || isLoading ? 'disabled' : ''}
        title="${isPromptEmpty ? 'Write a prompt first' : 'Test prompt with LLM'}"
      >
        Test
      </button>
    `;

    // Attach files button HTML (small icon button for header)
    const attachButtonHtml = `
      <button 
        class="btn-icon-sm prompt-panel__attach-btn" 
        id="attach-files-btn"
        title="${fileCount > 0 ? `${fileCount} file(s) attached - click to manage` : 'Attach files'}"
        aria-label="Attach files"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
        ${fileCount > 0 ? `<span class="badge">${fileCount}</span>` : ''}
      </button>
    `;

    if (isMaximized) {
      // Maximized: full width markdown field, button below
      return `
        <div class="prompt-panel panel panel--maximized prompt-panel--maximized" data-panel="prompt">
          <div class="prompt-panel__header">
            <div class="panel__title-group">
              <span class="panel__title">Your prompt</span>
              ${attachButtonHtml}
            </div>
            <div class="panel__header-right">
              <span class="panel__stats">${chars} chars | ${words} words</span>
              <button 
                class="maximize-toggle maximize-toggle--active"
                aria-label="Restore prompt panel"
                aria-pressed="true"
                title="Restore"
              >
                <span class="maximize-toggle__icon">${this.#getMaximizeIcon(true)}</span>
              </button>
            </div>
          </div>
          <div class="prompt-panel__body">
            <div class="prompt-panel__editor" data-markdown-field></div>
            <div class="prompt-panel__footer">
              ${testButtonHtml}
            </div>
          </div>
        </div>
      `;
    }

    // Normal: markdown field with tall Test button, toggle on far right
    return `
      <div class="prompt-panel panel" data-panel="prompt">
        <div class="prompt-panel__header">
          <div class="panel__title-group">
            <span class="panel__title">Your prompt</span>
            ${attachButtonHtml}
          </div>
          <div class="panel__header-right">
            <span class="panel__stats">${chars} chars | ${words} words</span>
            <button 
              class="maximize-toggle"
              aria-label="${maximizeLabel} prompt panel"
              aria-pressed="false"
              title="${maximizeLabel}"
            >
              <span class="maximize-toggle__icon">${this.#getMaximizeIcon(false)}</span>
            </button>
          </div>
        </div>
        <div class="prompt-panel__row">
          <div class="prompt-panel__editor" data-markdown-field></div>
          ${testButtonHtml}
        </div>
      </div>
    `;
  }

  onRender() {
    // Initialize MarkdownField
    const editorContainer = this.$('.prompt-panel__editor');
    if (editorContainer) {
      // Preserve current value from existing field or get from state
      const currentValue = this.#markdownField 
        ? this.#markdownField.getValue() 
        : (this.appState?.get('prompt.text') || '');
      
      // Create new MarkdownField
      this.#markdownField = new MarkdownField(editorContainer, null, {
        value: currentValue,
        placeholder: 'Enter your prompt here...',
        rows: this.isMaximized() ? 10 : 6,
        onChange: ({ value }) => {
          this.appState?.set('prompt.text', value);
          
          // Update stats without full re-render
          const stats = this.$('.panel__stats');
          if (stats) {
            const chars = value.length;
            const words = value.trim() ? value.trim().split(/\s+/).length : 0;
            stats.textContent = `${chars} chars | ${words} words`;
          }
          
          // Update TEST button disabled state without full re-render
          const testBtn = this.$('#test-prompt-btn');
          if (testBtn) {
            const isEmpty = !value.trim();
            testBtn.disabled = isEmpty;
            testBtn.title = isEmpty ? 'Write a prompt first' : 'Test prompt with LLM';
          }
          
          this.emit('prompt:change', { 
            text: value, 
            charCount: value.length, 
            wordCount: value.trim() ? value.trim().split(/\s+/).length : 0 
          });
        }
      });
      this.#markdownField.mount();
    }

    // Handle maximize toggle
    this.on('.maximize-toggle', 'click', (e) => {
      e.preventDefault();
      this.#onMaximize('prompt');
    });

    // Handle test prompt button
    this.on('#test-prompt-btn', 'click', (e) => {
      e.preventDefault();
      if (!this.getPromptText().trim()) return;
      this.#onTestPrompt();
      this.emit('prompt:test');
    });

    // Handle attach files button - opens dialog
    this.on('#attach-files-btn', 'click', (e) => {
      e.preventDefault();
      this.#onOpenFileUpload();
    });
  }

  onStateChange(detail) {
    // Re-render for maximize state changes, loading state, and file count changes
    if (detail.path === 'ui.maximizedPanel' || detail.path === 'ui.isLoading' || detail.path === 'attachedFiles') {
      // For attachedFiles, just update the badge without full re-render
      if (detail.path === 'attachedFiles') {
        const files = detail.newValue || [];
        const badge = this.$('.prompt-panel__attach-btn .badge');
        const btn = this.$('#attach-files-btn');
        if (files.length > 0) {
          if (badge) {
            badge.textContent = files.length;
          } else if (btn) {
            const badgeEl = document.createElement('span');
            badgeEl.className = 'badge';
            badgeEl.textContent = files.length;
            btn.appendChild(badgeEl);
          }
        } else if (badge) {
          badge.remove();
        }
      } else {
        this.render();
      }
    }
  }
}
