/**
 * InputPanel
 * User input area with send button
 * Fixed to the bottom of the unified view
 */

import { BaseComponent } from './BaseComponent.js';
import { MarkdownField } from './MarkdownField.js';

export class InputPanel extends BaseComponent {
  /** @type {Function} Callback when maximize is toggled */
  #onMaximize;

  /** @type {Function} Callback when message is sent */
  #onSendMessage;

  /** @type {MarkdownField|null} The markdown field instance */
  #markdownField = null;

  /** @type {boolean} Flag to clear input on next render */
  #shouldClearOnRender = false;

  /**
   * Creates an InputPanel
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {Function} options.onMaximize - Callback when maximize toggled
   * @param {Function} options.onSendMessage - Callback when message sent
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#onMaximize = options.onMaximize || (() => {});
    this.#onSendMessage = options.onSendMessage || (() => {});
    // Note: Do NOT watch ui.inputText - it causes re-render on every keystroke, losing focus
    // Watch ui.isNewSession to update default text when new session starts
    this.watchState(['ui.maximizedPanel', 'ui.isLoading', 'ui.isNewSession', 'session.principlesPassed', 'session.principlesTotal', 'session.chatHistory']);
  }

  /**
   * Gets the assessment status text
   * @returns {string}
   */
  #getAssessmentStatus() {
    const passed = this.appState?.get('session.principlesPassed') || 0;
    const total = this.appState?.get('session.principlesTotal') || 0;
    
