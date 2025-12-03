/**
 * MarkdownField
 * Editable markdown field with preview toggle
 * Shows raw markdown when focused, rendered preview when unfocused
 */

import { BaseComponent } from './BaseComponent.js';
import { markdownService } from '../services/MarkdownService.js';

export class MarkdownField extends BaseComponent {
  /** @type {boolean} Whether field is in editing mode */
  #isEditing = false;

  /** @type {string} Current raw markdown value */
  #value = '';

  /** @type {string} Cached rendered HTML */
  #renderedHtml = '';

  /** @type {string} Placeholder text */
  #placeholder = '';

  /** @type {string} Additional CSS class */
  #className = '';

  /** @type {number} Textarea rows */
  #rows = 3;

  /** @type {boolean} Whether field is disabled */
  #disabled = false;

  /** @type {Function|null} onChange callback */
  #onChange = null;

  /** @type {Function|null} onFocus callback */
  #onFocus = null;

  /** @type {Function|null} onBlur callback */
  #onBlur = null;

  /**
   * Creates a MarkdownField
   * @param {HTMLElement} container - DOM container
   * @param {import('../state/AppState.js').AppState} appState - Application state (can be null)
   * @param {Object} options
   * @param {string} options.value - Initial markdown text
   * @param {string} options.placeholder - Placeholder text
   * @param {string} options.className - Additional CSS class
   * @param {number} options.rows - Textarea rows (default: 3)
   * @param {boolean} options.disabled - Disable editing
   * @param {Function} options.onChange - Called when value changes
   * @param {Function} options.onFocus - Called when field gains focus
   * @param {Function} options.onBlur - Called when field loses focus
   */
  constructor(container, appState = null, options = {}) {
    super(container, appState);
    
    this.#value = options.value || '';
    this.#placeholder = options.placeholder || '';
    this.#className = options.className || '';
    this.#rows = options.rows || 3;
    this.#disabled = options.disabled || false;
    this.#onChange = options.onChange || null;
    this.#onFocus = options.onFocus || null;
    this.#onBlur = options.onBlur || null;

    // Pre-render the initial content
    this.#updateRenderedHtml();
  }

  /**
   * Updates the cached rendered HTML
   */
  #updateRenderedHtml() {
    if (this.#value?.trim()) {
      this.#renderedHtml = markdownService.parse(this.#value);
    } else {
      this.#renderedHtml = '';
    }
  }

  /**
   * Get current raw markdown value
   * @returns {string}
   */
  getValue() {
    return this.#value;
  }

  /**
   * Set markdown value programmatically
   * @param {string} value - New markdown text
   * @param {boolean} rerender - Whether to re-render (default: true)
   */
  setValue(value, rerender = true) {
    this.#value = value || '';
    this.#updateRenderedHtml();
    if (rerender && this.isMounted) {
      this.render();
    }
  }

  /**
   * Focus the textarea (switches to edit mode)
   */
  focus() {
    if (this.#disabled) return;
    this.#isEditing = true;
    this.render();
    // Focus the textarea after render
    requestAnimationFrame(() => {
      const textarea = this.$('.markdown-field__textarea');
      if (textarea) {
        textarea.focus();
        // Place cursor at end
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }
    });
  }

  /**
   * Blur the textarea (switches to preview mode)
   */
  blur() {
    const textarea = this.$('.markdown-field__textarea');
    if (textarea) {
      textarea.blur();
    }
  }

  /**
   * Check if currently in edit mode
   * @returns {boolean}
   */
  isEditing() {
    return this.#isEditing;
  }

  /**
   * Enable or disable the field
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    this.#disabled = disabled;
    if (this.isMounted) {
      this.render();
    }
  }

  /**
   * Handles transition to edit mode
   */
  #handleFocus() {
    if (this.#disabled || this.#isEditing) return;
    
    this.#isEditing = true;
    this.render();
    
    // Focus textarea after render
    requestAnimationFrame(() => {
      const textarea = this.$('.markdown-field__textarea');
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }
    });

    // Emit event
    this.emit('markdown:focus', { value: this.#value });
    if (this.#onFocus) {
      this.#onFocus({ value: this.#value });
    }
  }

  /**
   * Handles transition to preview mode
   */
  #handleBlur() {
    if (!this.#isEditing) return;

    // Get latest value from textarea
    const textarea = this.$('.markdown-field__textarea');
    if (textarea) {
      this.#value = textarea.value;
    }

    this.#isEditing = false;
    this.#updateRenderedHtml();
    this.render();

    // Emit event
    this.emit('markdown:blur', { value: this.#value, html: this.#renderedHtml });
    if (this.#onBlur) {
      this.#onBlur({ value: this.#value, html: this.#renderedHtml });
    }
  }

  /**
   * Handles input changes
   * @param {Event} e
   */
  #handleInput(e) {
    this.#value = e.target.value;
    
    // Emit event
    this.emit('markdown:change', { value: this.#value });
    if (this.#onChange) {
      this.#onChange({ value: this.#value });
    }
  }

  /**
   * Handles keydown events
   * @param {KeyboardEvent} e
   */
  #handleKeydown(e) {
    // Escape key blurs the field
    if (e.key === 'Escape') {
      e.preventDefault();
      this.#handleBlur();
    }
  }

  /**
   * Escapes HTML for safe display
   * @param {string} str
   * @returns {string}
   */
  #escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  template() {
    const isEmpty = !this.#value?.trim();
    const stateClass = this.#isEditing ? 'markdown-field--editing' : 'markdown-field--preview';
    const emptyClass = isEmpty ? 'markdown-field--empty' : '';
    const disabledClass = this.#disabled ? 'markdown-field--disabled' : '';

    if (this.#isEditing) {
      // Edit mode: show textarea
      return `
        <div class="markdown-field ${stateClass} ${emptyClass} ${disabledClass} ${this.#className}">
          <textarea 
            class="markdown-field__textarea"
            placeholder="${this.#escapeHtml(this.#placeholder)}"
            rows="${this.#rows}"
            aria-label="${this.#escapeHtml(this.#placeholder)}"
            ${this.#disabled ? 'disabled' : ''}
          >${this.#escapeHtml(this.#value)}</textarea>
        </div>
      `;
    }

    // Preview mode: show rendered content or placeholder
    const displayContent = isEmpty 
      ? this.#escapeHtml(this.#placeholder)
      : this.#renderedHtml;

    return `
      <div class="markdown-field ${stateClass} ${emptyClass} ${disabledClass} ${this.#className}">
        <div 
          class="markdown-field__preview ${isEmpty ? 'markdown-field__placeholder' : 'markdown-content'}"
          tabindex="${this.#disabled ? '-1' : '0'}"
          role="textbox"
          aria-readonly="true"
          aria-label="${this.#escapeHtml(this.#placeholder)}"
        >${displayContent}</div>
      </div>
    `;
  }

  onRender() {
    if (this.#isEditing) {
      // Bind textarea events
      const textarea = this.$('.markdown-field__textarea');
      if (textarea) {
        textarea.addEventListener('blur', () => this.#handleBlur());
        textarea.addEventListener('input', (e) => this.#handleInput(e));
        textarea.addEventListener('keydown', (e) => this.#handleKeydown(e));
      }
    } else {
      // Bind preview click/focus events
      const preview = this.$('.markdown-field__preview');
      if (preview) {
        preview.addEventListener('click', () => this.#handleFocus());
        preview.addEventListener('focus', () => this.#handleFocus());
      }
    }
  }
}
