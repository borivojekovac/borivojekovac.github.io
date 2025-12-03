/**
 * UnifiedView
 * Main container that orchestrates the three-panel layout
 * Replaces the tab-based Workspace/Coach layout
 */

import { BaseComponent } from './BaseComponent.js';
import { PromptPanel } from './PromptPanel.js';
import { ConversationArea } from './ConversationArea.js';
import { InputPanel } from './InputPanel.js';
import { BurgerMenu } from './BurgerMenu.js';
import { HistoryDialog } from './HistoryDialog.js';
import { FileUploadDialog } from './FileUploadDialog.js';
import { getTotalPrinciples } from '../config/principles.js';
import { CoachingSession } from '../models/CoachingSession.js';

export class UnifiedView extends BaseComponent {
  /** @type {PromptPanel|null} */
  #promptPanel = null;

  /** @type {ConversationArea|null} */
  #conversationArea = null;

  /** @type {InputPanel|null} */
  #inputPanel = null;

  /** @type {import('../services/CoachService.js').CoachService|null} */
  #coachService = null;

  /** @type {import('../services/LlmService.js').LlmService|null} */
  #llmService = null;

  /** @type {import('../services/StorageService.js').StorageService|null} */
  #storageService = null;

  /** @type {BurgerMenu|null} */
  #burgerMenu = null;

  /** @type {HistoryDialog|null} */
  #historyDialog = null;

  /** @type {FileUploadDialog|null} */
  #fileUploadDialog = null;

  /** @type {Function|null} Callback to open settings dialog */
  #onOpenSettings = null;

  /**
   * Creates a UnifiedView
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {import('../services/CoachService.js').CoachService} options.coachService
   * @param {import('../services/LlmService.js').LlmService} options.llmService
   * @param {import('../services/StorageService.js').StorageService} options.storageService
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#coachService = options.coachService || null;
    this.#llmService = options.llmService || null;
    this.#storageService = options.storageService || null;
    this.#onOpenSettings = options.onOpenSettings || null;
    this.watchState(['ui.maximizedPanel']);
  }

  /**
   * Maximize a specific panel
   * @param {string} panelId - 'prompt' | 'conversation' | 'input'
   */
  maximizePanel(panelId) {
    const currentMaximized = this.appState?.get('ui.maximizedPanel');
    
    if (currentMaximized === panelId) {
      // Already maximized, restore
      this.restorePanel();
    } else {
      // Maximize this panel
      this.appState?.set('ui.maximizedPanel', panelId);
      this.log.debug('Panel maximized', { panelId });
      this.emit('panel:maximize', { panelId });
    }
  }

  /**
   * Restore the currently maximized panel
   */
  restorePanel() {
    this.appState?.set('ui.maximizedPanel', null);
    this.log.debug('Panel restored');
    this.emit('panel:restore');
  }

  /**
   * Check if a specific panel is maximized
   * @param {string} panelId
   * @returns {boolean}
   */
  isPanelMaximized(panelId) {
    return this.appState?.get('ui.maximizedPanel') === panelId;
  }

