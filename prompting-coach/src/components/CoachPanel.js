/**
 * CoachPanel
 * Conversational coaching interface - CR001 refactor
 * Pure chat interface without wizard elements
 * 
 * @deprecated This component is deprecated in favor of the unified layout.
 * Use UnifiedView with ConversationArea instead.
 * Kept for backward compatibility and rollback capability.
 * See: specs/001-unified-layout/spec.md
 */

import { BaseComponent } from './BaseComponent.js';
import { CoachService } from '../services/CoachService.js';

export class CoachPanel extends BaseComponent {
  /** @type {CoachService} */
  #coachService;

  /** @type {import('../services/LlmService.js').LlmService} */
  #llmService;

  /** @type {import('../services/StorageService.js').StorageService} */
  #storageService;

  /** @type {boolean} */
  #isProcessing = false;

  /** @type {boolean} */
  #showResumePrompt = false;

  /** @type {import('../models/CoachingSession.js').CoachingSession|null} */
  #pendingResumeSession = null;

  /**
   * Creates a new CoachPanel
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {import('../services/LlmService.js').LlmService} llmService
   * @param {import('../services/StorageService.js').StorageService} storageService
   */
  constructor(container, appState, llmService, storageService) {
    super(container, appState);
    this.#llmService = llmService;
    this.#storageService = storageService;
    this.#coachService = new CoachService(llmService, storageService);
    this.watchState(['ui.isLoading', 'session.current', 'prompt.text']);
  }

  /**
   * Gets the CoachService instance
   * @returns {CoachService}
   */
  getCoachService() {
    return this.#coachService;
  }

  template() {
    // CR001: Check for resume prompt first
    if (this.#showResumePrompt) {
      return this.#renderResumePrompt();
    }

    const session = this.#coachService.getCurrentSession();
    const isLoading = this.appState?.get('ui.isLoading') || this.#isProcessing;
    const promptText = this.appState?.get('prompt.text') || '';
    const hasPrompt = promptText.trim().length > 0;

    // Check if LLM is configured
    const provider = this.appState?.get('settings.provider') || 'openai';
    const apiKeys = this.appState?.get('settings.apiKeys') || {};
    const isConfigured = apiKeys[provider]?.trim().length > 0;

    if (!session) {
      return this.#renderWelcome(hasPrompt, isConfigured, isLoading);
    }

    return this.#renderSession(session, isLoading);
  }

  /**
   * Renders the welcome screen when no session is active
   * @param {boolean} hasPrompt
   * @param {boolean} isConfigured
   * @param {boolean} isLoading
   * @returns {string}
   */
  #renderWelcome(hasPrompt, isConfigured, isLoading) {
    const isDisabled = !hasPrompt || !isConfigured || isLoading;
    const buttonText = isLoading ? '<span class="spinner-small"></span> Starting...' : 'Start Coaching';

    return `
      <div class="coach-panel">
        <div class="coach-welcome">
          <div class="coach-icon">🎯</div>
          <h2>Prompt Coach</h2>
          <p>Get expert guidance to improve your prompts through natural conversation.</p>
          
          <div class="coach-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">💬</span>
              <span>Natural conversation - just chat with your coach</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎓</span>
              <span>Learn prompt engineering best practices</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✨</span>
              <span>Get personalized feedback on your specific prompt</span>
            </div>
          </div>

          ${!isConfigured ? `
            <div class="config-warning">
              <span class="warning-icon">⚠️</span>
              <span>Configure your API key in Settings to start coaching.</span>
            </div>
          ` : ''}

          ${!hasPrompt ? `
            <div class="info-message">
              <span class="info-icon">ℹ️</span>
              <span>Write a prompt in the Workspace tab first, then return here to start coaching.</span>
            </div>
          ` : ''}

          <button 
            class="btn btn-primary btn-large" 
            id="start-coaching-btn"
            ${isDisabled ? 'disabled' : ''}
          >
            ${buttonText}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renders the session resume prompt
   * @returns {string}
   */
  #renderResumePrompt() {
    return `
      <div class="coach-panel">
        <div class="coach-welcome">
          <div class="coach-icon">🔄</div>
          <h2>Welcome Back!</h2>
          <p>You have an unfinished coaching session. Would you like to continue where you left off?</p>
          
