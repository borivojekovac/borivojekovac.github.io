/**
 * SettingsDialog
 * Dialog for configuring API keys and application settings
 */

import { BaseComponent } from './BaseComponent.js';
import { AppSettings, PROVIDERS } from '../models/AppSettings.js';

export class SettingsDialog extends BaseComponent {
  /** @type {HTMLDialogElement|null} */
  #dialog = null;

  /** @type {import('../services/LlmService.js').LlmService|null} */
  #llmService = null;

  /** @type {import('../services/StorageService.js').StorageService|null} */
  #storageService = null;

  /** @type {Object} */
  #pendingSettings = {};

  /** @type {boolean} */
  #isValidating = false;

  /** @type {string|null} */
  #validatingProvider = null;

  /** @type {Object<string, boolean|null>} */
  #validationStatus = {};

  constructor(dialogElement, appState, llmService, storageService) {
    super(dialogElement, appState);
    this.#dialog = dialogElement;
    this.#llmService = llmService;
    this.#storageService = storageService;
    this.watchState(['settings']);
  }

  /**
   * Opens the settings dialog
   */
  open() {
    this.log.debug('SettingsDialog.open() called', { hasDialog: !!this.#dialog });
    // Load current settings
    const settings = this.#storageService?.getSettings() || {};
    this.#pendingSettings = { ...settings };
    this.#validationStatus = {};
    
    if (this.#dialog) {
      this.#dialog.showModal();
      this.render();
      this.log.debug('Dialog showModal() called');
    } else {
      this.log.error('Dialog element is null');
    }
  }

  /**
   * Closes the settings dialog
   */
  close() {
    this.#dialog?.close();
    // Clear content when closed
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  template() {
    // Only render content when dialog is open
    if (!this.#dialog?.open) {
      return null;
    }
    const settings = this.#pendingSettings;
    const providers = Object.values(PROVIDERS);
    const currentProvider = PROVIDERS[settings.provider] || PROVIDERS.openai;

    return `
      <div class="dialog-header">
        <h2>Settings</h2>
        <button class="btn btn-icon" id="close-settings-btn" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <section class="settings-section">
          <h3>LLM Provider</h3>
          
          <div class="input-field">
            <label for="provider-select">Active Provider</label>
            <select id="provider-select">
              ${providers.map(p => `
                <option value="${p.id}" ${p.id === settings.provider ? 'selected' : ''}>
                  ${p.name} ${this.#hasApiKey(p.id) ? '✓' : ''}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="input-field">
            <label for="model-select">Model</label>
            <select id="model-select">
              ${currentProvider.models.map(m => `
                <option value="${m}" ${m === settings.model ? 'selected' : ''}>
                  ${m}
                </option>
              `).join('')}
            </select>
          </div>
        </section>

        <section class="settings-section">
          <h3>API Keys</h3>
          <p class="section-description">Configure API keys for each provider you want to use.</p>
          
          ${providers.map(p => `
            <div class="input-field ${this.#getValidationClass(p.id)}">
              <label for="api-key-${p.id}">${p.name}</label>
              <div class="input-with-action">
                <input 
                  type="password" 
                  id="api-key-${p.id}"
                  data-provider="${p.id}"
                  value="${settings.apiKeys?.[p.id] || ''}"
                  placeholder="Enter ${p.name} API key"
                  class="api-key-input"
                />
                <button 
                  class="btn btn-secondary btn-validate" 
                  data-provider="${p.id}"
                  ${this.#isValidating ? 'disabled' : ''}
                >
                  ${this.#validatingProvider === p.id ? 'Validating...' : 'Validate'}
                </button>
              </div>
              <div class="helper-text">
                ${this.#getValidationMessage(p.id)}
              </div>
            </div>
          `).join('')}
        </section>

        <section class="settings-section">
          <h3>Appearance</h3>
          
          <div class="input-field">
            <label for="theme-select">Theme</label>
            <select id="theme-select">
              <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
              <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </div>
        </section>

        <section class="settings-section">
          <h3>Advanced</h3>
          
          <div class="input-field">
            <label for="log-level-select">Log Level</label>
            <select id="log-level-select">
              <option value="error" ${settings.logLevel === 'error' ? 'selected' : ''}>Error</option>
              <option value="warn" ${settings.logLevel === 'warn' ? 'selected' : ''}>Warning</option>
              <option value="info" ${settings.logLevel === 'info' ? 'selected' : ''}>Info</option>
              <option value="debug" ${settings.logLevel === 'debug' ? 'selected' : ''}>Debug</option>
              <option value="trace" ${settings.logLevel === 'trace' ? 'selected' : ''}>Trace</option>
            </select>
          </div>

          <div class="checkbox-field">
            <label>
              <input type="checkbox" id="auto-save-checkbox" ${settings.autoSave ? 'checked' : ''} />
              Auto-save prompts
            </label>
          </div>
        </section>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-text" id="cancel-settings-btn">Cancel</button>
        <button class="btn btn-primary" id="save-settings-btn">Save</button>
      </div>
    `;
  }

  #getValidationClass(provider) {
    const status = this.#validationStatus[provider];
    if (status === true) return 'success';
    if (status === false) return 'error';
    return '';
  }

  #getValidationMessage(provider) {
    const status = this.#validationStatus[provider];
    if (status === true) return '✓ API key is valid';
    if (status === false) return '✗ API key is invalid';
    return 'Enter your API key to enable LLM features';
  }

  onRender() {
    // Close button
    this.on('#close-settings-btn', 'click', () => this.close());
    this.on('#cancel-settings-btn', 'click', () => this.close());

    // Save button
    this.on('#save-settings-btn', 'click', () => this.#saveSettings());

    // Provider change
    this.on('#provider-select', 'change', (e) => {
      this.#pendingSettings.provider = e.target.value;
      this.#pendingSettings.model = PROVIDERS[e.target.value]?.defaultModel;
      this.render();
    });

    // Model change
    this.on('#model-select', 'change', (e) => {
      this.#pendingSettings.model = e.target.value;
    });

    // API key changes for all providers
    this.$$('.api-key-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const provider = e.target.dataset.provider;
        if (!this.#pendingSettings.apiKeys) {
          this.#pendingSettings.apiKeys = {};
        }
        this.#pendingSettings.apiKeys[provider] = e.target.value;
        // Clear validation status when key changes
        this.#validationStatus[provider] = null;
      });
    });

    // Validate buttons for all providers
    this.$$('.btn-validate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = e.target.dataset.provider;
        this.#validateApiKey(provider);
      });
    });

    // Theme change
    this.on('#theme-select', 'change', (e) => {
      this.#pendingSettings.theme = e.target.value;
    });

    // Log level change
    this.on('#log-level-select', 'change', (e) => {
      this.#pendingSettings.logLevel = e.target.value;
    });

    // Auto-save checkbox
    this.on('#auto-save-checkbox', 'change', (e) => {
      this.#pendingSettings.autoSave = e.target.checked;
    });
  }

  /**
   * Checks if a provider has an API key configured
   * @param {string} providerId
   * @returns {boolean}
   */
  #hasApiKey(providerId) {
    const key = this.#pendingSettings.apiKeys?.[providerId];
    return key && key.trim().length > 0;
  }

  /**
   * Validates the API key for a specific provider
   * @param {string} provider
   */
  async #validateApiKey(provider) {
    const apiKey = this.#pendingSettings.apiKeys?.[provider];

    if (!apiKey?.trim()) {
      this.#validationStatus[provider] = false;
      this.render();
      return;
    }

    this.#isValidating = true;
    this.#validatingProvider = provider;
    this.render();

    try {
      const isValid = await this.#llmService?.validateApiKey(provider, apiKey);
      this.#validationStatus[provider] = isValid;
    } catch (error) {
      this.log.error('API key validation failed', {}, error);
      this.#validationStatus[provider] = false;
    } finally {
      this.#isValidating = false;
      this.#validatingProvider = null;
      this.render();
    }
  }

  /**
   * Saves settings and closes dialog
   */
  #saveSettings() {
    // Save to storage
    if (this.#storageService) {
      this.#storageService.saveSettings(this.#pendingSettings);
    }

    // Update app state
    if (this.appState) {
      this.appState.update({
        'settings.provider': this.#pendingSettings.provider,
        'settings.model': this.#pendingSettings.model,
        'settings.apiKeys': this.#pendingSettings.apiKeys,
        'settings.theme': this.#pendingSettings.theme,
        'settings.logLevel': this.#pendingSettings.logLevel,
        'settings.autoSave': this.#pendingSettings.autoSave,
      });
    }

    // Update LLM service
    if (this.#llmService) {
      this.#llmService.updateSettings(this.#pendingSettings);
    }

    // Apply theme
    this.#applyTheme(this.#pendingSettings.theme);

    this.log.info('Settings saved', { provider: this.#pendingSettings.provider });
    this.close();
  }

  /**
   * Applies the selected theme
   * @param {string} theme
   */
  #applyTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
    // 'system' uses CSS media query, no class needed
  }
}