  /**
   * Syncs the session's chat history and assessment status to AppState
   */
  #syncSessionState() {
    const session = this.#coachService?.getCurrentSession();
    if (session) {
      // Sync chat history - preserve welcome message if it exists
      const currentHistory = this.appState?.get('session.chatHistory') || [];
      const sessionHistory = session.chatHistory || [];
      
      // Find welcome message (first coach message before any user messages)
      const welcomeMessage = currentHistory.length > 0 && 
        currentHistory[0].role === 'coach' && 
        !sessionHistory.some(m => m.id === currentHistory[0].id)
          ? currentHistory[0] 
          : null;
      
      // Merge: welcome message + session history
      const mergedHistory = welcomeMessage 
        ? [welcomeMessage, ...sessionHistory]
        : sessionHistory;
      
      this.appState?.set('session.chatHistory', mergedHistory);
      
      // Sync assessment status
      const passed = session.getPassedCount?.() || 0;
      const total = getTotalPrinciples() || 15;
      this.appState?.set('session.principlesPassed', passed);
      this.appState?.set('session.principlesTotal', total);
      
      // Sync prompt text - use latest evaluated text or initial
      const promptText = session.promptBaseline?.lastEvaluatedText || session.initialPromptText || '';
      if (promptText) {
        this.appState?.set('prompt.text', promptText);
        // Also update PromptPanel's MarkdownField directly
        if (this.#promptPanel) {
          this.#promptPanel.setPromptText(promptText);
        }
        this.log.debug('Prompt text restored', { length: promptText.length });
      }
      
      // Clear input text and new session flag when loading existing session
      this.appState?.set('ui.inputText', '');
      this.appState?.set('ui.isNewSession', false);
      
      // Scroll chat to bottom after loading session
      this.#scrollChatToBottom();
    }
  }
  
  /**
   * Scrolls the chat panel to the bottom
   */
  #scrollChatToBottom() {
    requestAnimationFrame(() => {
      const chatContainer = this.container.querySelector('.conversation-area__messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  }
  
  /**
   * @deprecated Use #syncSessionState instead
   */
  #syncChatHistory() {
    this.#syncSessionState();
  }

  /**
   * Handles sending a message to the coach
   * @param {string} text
   */
  async #handleSendMessage(text) {
    if (!this.#coachService) {
      this.log.warn('CoachService not available');
      return;
    }

    try {
      const currentPromptText = this.appState?.get('prompt.text') || '';
      const isNewSession = !this.#coachService.getCurrentSession();

      // Add user message to chat history IMMEDIATELY (before any processing)
      const { ChatMessage } = await import('../models/ChatMessage.js');
      const userMessage = ChatMessage.createUserMessage(text);
      const chatHistory = this.appState?.get('session.chatHistory') || [];
      this.appState?.set('session.chatHistory', [...chatHistory, userMessage]);
      
      // Scroll to show user message
      this.#scrollChatToBottom();

      // Set loading state immediately so user sees "Thinking..."
      this.appState?.set('ui.loadingType', 'thinking');
      this.appState?.setLoading(true);

      if (isNewSession) {
        // New session: create + evaluate + respond in one go
        const promptId = this.appState?.get('prompt.id') || 'draft';
        this.#coachService.createSession(promptId, currentPromptText);
        this.log.info('Initializing new coaching session with first message');
        
        // This evaluates the prompt AND generates a response that acknowledges the user's message
        await this.#coachService.initializeWithFirstMessage(text, currentPromptText);
      } else {
        // Existing session: process message normally
        await this.#coachService.processUserMessage(text, currentPromptText);
      }
      
      // Sync full chat history (including coach response) to AppState
      this.#syncSessionState();
      
      // Scroll to show coach response
      this.#scrollChatToBottom();
    } catch (error) {
      this.log.error('Failed to send message', {}, error);
      this.appState?.setError('Failed to send message: ' + error.message);
    } finally {
      this.appState?.setLoading(false);
      this.appState?.set('ui.loadingType', null);
    }
  }

  /**
   * Starts a new session, abandoning any existing one.
   * Called from the burger menu.
   * See specs/master/changes/CR001-conversational-coaching.md for planned behavior.
   */
  async startNewSession() {
    try {
      // Abandon current session if exists
      const currentSession = this.#coachService?.getCurrentSession();
      if (currentSession) {
        await this.#coachService.abandonSession();
        this.log.info('Previous session abandoned for new session', { sessionId: currentSession.id });
      }

      // Clear chat history and show welcome message
      this.appState?.set('session.chatHistory', []);
      
      // Clear the prompt text for fresh start
      this.appState?.set('prompt.text', '');
      // Also update PromptPanel's MarkdownField directly (it doesn't watch prompt.text)
      if (this.#promptPanel) {
        this.#promptPanel.setPromptText('');
      }
      
      // Set special marker for new session - empty string means "show default placeholder"
      // This is different from null (no value set) or actual text (user entered)
      this.appState?.set('ui.inputText', '');
      this.appState?.set('ui.isNewSession', true);
      
      // Show welcome message
      await this.#ensureWelcomeMessage();

      this.log.info('New session started');
    } catch (error) {
      this.log.error('Failed to start new session cleanly', {}, error);
      // Continue anyway - clear state
      this.appState?.set('session.chatHistory', []);
      this.appState?.set('prompt.text', '');
      if (this.#promptPanel) {
        this.#promptPanel.setPromptText('');
      }
      this.appState?.set('ui.inputText', '');
      this.appState?.set('ui.isNewSession', true);
      await this.#ensureWelcomeMessage();
    }
  }

  /**
   * Handles testing the prompt against the LLM
   */
  async #handleTestPrompt() {
    if (!this.#llmService) {
      this.log.warn('LlmService not available');
      return;
    }

    const promptText = this.appState?.get('prompt.text') || '';
    if (!promptText.trim()) {
      this.log.warn('Cannot test empty prompt');
      return;
    }

    try {
      this.appState?.set('ui.loadingType', 'processing');
      this.appState?.setLoading(true);

      const startTime = Date.now();
      // Use sendMessage, not sendPrompt
      const result = await this.#llmService.sendMessage(promptText);
      const responseTime = Date.now() - startTime;

      // Create LLM response message and add to chat history
      const { ChatMessage } = await import('../models/ChatMessage.js');
      const llmMessage = ChatMessage.createLlmResponse(result.content, {
        provider: result.provider || this.appState?.get('settings.provider'),
        model: result.model || this.appState?.get('settings.model'),
        responseTime,
        tokenCount: result.tokensUsed || result.usage?.total_tokens || 0,
      });

      // Add to chat history
      const chatHistory = this.appState?.get('session.chatHistory') || [];
      this.appState?.set('session.chatHistory', [...chatHistory, llmMessage]);

      this.log.info('Prompt tested successfully', { responseTime });
    } catch (error) {
      this.log.error('Failed to test prompt', {}, error);
      this.appState?.setError('Failed to test prompt: ' + error.message);
    } finally {
      this.appState?.setLoading(false);
      this.appState?.set('ui.loadingType', null);
    }
  }

  /**
   * Handles Escape key to restore maximized panel
   * @param {KeyboardEvent} event
   */
  #handleKeyDown = (event) => {
    if (event.key === 'Escape' && this.appState?.get('ui.maximizedPanel')) {
      this.restorePanel();
    }
  };

  template() {
    // Return null to prevent re-rendering - we manage children manually
    return null;
  }

  onMount() {
    // Add keyboard listener for Escape
    document.addEventListener('keydown', this.#handleKeyDown);
    
    // Render the initial structure
    this.container.innerHTML = `
      <div class="unified-view">
        <header class="unified-view__header">
          <div id="burger-menu-container"></div>
          <h1 class="unified-view__title">Prompting Coach</h1>
        </header>
        <div class="unified-view__main">
          <div id="prompt-panel-container"></div>
          <div id="conversation-area-container"></div>
          <div id="input-panel-container"></div>
        </div>
        <dialog id="history-dialog"></dialog>
        <dialog id="file-upload-dialog"></dialog>
      </div>
    `;
    
    // Check for active session to resume (CR1-025)
    this.#checkForActiveSession();
    
    // Create and mount child components once
    this.#mountChildComponents();
  }

  /**
   * Checks for an active session and silently restores it (CR1-025)
   * On page refresh, we simply restore the previous state without prompting.
   * Starting a new session is an intentional action via the menu (future feature).
   */
  async #checkForActiveSession() {
    if (!this.#coachService || !this.#storageService) {
      this.#ensureWelcomeMessage();
      return;
    }

    try {
      // Look for active sessions
      const activeSessions = await this.#storageService.getActiveSessions();
      
      if (activeSessions.length > 0) {
        // Found an active session - silently restore it
        const sessionData = activeSessions[0]; // Most recent active session
        await this.#restoreSession(sessionData);
      } else {
        // No active session - show welcome message
        this.#ensureWelcomeMessage();
      }
    } catch (error) {
      this.log.warn('Failed to check for active sessions', {}, error);
      this.#ensureWelcomeMessage();
    }
  }

  /**
   * Silently restores an active session (CR1-025)
   * Simply loads the session state without prompting the user.
   * @param {Object} sessionData - The stored session data
   */
  async #restoreSession(sessionData) {
    try {
      // Load the session into CoachService
      const session = await this.#coachService.loadSession(sessionData.id);
      if (!session) {
        this.log.warn('Failed to load session, showing welcome');
        this.#ensureWelcomeMessage();
        return;
      }

      // Sync the session state to AppState (restores chat history)
      this.#syncSessionState();
      
      this.log.info('Session restored silently', { sessionId: sessionData.id });
    } catch (error) {
      this.log.error('Failed to restore session', {}, error);
      this.#ensureWelcomeMessage();
    }
  }

  /**
   * Ensures a welcome message exists in chat history
   */
  async #ensureWelcomeMessage() {
    const chatHistory = this.appState?.get('session.chatHistory') || [];
    if (chatHistory.length === 0) {
      const { ChatMessage } = await import('../models/ChatMessage.js');
      const welcomeMessage = ChatMessage.createCoachMessage(
        "Hey there! I'm your prompt coach. Paste your prompt in the editor above and press **send** when ready - I'll help you make it shine!",
        null,
        'text'
      );
      this.appState?.set('session.chatHistory', [welcomeMessage]);
    }
  }

  onUnmount() {
    // Remove keyboard listener
    document.removeEventListener('keydown', this.#handleKeyDown);

    // Unmount child components
    this.#burgerMenu?.unmount();
    this.#historyDialog?.unmount();
    this.#fileUploadDialog?.unmount();
    this.#promptPanel?.unmount();
    this.#conversationArea?.unmount();
    this.#inputPanel?.unmount();
  }

  /**
   * Mounts child components - called once on mount
   */
  #mountChildComponents() {
    // Mount burger menu
    const burgerContainer = this.container.querySelector('#burger-menu-container');
    if (burgerContainer) {
      this.#burgerMenu = new BurgerMenu(burgerContainer, this.appState, {
        onSettings: () => this.#handleOpenSettings(),
        onHistory: () => this.#handleOpenHistory(),
        onNewSession: () => this.startNewSession(),
      });
      this.#burgerMenu.mount();
    }

    const promptContainer = this.container.querySelector('#prompt-panel-container');
    const conversationContainer = this.container.querySelector('#conversation-area-container');
    const inputContainer = this.container.querySelector('#input-panel-container');

    // Mount history dialog
    const historyDialogEl = this.container.querySelector('#history-dialog');
    if (historyDialogEl) {
      this.#historyDialog = new HistoryDialog(historyDialogEl, this.appState, {
        storageService: this.#storageService,
        onLoadSession: (session) => this.#handleLoadSession(session),
      });
      this.#historyDialog.mount();
    }

    // Mount file upload dialog
    const fileUploadDialogEl = this.container.querySelector('#file-upload-dialog');
    if (fileUploadDialogEl) {
      this.#fileUploadDialog = new FileUploadDialog(fileUploadDialogEl, this.appState, {
        onFilesChange: (files) => {
          this.log.debug('Files changed', { count: files.length });
        },
      });
      this.#fileUploadDialog.mount();
    }

    if (promptContainer) {
      this.#promptPanel = new PromptPanel(promptContainer, this.appState, {
        onMaximize: (panelId) => this.maximizePanel(panelId),
        onTestPrompt: () => this.#handleTestPrompt(),
        onOpenFileUpload: () => this.#handleOpenFileUpload(),
      });
      this.#promptPanel.mount();
    }

    if (conversationContainer) {
      this.#conversationArea = new ConversationArea(conversationContainer, this.appState, {
        onMaximize: (panelId) => this.maximizePanel(panelId),
      });
      this.#conversationArea.mount();
    }

    if (inputContainer) {
      this.#inputPanel = new InputPanel(inputContainer, this.appState, {
        onMaximize: (panelId) => this.maximizePanel(panelId),
        onSendMessage: (text) => this.#handleSendMessage(text),
      });
      this.#inputPanel.mount();
    }
  }

  /**
   * Opens the file upload dialog
   */
  #handleOpenFileUpload() {
    if (this.#fileUploadDialog) {
      this.#fileUploadDialog.open();
    }
  }

  /**
   * Opens the settings dialog
   */
  #handleOpenSettings() {
    this.log.debug('Opening settings dialog', { hasCallback: !!this.#onOpenSettings });
    if (this.#onOpenSettings) {
      this.#onOpenSettings();
    } else {
      this.log.warn('No onOpenSettings callback provided');
    }
  }

  /**
   * Opens the history dialog
   */
  #handleOpenHistory() {
    if (this.#historyDialog) {
      this.#historyDialog.open();
    }
  }

  /**
   * Loads a session from history
   * @param {Object} session
   */
  async #handleLoadSession(session) {
    try {
      // Load the session into CoachService
      const loadedSession = await this.#coachService.loadSession(session.id);
      if (loadedSession) {
        this.#syncSessionState();
        this.log.info('Session loaded from history', { sessionId: session.id });
      }
    } catch (error) {
      this.log.error('Failed to load session from history', {}, error);
    }
  }

  onStateChange(detail) {
    // Update unified-view class when maximize state changes
    const unifiedView = this.container?.querySelector('.unified-view');
    if (unifiedView) {
      const hasMaximized = this.appState?.get('ui.maximizedPanel') !== null;
      unifiedView.classList.toggle('unified-view--has-maximized', hasMaximized);
    }
  }
}
