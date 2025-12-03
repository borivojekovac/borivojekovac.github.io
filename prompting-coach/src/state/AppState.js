/**
 * AppState
 * EventTarget-based state container with persistence and hydration
 */

import { LogService } from '../services/LogService.js';

const DEBOUNCE_MS = 300;

export class AppState extends EventTarget {
  /** @type {Object} */
  #state = {
    prompt: {
      id: null,
      text: '',
      files: [],
      title: '',
    },
    session: {
      id: null,
      currentPrincipleIndex: 0,
      principleResults: [],
      chatHistory: [],
      status: null,
    },
    settings: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKeys: {},
      logLevel: 'info',
      theme: 'system',
      autoSave: true,
    },
    ui: {
      activeTab: 'editor',
      isLoading: false,
      loadingType: null,  // 'thinking' | 'processing' | null - differentiates Send vs Test
      error: null,
      maximizedPanel: null,  // 'prompt' | 'conversation' | 'input' | null
      unifiedViewEnabled: true,  // Feature flag for unified layout
      inputText: null,  // Persisted input field text (null = never set, '' = explicitly empty)
      isNewSession: false,  // Transient flag - true when new session started, cleared on first input
    },
  };

  /** @type {import('../services/StorageService.js').StorageService|null} */
  #storageService = null;

  /** @type {LogService} */
  #log;

  /** @type {number|null} */
  #persistTimeout = null;

  /** @type {boolean} */
  #hydrated = false;

  constructor() {
    super();
    this.#log = LogService.getInstance();
  }

  /**
   * Initializes the state with storage service and hydrates from storage
   * @param {import('../services/StorageService.js').StorageService} storageService
   */
  async initialize(storageService) {
    this.#storageService = storageService;
    
    // Hydrate from storage
    await this.#hydrateFromStorage();
    
    // Set up persistence on change
    this.addEventListener('change', () => this.#schedulePersist());
    
    // Persist immediately before page unload
    window.addEventListener('beforeunload', () => {
      if (this.#persistTimeout) {
        clearTimeout(this.#persistTimeout);
        this.#persistToStorage();
      }
    });

    this.#log.debug('AppState initialized');
  }

  /**
   * Hydrates state from storage
   */
  async #hydrateFromStorage() {
    if (!this.#storageService) return;

    try {
      // Load settings from localStorage
      const settings = this.#storageService.getSettings();
      this.#state.settings = { ...this.#state.settings, ...settings };

      // Load UI state from sessionStorage
      const uiState = this.#storageService.getUIState();
      this.#state.ui = { ...this.#state.ui, ...uiState, isLoading: false, error: null };

      // Load active work state from IndexedDB
      const activeWork = await this.#storageService.getActiveWorkState();
      if (activeWork) {
        this.#state.prompt = {
          id: activeWork.activePromptId,
          text: activeWork.draftPromptText || '',
          files: activeWork.draftFiles || [],
          title: activeWork.title || '',
        };
        
        if (activeWork.activeSessionId) {
          this.#state.session.id = activeWork.activeSessionId;
        }
        
        this.#log.info('State hydrated from storage');
      }

      this.#hydrated = true;
      this.dispatchEvent(new CustomEvent('hydrated'));
    } catch (error) {
      this.#log.error('Failed to hydrate state', {}, error);
    }
  }

  /**
   * Schedules persistence with debouncing
   */
  #schedulePersist() {
    if (this.#persistTimeout) {
      clearTimeout(this.#persistTimeout);
    }
    this.#persistTimeout = setTimeout(() => {
      this.#persistToStorage();
      this.#persistTimeout = null;
    }, DEBOUNCE_MS);
  }

  /**
   * Persists state to storage
   */
  async #persistToStorage() {
    if (!this.#storageService) return;

    try {
      // Save settings to localStorage
      this.#storageService.saveSettings(this.#state.settings);

      // Save UI state to sessionStorage
      this.#storageService.saveUIState({
        activeTab: this.#state.ui.activeTab,
        inputText: this.#state.ui.inputText,
      });

      // Save active work state to IndexedDB
      await this.#storageService.saveActiveWorkState({
        activePromptId: this.#state.prompt.id,
        draftPromptText: this.#state.prompt.text,
        draftFiles: this.#state.prompt.files,
        title: this.#state.prompt.title,
        activeSessionId: this.#state.session.id,
      });

      this.#log.trace('State persisted');
    } catch (error) {
      this.#log.error('Failed to persist state', {}, error);
    }
  }

  /**
   * Gets a value from state by path
   * @param {string} path - Dot-separated path (e.g., 'prompt.text')
   * @returns {*}
   */
  get(path) {
    const parts = path.split('.');
    let value = this.#state;
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    
    return value;
  }

  /**
   * Sets a value in state by path
   * @param {string} path - Dot-separated path (e.g., 'prompt.text')
   * @param {*} value - Value to set
   */
  set(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let target = this.#state;
    
    for (const part of parts) {
      if (target[part] === undefined) {
        target[part] = {};
      }
      target = target[part];
    }
    
    const oldValue = target[lastPart];
    target[lastPart] = value;
    
    this.#log.trace('State updated', { path, oldValue, newValue: value });
    
    this.dispatchEvent(new CustomEvent('change', {
      detail: { path, oldValue, newValue: value }
    }));
  }

  /**
   * Updates multiple values at once
   * @param {Object} updates - Object with path: value pairs
   */
  update(updates) {
    for (const [path, value] of Object.entries(updates)) {
      const parts = path.split('.');
      const lastPart = parts.pop();
      let target = this.#state;
      
      for (const part of parts) {
        if (target[part] === undefined) {
          target[part] = {};
        }
        target = target[part];
      }
      
      target[lastPart] = value;
    }
    
    this.#log.trace('State batch updated', { paths: Object.keys(updates) });
    
    this.dispatchEvent(new CustomEvent('change', {
      detail: { batch: true, paths: Object.keys(updates) }
    }));
  }

  /**
   * Gets the entire state (read-only copy)
   * @returns {Object}
   */
  getState() {
    return JSON.parse(JSON.stringify(this.#state));
  }

  /**
   * Checks if state has been hydrated from storage
   * @returns {boolean}
   */
  isHydrated() {
    return this.#hydrated;
  }

  /**
   * Resets prompt state
   */
  resetPrompt() {
    this.update({
      'prompt.id': null,
      'prompt.text': '',
      'prompt.files': [],
      'prompt.title': '',
    });
  }

  /**
   * Resets session state
   */
  resetSession() {
    this.update({
      'session.id': null,
      'session.currentPrincipleIndex': 0,
      'session.principleResults': [],
      'session.chatHistory': [],
      'session.status': null,
    });
  }

  /**
   * Sets loading state
   * @param {boolean} isLoading
   */
  setLoading(isLoading) {
    this.set('ui.isLoading', isLoading);
  }

  /**
   * Sets error state
   * @param {string|null} error
   */
  setError(error) {
    this.set('ui.error', error);
  }

  /**
   * Clears error state
   */
  clearError() {
    this.set('ui.error', null);
  }
}
