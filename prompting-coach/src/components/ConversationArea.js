/**
 * ConversationArea
 * Displays chronological list of coaching messages and LLM responses
 * Scrollable center area of the unified view
 */

import { BaseComponent } from './BaseComponent.js';

export class ConversationArea extends BaseComponent {
  /** @type {Function} Callback when maximize is toggled */
  #onMaximize;

  /** @type {boolean} Whether to auto-scroll on new messages */
  #autoScroll = true;

  /**
   * Creates a ConversationArea
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {Function} options.onMaximize - Callback when maximize toggled
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#onMaximize = options.onMaximize || (() => {});
    this.watchState(['session.chatHistory', 'ui.maximizedPanel', 'ui.isLoading', 'ui.loadingType', 'ui.error']);
  }

  /**
   * Gets messages from session
   * @returns {import('../models/ChatMessage.js').ChatMessage[]}
   */
  #getMessages() {
    return this.appState?.get('session.chatHistory') || [];
  }

  /**
   * Checks if this panel is maximized
   * @returns {boolean}
   */
  isMaximized() {
    return this.appState?.get('ui.maximizedPanel') === 'conversation';
  }

  /**
   * Scrolls to the bottom of the conversation
   */
  scrollToBottom() {
    const messagesContainer = this.$('.conversation-area__messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Clears all messages (for new session)
   */
  clearMessages() {
    this.appState?.set('session.chatHistory', []);
  }

  /**
   * Renders a single message
   * @param {import('../models/ChatMessage.js').ChatMessage} message
   * @returns {string}
   */
  #renderMessage(message) {
    const isLlmResponse = message.messageType === 'llm_response';
    const roleClass = isLlmResponse ? 'message--llm-response' : `message--${message.role}`;
    
    let footerHtml = '';
    if (isLlmResponse && message.llmMetadata) {
      const { model, responseTime, tokenCount } = message.llmMetadata;
      const stats = [
        'LLM Response',
        model !== 'unknown' ? model : null,
        `${responseTime}ms`,
        tokenCount ? `${tokenCount} tokens` : null,
      ].filter(Boolean).join(' · ');
      
      footerHtml = `
        <div class="message__footer">
          <hr class="message__divider">
          <span class="message__stats">${stats}</span>
        </div>
      `;
    }

    return `
      <div class="message ${roleClass}" data-message-id="${message.id}">
        <div class="message__content markdown-content">${message.renderedContent || this.escapeHtml(message.content)}</div>
        ${footerHtml}
      </div>
    `;
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
    const messages = this.#getMessages();
    const isMaximized = this.isMaximized();
    const isLoading = this.appState?.get('ui.isLoading') || false;
    const error = this.appState?.get('ui.error');
    const maximizeLabel = isMaximized ? 'Restore' : 'Maximize';

    const messagesHtml = messages.map(msg => this.#renderMessage(msg)).join('');

    const loadingType = this.appState?.get('ui.loadingType');
    const loadingText = loadingType === 'processing' ? 'Processing...' : 'Thinking...';
    const loadingHtml = isLoading
      ? `<div class="conversation-loading">
           <div class="typing-indicator">
             <span></span><span></span><span></span>
           </div>
           <span>${loadingText}</span>
         </div>`
      : '';

    const errorHtml = error
      ? `<div class="conversation-error">
           <span class="conversation-error__icon">⚠️</span>
           <span class="conversation-error__message">${this.escapeHtml(error)}</span>
         </div>`
      : '';

    return `
      <div class="conversation-area panel ${isMaximized ? 'panel--maximized' : ''}" data-panel="conversation">
        <button 
          class="maximize-toggle conversation-area__toggle ${isMaximized ? 'maximize-toggle--active' : ''}"
          aria-label="${maximizeLabel} conversation"
          aria-pressed="${isMaximized}"
          title="${maximizeLabel}"
        >
          <span class="maximize-toggle__icon">${this.#getMaximizeIcon(isMaximized)}</span>
        </button>
        <div class="conversation-area__messages">
          ${messagesHtml}
          ${errorHtml}
          ${loadingHtml}
        </div>
      </div>
    `;
  }

  onRender() {
    // Handle maximize toggle
    this.on('.maximize-toggle', 'click', (e) => {
      e.preventDefault();
      this.#onMaximize('conversation');
    });

    // Handle scroll to detect if user scrolled up
    const messagesContainer = this.$('.conversation-area__messages');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        // If user is near bottom, enable auto-scroll
        this.#autoScroll = scrollHeight - scrollTop - clientHeight < 100;
      });
    }

    // Auto-scroll to bottom if enabled
    if (this.#autoScroll) {
      this.scrollToBottom();
    }
  }

  onStateChange(detail) {
    // Re-render on state changes
    this.render();
    
    // Auto-scroll when new messages arrive
    if (detail.path === 'session.chatHistory' && this.#autoScroll) {
      requestAnimationFrame(() => this.scrollToBottom());
    }
  }
}
