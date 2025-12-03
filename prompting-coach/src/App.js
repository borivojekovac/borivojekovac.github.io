/**
 * App
 * Root application class that initializes services and mounts components
 */

import { LogService } from './services/LogService.js';
import { StorageService } from './services/StorageService.js';
import { LlmService } from './services/LlmService.js';
import { CoachService } from './services/CoachService.js';
import { AppState } from './state/AppState.js';
import { TabBar } from './components/TabBar.js';
import { PromptWorkspace } from './components/PromptWorkspace.js';
import { CoachPanel } from './components/CoachPanel.js';
import { SettingsDialog } from './components/SettingsDialog.js';
import { UnifiedView } from './components/UnifiedView.js';

export class App {
  /** @type {LogService} */
  #log;

  /** @type {StorageService} */
  #storageService;

  /** @type {AppState} */
  #appState;

  /** @type {LlmService|null} */
  #llmService = null;

  /** @type {CoachService|null} */
  #coachService = null;

  /** @type {UnifiedView|null} */
  #unifiedView = null;

  /** @type {TabBar|null} */
  #tabBar = null;

  /** @type {PromptWorkspace|null} */
  #promptWorkspace = null;

  /** @type {CoachPanel|null} */
  #coachPanel = null;

  /** @type {SettingsDialog|null} */
  #settingsDialog = null;

  /** @type {Map<string, import('./components/BaseComponent.js').BaseComponent>} */
  #panels = new Map();

  /** @type {HTMLElement|null} */
  #appElement = null;

  constructor() {
    this.#log = LogService.getInstance();
    this.#storageService = new StorageService();
    this.#appState = new AppState();
  }

  /**
   * Gets the storage service
   * @returns {StorageService}
   */
  get storageService() {
    return this.#storageService;
  }

  /**
   * Gets the app state
   * @returns {AppState}
   */
  get appState() {
    return this.#appState;
  }

  /**
   * Initializes the application
   */
  async initialize() {
    this.#log.info('Initializing application');
    const timerId = this.#log.startTimer('app-init');

    try {
      // Initialize storage
      await this.#storageService.initialize();

      // Initialize state with storage
      await this.#appState.initialize(this.#storageService);

      // Initialize LLM service with settings
      const settings = this.#storageService.getSettings();
      this.#llmService = new LlmService(settings);

      // Initialize Coach service
      this.#coachService = new CoachService(this.#llmService, this.#storageService);

      // Clean up old abandoned sessions (CR1-027)
      this.#storageService.cleanupAbandonedSessions(7).catch(err => {
        this.#log.warn('Session cleanup failed', {}, err);
      });

      // Get app container
      this.#appElement = document.getElementById('app');
      if (!this.#appElement) {
        throw new Error('App container not found');
      }

      // Render app shell
      this.#renderShell();

      // Mount components
      this.#mountComponents();