          <div class="resume-actions">
            <button class="btn btn-primary" id="resume-session-btn">
              Resume Session
            </button>
            <button class="btn btn-secondary" id="start-fresh-btn">
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders an active coaching session - CR001: Chat-only interface
   * @param {import('../models/CoachingSession.js').CoachingSession} session
   * @param {boolean} isLoading
   * @returns {string}
   */
  #renderSession(session, isLoading) {
    const isComplete = session.isCompleted();

    return `
      <div class="coach-panel">
        <div class="coach-header">
          <div class="session-info">
            <span class="coach-title">🎯 Coach</span>
          </div>
          <div class="session-actions">
            ${session.isActive() ? `
              <button class="btn btn-text btn-small" id="end-session-btn" title="End Session">
                End Chat
              </button>
            ` : ''}
          </div>
        </div>

        <div class="coach-content">
          <div class="chat-container" id="chat-container">
            ${this.#renderChatHistory(session.chatHistory, isLoading)}
          </div>

          ${session.isActive() ? this.#renderChatInput(isLoading) : this.#renderSessionComplete()}
        </div>
      </div>
    `;
  }

  /**
   * Renders typing indicator while coach is thinking
   * @returns {string}
   */
  #renderTypingIndicator() {
    return `
      <div class="chat-message coach typing">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
  }

  /**
   * Renders session complete UI
   * @returns {string}
   */
  #renderSessionComplete() {
    return `
      <div class="session-complete-actions">
        <p>Session complete! Your prompt has been improved.</p>
        <button class="btn btn-primary" id="new-session-btn">
          Start New Session
        </button>
      </div>
    `;
  }

  /**
   * Renders the chat history
   * @param {import('../models/ChatMessage.js').ChatMessage[]} messages
   * @param {boolean} isLoading
   * @returns {string}
   */
  #renderChatHistory(messages, isLoading = false) {
    const hasMessages = messages && messages.length > 0;
    
    // Show typing indicator even if no messages yet (initial load)
    if (!hasMessages && !isLoading) {
      return '<div class="chat-empty">No messages yet</div>';
    }

    return `
      <div class="chat-messages" id="chat-messages">
        ${hasMessages ? messages.map(msg => this.#renderMessage(msg)).join('') : ''}
        ${isLoading ? this.#renderTypingIndicator() : ''}
      </div>
    `;
  }

  /**
   * Renders a single chat message
   * @param {import('../models/ChatMessage.js').ChatMessage} message
   * @returns {string}
   */
  #renderMessage(message) {
    const roleClass = message.role;
    const typeClass = message.messageType || 'text';

    return `
      <div class="chat-message ${roleClass} ${typeClass}">
        <div class="message-header">
          <span class="message-role">${message.role === 'coach' ? '🎯 Coach' : message.role === 'user' ? '👤 You' : '⚙️ System'}</span>
          <span class="message-time">${this.#formatTime(message.timestamp)}</span>
        </div>
        <div class="message-content">${this.#formatMessageContent(message.content)}</div>
      </div>
    `;
  }

  /**
   * Formats message content with markdown-like styling
   * @param {string} content
   * @returns {string}
   */
  #formatMessageContent(content) {
    // Basic markdown formatting
    return content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Formats a timestamp
   * @param {Date|string} timestamp
   * @returns {string}
   */
  #formatTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Renders the chat input area - CR001: Simplified, no action buttons
   * @param {boolean} isLoading
   * @returns {string}
   */
  #renderChatInput(isLoading) {
    return `
      <div class="chat-input-area">
        <div class="chat-input-row">
          <textarea 
            id="coach-message-input" 
            class="chat-input"
            placeholder="Type your message..."
            rows="2"
            ${isLoading ? 'disabled' : ''}
          ></textarea>
          <button 
            class="btn btn-icon btn-primary" 
            id="send-message-btn"
            ${isLoading ? 'disabled' : ''}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    `;
  }

  onRender() {
    // CR001: Simplified event handlers for conversational interface
    
    // Start coaching button
    this.on('#start-coaching-btn', 'click', () => this.#startCoaching());

    // End session button
    this.on('#end-session-btn', 'click', () => this.#endSession());

    // New session button (after completion)
    this.on('#new-session-btn', 'click', () => this.#startNewSession());

    // Resume/Fresh buttons
    this.on('#resume-session-btn', 'click', () => this.#resumeSession());
    this.on('#start-fresh-btn', 'click', () => this.#startFresh());

    // Send message button
    this.on('#send-message-btn', 'click', () => this.#sendMessage());

    // Message input - Enter to send
    const messageInput = this.container.querySelector('#coach-message-input');
    messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.#sendMessage();
      }
    });

    // Focus input if session is active
    if (this.#coachService.getCurrentSession()?.isActive()) {
      messageInput?.focus();
    }

    // Scroll chat to bottom
    this.#scrollChatToBottom();
  }

  /**
   * Starts a new coaching session
   */
  async #startCoaching() {
    // Guard against double-click
    if (this.#isProcessing) return;
    
    const promptText = this.appState?.get('prompt.text') || '';
    const promptId = this.appState?.get('prompt.id') || 'draft';

    if (!promptText.trim()) {
      this.log.warn('Cannot start coaching without a prompt');
      return;
    }

    // Create session immediately (no LLM call) - this switches to chat view
    this.#coachService.createSession(promptId, promptText);
    this.#isProcessing = true;
    this.render();  // Immediately shows chat view with loading indicator
    this.#scrollChatToBottom();

    try {
      // Now initialize with LLM calls (evaluation + first message)
      await this.#coachService.initializeSession(promptText);
      this.#isProcessing = false;
      this.render();
      this.#scrollChatToBottom();
    } catch (error) {
      this.#isProcessing = false;
      this.log.error('Failed to start coaching session', {}, error);
      this.appState?.setError('Failed to start coaching session: ' + error.message);
      this.render();
    }
  }

  /**
   * Ends the current session (user requested)
   */
  async #endSession() {
    const promptText = this.appState?.get('prompt.text') || '';

    this.#isProcessing = true;
    this.render();

    try {
      await this.#coachService.completeSession(promptText, true);
      this.#isProcessing = false;
      this.render();
      this.#scrollChatToBottom();
    } catch (error) {
      this.#isProcessing = false;
      this.log.error('Failed to end session', {}, error);
      this.render();
    }
  }

  /**
   * Starts a new session after completion
   */
  #startNewSession() {
    // Clear the completed session and show welcome
    this.render();
  }

  /**
   * Resumes a pending session
   */
  async #resumeSession() {
    if (this.#pendingResumeSession) {
      this.#coachService.setCurrentSession(this.#pendingResumeSession);
      this.#pendingResumeSession = null;
      this.#showResumePrompt = false;
      this.render();
      this.#scrollChatToBottom();
    }
  }

  /**
   * Starts fresh, abandoning pending session
   */
  async #startFresh() {
    if (this.#pendingResumeSession) {
      // Abandon the old session
      this.#coachService.setCurrentSession(this.#pendingResumeSession);
      await this.#coachService.abandonSession();
      this.#pendingResumeSession = null;
    }
    this.#showResumePrompt = false;
    this.render();
  }

  /**
   * Sends a chat message to the coach - CR001: Main interaction method
   */
  async #sendMessage() {
    const input = this.container.querySelector('#coach-message-input');
    const message = input?.value?.trim();

    if (!message) return;

    const promptText = this.appState?.get('prompt.text') || '';

    // Clear input immediately for responsiveness
    if (input) input.value = '';

    this.#isProcessing = true;
    this.render();
    this.#scrollChatToBottom();

    try {
      const { response, sessionComplete } = await this.#coachService.processUserMessage(message, promptText);
      this.#isProcessing = false;
      this.render();
      this.#scrollChatToBottom();
    } catch (error) {
      this.#isProcessing = false;
      this.log.error('Failed to send message', {}, error);
      this.appState?.setError('Failed to send message: ' + error.message);
      this.render();
    }
  }

  /**
   * Scrolls the chat container to the bottom
   */
  #scrollChatToBottom() {
    requestAnimationFrame(() => {
      const chatContainer = this.container.querySelector('#chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  }

  /**
   * Checks for active session on mount (CR001: Session persistence)
   */
  async checkForActiveSession() {
    // This would be called by App.js when switching to Coach tab
    // For now, the session is held in memory by CoachService
    // Full persistence implementation in Phase 4
  }
}