    if (total === 0) {
      return 'Not assessed';
    }
    return `${passed}/${total} passed`;
  }

  /**
   * Gets current input text
   * @returns {string}
   */
  getInputText() {
    if (this.#markdownField) {
      return this.#markdownField.getValue();
    }
    const inputEl = this.$('.input-panel__input') || this.$('.input-panel__textarea');
    return inputEl?.value || '';
  }

  /**
   * Clears the input field
   */
  clearInput() {
    // Set flag so next render uses empty value
    this.#shouldClearOnRender = true;
    
    // Persist empty string (not null) to indicate "explicitly cleared"
    this.appState?.set('ui.inputText', '');
    
    if (this.#markdownField) {
      this.#markdownField.setValue('');
      return;
    }
    const inputEl = this.$('.input-panel__input') || this.$('.input-panel__textarea');
    if (inputEl) {
      inputEl.value = '';
    }
  }

  /**
   * Focuses the input field
   */
  focus() {
    if (this.#markdownField) {
      this.#markdownField.focus();
      return;
    }
    const inputEl = this.$('.input-panel__input') || this.$('.input-panel__textarea');
    inputEl?.focus();
  }

  /**
   * Checks if this panel is maximized
   * @returns {boolean}
   */
  isMaximized() {
    return this.appState?.get('ui.maximizedPanel') === 'input';
  }

  /**
   * Handles sending a message
   */
  #handleSend() {
    const text = this.getInputText().trim();
    if (!text) return;

    // Clear new session flag when sending
    this.appState?.set('ui.isNewSession', false);
    
    this.clearInput();
    this.#onSendMessage(text);
    this.emit('input:send', { text });
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
    const isMaximized = this.isMaximized();
    const isLoading = this.appState?.get('ui.isLoading') || false;
    const maximizeLabel = isMaximized ? 'Restore' : 'Maximize';
    
    // Get persisted input text
    const persistedInputText = this.appState?.get('ui.inputText');
    const isNewSession = this.appState?.get('ui.isNewSession') === true;
    
    this.log.debug('InputPanel.template', { persistedInputText, isNewSession });
    
    // Determine what text to show:
    // - If there's actual persisted text, use it
    // - If it's a new session (flag set), show the default prompt
    // - Otherwise show empty
    let defaultText = '';
    if (persistedInputText && persistedInputText.trim()) {
      defaultText = persistedInputText;
    } else if (isNewSession) {
      defaultText = "Let's improve my prompt!";
    }
    
    this.log.debug('InputPanel defaultText', { defaultText });

    // Send button HTML
    const sendButtonHtml = `
      <button 
        class="btn btn-primary input-panel__send-btn" 
        id="send-btn"
        ${isLoading ? 'disabled' : ''}
        title="Send message (Enter)"
      >
        Send
      </button>
    `;

    if (isMaximized) {
      // Maximized: full width markdown field, button below
      const assessmentStatus = this.#getAssessmentStatus();
      
      return `
        <div class="input-panel panel panel--maximized input-panel--maximized" data-panel="input">
          <div class="input-panel__header">
            <span class="panel__title">Chat with coach</span>
            <div class="panel__header-right">
              <span class="panel__stats">${assessmentStatus}</span>
              <button 
                class="maximize-toggle maximize-toggle--active"
                aria-label="Restore input"
                aria-pressed="true"
                title="Restore"
              >
                <span class="maximize-toggle__icon">${this.#getMaximizeIcon(true)}</span>
              </button>
            </div>
          </div>
          <div class="input-panel__body">
            <div class="input-panel__editor" data-markdown-field data-default="${this.escapeHtml(defaultText)}"></div>
            <div class="input-panel__footer">
              ${sendButtonHtml}
            </div>
          </div>
        </div>
      `;
    }

    // Normal: header with title, stats and toggle, then markdown field row with send button
    const assessmentStatus = this.#getAssessmentStatus();
    
    return `
      <div class="input-panel panel" data-panel="input">
        <div class="input-panel__header">
          <span class="panel__title">Chat with coach</span>
          <div class="panel__header-right">
            <span class="panel__stats">${assessmentStatus}</span>
            <button 
              class="maximize-toggle"
              aria-label="${maximizeLabel} input"
              aria-pressed="false"
              title="${maximizeLabel}"
            >
              <span class="maximize-toggle__icon">${this.#getMaximizeIcon(false)}</span>
            </button>
          </div>
        </div>
        <div class="input-panel__row">
          <div class="input-panel__editor" data-markdown-field data-default="${this.escapeHtml(defaultText)}"></div>
          ${sendButtonHtml}
        </div>
      </div>
    `;
  }

  onRender() {
    // Initialize MarkdownField
    const editorContainer = this.$('.input-panel__editor');
    if (editorContainer) {
      // Get default text from data attribute
      const defaultText = editorContainer.dataset.default || '';
      const isNewSession = this.appState?.get('ui.isNewSession') === true;
      
      // Determine value: clear if flagged, use default for new session, otherwise preserve
      let currentValue;
      if (this.#shouldClearOnRender) {
        currentValue = '';
        this.#shouldClearOnRender = false; // Reset flag
        // Note: ui.inputText is already set to '' in clearInput()
      } else if (isNewSession && defaultText) {
        // New session - use the default text
        currentValue = defaultText;
        this.log.debug('Using default text for new session', { defaultText });
      } else {
        currentValue = this.#markdownField 
          ? this.#markdownField.getValue() 
          : defaultText;
      }
      
      // Create new MarkdownField
      this.#markdownField = new MarkdownField(editorContainer, null, {
        value: currentValue,
        placeholder: 'Type a message...',
        rows: this.isMaximized() ? 10 : 4,
        disabled: this.appState?.get('ui.isLoading') || false,
        onChange: ({ value }) => {
          // Clear new session flag once user starts typing
          if (this.appState?.get('ui.isNewSession')) {
            this.appState?.set('ui.isNewSession', false);
          }
          // Persist input text to AppState on every change
          this.appState?.set('ui.inputText', value);
        }
      });
      this.#markdownField.mount();

      // Handle Ctrl+Enter to send from MarkdownField
      editorContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          this.#handleSend();
        }
      });
    }

    // Handle maximize toggle
    this.on('.maximize-toggle', 'click', (e) => {
      e.preventDefault();
      this.#onMaximize('input');
    });

    // Handle send button
    this.on('#send-btn', 'click', (e) => {
      e.preventDefault();
      this.#handleSend();
    });
  }
}