      // Only set up tab switching for legacy tab-based layout
      const useUnifiedView = this.#appState.get('ui.unifiedViewEnabled') !== false;
      if (!useUnifiedView) {
        // Listen for tab changes
        this.#appState.addEventListener('change', (event) => {
          const { detail } = event;
          if (detail.path === 'ui.activeTab') {
            this.#showPanel(detail.newValue);
          }
        });

        // Show initial panel
        const activeTab = this.#appState.get('ui.activeTab') || 'editor';
        this.#showPanel(activeTab);
      }

      this.#log.endTimer(timerId);
    } catch (error) {
      this.#log.error('Failed to initialize application', {}, error);
      throw error;
    }
  }

  /**
   * Renders the application shell
   */
  #renderShell() {
    const useUnifiedView = this.#appState.get('ui.unifiedViewEnabled') !== false;

    if (useUnifiedView) {
      this.#renderUnifiedShell();
    } else {
      this.#renderTabBasedShell();
    }

    // Settings button handler
    const settingsBtn = this.#appElement.querySelector('#settings-btn');
    settingsBtn?.addEventListener('click', () => this.#openSettings());
  }

  /**
   * Renders the unified layout shell (new)
   * Note: Header is now part of UnifiedView with burger menu
   */
  #renderUnifiedShell() {
    this.#appElement.innerHTML = `
      <main class="app-main unified-layout">
        <div id="unified-view-container"></div>
      </main>
      
      <dialog id="settings-dialog"></dialog>
    `;
  }

  /**
   * Renders the tab-based layout shell (legacy)
   */
  #renderTabBasedShell() {
    this.#appElement.innerHTML = `
      <header class="app-header">
        <h1>Prompting Coach</h1>
        <button class="btn btn-icon" id="settings-btn" aria-label="Settings" title="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </header>
      
      <main class="app-main">
        <div id="panel-editor" class="panel" style="display: none;"></div>
        <div id="panel-coach" class="panel" style="display: none;"></div>
        <div id="panel-history" class="panel" style="display: none;"></div>
      </main>
      
      <nav id="tab-bar-container"></nav>
      
      <dialog id="settings-dialog"></dialog>
    `;
  }

  /**
   * Mounts all components
   */
  #mountComponents() {
    const useUnifiedView = this.#appState.get('ui.unifiedViewEnabled') !== false;

    if (useUnifiedView) {
      this.#mountUnifiedComponents();
    } else {
      this.#mountTabBasedComponents();
    }

    // Mount SettingsDialog (shared by both layouts)
    const settingsDialog = this.#appElement.querySelector('#settings-dialog');
    if (settingsDialog) {
      this.#settingsDialog = new SettingsDialog(settingsDialog, this.#appState, this.#llmService, this.#storageService);
      this.#settingsDialog.mount();
      this.#log.debug('SettingsDialog mounted');
    } else {
      this.#log.warn('Settings dialog element not found');
    }
  }

  /**
   * Mounts components for unified layout
   */
  #mountUnifiedComponents() {
    // Mount UnifiedView
    const unifiedContainer = this.#appElement.querySelector('#unified-view-container');
    if (unifiedContainer) {
      this.#unifiedView = new UnifiedView(unifiedContainer, this.#appState, {
        coachService: this.#coachService,
        llmService: this.#llmService,
        storageService: this.#storageService,
        onOpenSettings: () => this.#openSettings(),
      });
      this.#unifiedView.mount();
    }
    // No TabBar in unified layout - burger menu handles navigation
  }

  /**
   * Mounts components for tab-based layout (legacy)
   */
  #mountTabBasedComponents() {
    // Mount TabBar
    const tabBarContainer = this.#appElement.querySelector('#tab-bar-container');
    if (tabBarContainer) {
      this.#tabBar = new TabBar(tabBarContainer, this.#appState);
      this.#tabBar.mount();
    }

    // Mount PromptWorkspace (combined editor + test)
    const editorPanel = this.#appElement.querySelector('#panel-editor');
    if (editorPanel) {
      this.#promptWorkspace = new PromptWorkspace(editorPanel, this.#appState, this.#llmService, this.#storageService);
      this.#promptWorkspace.mount();
    }

    // Mount CoachPanel
    const coachPanel = this.#appElement.querySelector('#panel-coach');
    if (coachPanel) {
      this.#coachPanel = new CoachPanel(coachPanel, this.#appState, this.#llmService, this.#storageService);
      this.#coachPanel.mount();
    }

    // Create placeholder for History panel (not yet implemented)
    this.#createPanelPlaceholder('history', 'History');
  }

  /**
   * Creates a placeholder for a panel
   * @param {string} id
   * @param {string} title
   */
  #createPanelPlaceholder(id, title) {
    const panel = this.#appElement.querySelector(`#panel-${id}`);
    if (panel) {
      panel.innerHTML = `
        <div class="card">
          <div class="card-content">
            <h2>${title}</h2>
            <p style="color: var(--md-on-surface-variant);">
              This panel will be implemented in the next phase.
            </p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Shows a specific panel
   * @param {string} panelId
   */
  #showPanel(panelId) {
    // Hide all panels
    const panels = this.#appElement.querySelectorAll('.panel');
    panels.forEach(panel => {
      panel.style.display = 'none';
    });

    // Show selected panel
    const activePanel = this.#appElement.querySelector(`#panel-${panelId}`);
    if (activePanel) {
      activePanel.style.display = 'block';
    }

    this.#log.debug('Panel shown', { panelId });
  }

  /**
   * Opens the settings dialog
   */
  #openSettings() {
    this.#log.debug('App.#openSettings called', { hasDialog: !!this.#settingsDialog });
    if (this.#settingsDialog) {
      this.#settingsDialog.open();
    } else {
      this.#log.warn('SettingsDialog not available');
    }
  }

  /**
   * Registers a panel component
   * @param {string} id - Panel ID
   * @param {import('./components/BaseComponent.js').BaseComponent} component
   */
  registerPanel(id, component) {
    this.#panels.set(id, component);
    component.mount();
  }
}
