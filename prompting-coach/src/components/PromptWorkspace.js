/**
 * PromptWorkspace Component
 * Combined prompt editor and LLM test output in a single workspace.
 * Layout: LLM output at top, prompt input at bottom.
 * Each section has a focus/zoom toggle to expand it full-screen.
 * 
 * @deprecated This component is deprecated in favor of the unified layout.
 * Use UnifiedView with PromptPanel and InputPanel instead.
 * Kept for backward compatibility and rollback capability.
 * See: specs/001-unified-layout/spec.md
 */

import { BaseComponent } from './BaseComponent.js';
import { LlmTestResult } from '../models/LlmTestResult.js';

export class PromptWorkspace extends BaseComponent {
  /** @type {import('../services/LlmService.js').LlmService|null} */
  #llmService = null;

  /** @type {import('../services/StorageService.js').StorageService|null} */
  #storageService = null;

  /** @type {LlmTestResult|null} */
  #currentResult = null;

  /** @type {'none'|'output'|'input'} */
  #focusedSection = 'none';

  /** @type {number|null} */
  #autoSaveTimeout = null;

  /**
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {import('../services/LlmService.js').LlmService} llmService
   * @param {import('../services/StorageService.js').StorageService} storageService
   */
  constructor(container, appState, llmService, storageService) {
    super(container, appState);
    this.#llmService = llmService;
    this.#storageService = storageService;
    // Don't watch prompt.text/title - we update those manually without re-render
    this.watchState(['ui.isLoading', 'ui.error', 'settings.apiKeys', 'settings.provider', 'settings.model']);
  }

  template() {
    const isLoading = this.appState?.get('ui.isLoading') || false;
    const error = this.appState?.get('ui.error');
    const promptText = this.appState?.get('prompt.text') || '';
    const promptTitle = this.appState?.get('prompt.title') || '';
    const hasPrompt = promptText.trim().length > 0;

    // Check configuration from AppState
    const provider = this.appState?.get('settings.provider') || 'openai';
    const apiKeys = this.appState?.get('settings.apiKeys') || {};
    const apiKey = apiKeys[provider];
    const isConfigured = apiKey && apiKey.trim().length > 0;
    const model = this.appState?.get('settings.model') || 'gpt-4o-mini';

    const charCount = promptText.length;
    const wordCount = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;
    const maxChars = 50000;
    const isOverLimit = charCount > maxChars;

    const outputFocused = this.#focusedSection === 'output';
    const inputFocused = this.#focusedSection === 'input';

    const hasResult = this.#currentResult && this.#currentResult.isSuccess();

    return `
      <div class="prompt-workspace ${this.#focusedSection !== 'none' ? 'has-focus' : ''}">
        <!-- LLM Output Section (Top) -->
        <section class="workspace-section output-section ${outputFocused ? 'focused' : ''} ${inputFocused ? 'hidden' : ''}">
          <div class="section-header">
            <div class="header-left">
              <h3>LLM Response</h3>
              ${this.#currentResult ? `
                <span class="result-meta">${this.#currentResult.responseTimeMs}ms • ${this.#currentResult.tokensUsed || 0} tokens</span>
              ` : ''}
            </div>
            <div class="section-actions">
              ${isConfigured ? `
                <span class="provider-badge">${provider}</span>
                <span class="model-badge">${model}</span>
              ` : ''}
              <button class="btn btn-text btn-small" id="copy-response-btn" ${!hasResult ? 'disabled' : ''}>Copy</button>
              <button class="btn btn-icon focus-btn" id="focus-output-btn" 
                      aria-label="${outputFocused ? 'Exit focus mode' : 'Focus on output'}" 
                      title="${outputFocused ? 'Exit focus mode' : 'Focus on output'}">
                ${this.#getFocusIcon(outputFocused)}
              </button>
            </div>
          </div>
          <div class="section-content output-content">
            ${error ? this.#renderError(error) : ''}
            ${!isConfigured ? this.#renderConfigWarning() : ''}
            ${isLoading ? this.#renderLoading() : ''}
            ${!isLoading && !error && this.#currentResult ? this.#renderResultContent() : ''}
            ${!isLoading && !error && !this.#currentResult && isConfigured ? this.#renderPlaceholder() : ''}
          </div>
        </section>

        <!-- Prompt Input Section (Bottom) -->
        <section class="workspace-section input-section ${inputFocused ? 'focused' : ''} ${outputFocused ? 'hidden' : ''}">
          <div class="section-header">
            <input 
              type="text" 
              class="prompt-title-input" 
              id="prompt-title" 
              value="${this.escapeHtml(promptTitle)}" 
              placeholder="Untitled Prompt"
              aria-label="Prompt title"
            >
            <div class="section-actions">
              <button class="btn btn-icon focus-btn" id="focus-input-btn" 
                      aria-label="${inputFocused ? 'Exit focus mode' : 'Focus on input'}" 
                      title="${inputFocused ? 'Exit focus mode' : 'Focus on input'}">
                ${this.#getFocusIcon(inputFocused)}
              </button>
            </div>
          </div>
          <div class="section-content input-content">
            <textarea 
              class="prompt-textarea" 
              id="prompt-text" 
              placeholder="Enter your prompt here..."
              aria-label="Prompt text"
              ${isLoading ? 'disabled' : ''}
            >${this.escapeHtml(promptText)}</textarea>
          </div>
          <div class="section-footer">
            <div class="prompt-stats ${isOverLimit ? 'warning' : ''}">
              <span>${charCount.toLocaleString()} / ${maxChars.toLocaleString()} chars</span>
              <span>•</span>
              <span>${wordCount} words</span>
              ${isOverLimit ? '<span class="warning-text">Over limit!</span>' : ''}
            </div>
            <div class="prompt-actions">
              <button class="btn btn-text" id="clear-btn" ${!hasPrompt ? 'disabled' : ''}>
                Clear
              </button>
              <button 
                class="btn btn-secondary" 
                id="start-coaching-btn"
                ${!hasPrompt || isLoading || !isConfigured ? 'disabled' : ''}
                title="Start a coaching session to improve this prompt"
              >
                🎯 Coach
              </button>
              <button 
                class="btn btn-primary" 
                id="run-test-btn"
                ${!hasPrompt || isLoading || !isConfigured || isOverLimit ? 'disabled' : ''}
              >
                ${isLoading ? 'Testing...' : 'Run Test'}
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  #getFocusIcon(isFocused) {
    if (isFocused) {
      // Collapse/minimize icon
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
      </svg>`;
    }
    // Expand/fullscreen icon
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>`;
  }

  #renderPlaceholder() {
    return `
      <div class="output-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <p>Enter a prompt below and click "Run Test" to see the LLM response</p>
      </div>
    `;
  }

  #renderConfigWarning() {
    return `
      <div class="config-warning">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <div>
          <strong>API Key Required</strong>
          <p>Please configure your API key in Settings to test prompts.</p>
        </div>
      </div>
    `;
  }

  #renderError(error) {
    return `
      <div class="output-error">
        <div class="error-content">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>${this.escapeHtml(error)}</span>
        </div>
        <button class="btn btn-text" id="dismiss-error-btn">Dismiss</button>
      </div>
    `;
  }

  #renderLoading() {
    return `
      <div class="output-loading">
        <div class="loading-spinner"></div>
        <p>Sending prompt to LLM...</p>
      </div>
    `;
  }

  #renderResultContent() {
    if (!this.#currentResult) return '';

    const result = this.#currentResult;
    const isSuccess = result.isSuccess();

    if (!isSuccess) {
      return `
        <div class="result-error-message">
          <strong>Error:</strong> ${this.escapeHtml(result.error || 'Unknown error')}
        </div>
      `;
    }

    return `<div class="response-text">${this.#formatResponse(result.response)}</div>`;
  }

  #formatResponse(text) {
    if (!text) return '';
    
    let formatted = this.escapeHtml(text);
    
    // Code blocks
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  onRender() {
    // Title input
    this.on('#prompt-title', 'input', (e) => {
      this.appState?.set('prompt.title', e.target.value);
    });

    // Prompt textarea - update state and UI without full re-render
    this.on('#prompt-text', 'input', (e) => {
      const text = e.target.value;
      this.appState?.set('prompt.text', text);
      this.#updatePromptStats(text);
      this.#scheduleAutoSave();
    });

    // Ctrl+Enter to run test
    this.on('#prompt-text', 'keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const runBtn = this.$('#run-test-btn');
        if (runBtn && !runBtn.disabled) {
          this.#runTest();
        }
      }
    });

    // Clear button
    this.on('#clear-btn', 'click', () => {
      this.appState?.update({
        'prompt.text': '',
        'prompt.title': '',
        'prompt.files': [],
      });
      this.#currentResult = null;
      this.render();
    });

    // Run test button
    this.on('#run-test-btn', 'click', () => this.#runTest());

    // Start coaching button - switch to Coach tab
    this.on('#start-coaching-btn', 'click', () => {
      this.appState?.set('ui.activeTab', 'coach');
    });

    // Focus buttons
    this.on('#focus-output-btn', 'click', () => {
      this.#focusedSection = this.#focusedSection === 'output' ? 'none' : 'output';
      this.render();
    });

    this.on('#focus-input-btn', 'click', () => {
      this.#focusedSection = this.#focusedSection === 'input' ? 'none' : 'input';
      this.render();
    });

    // Dismiss error
    this.on('#dismiss-error-btn', 'click', () => {
      this.appState?.clearError();
    });

    // Copy response
    this.on('#copy-response-btn', 'click', () => this.#copyResponse());

    // Restore focus to textarea if it had focus
    const textarea = this.$('#prompt-text');
    if (textarea && document.activeElement?.id === 'prompt-text') {
      textarea.focus();
    }
  }

  #updatePromptStats(text) {
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const maxChars = 50000;
    const isOverLimit = charCount > maxChars;
    const hasPrompt = text.trim().length > 0;

    // Update stats display
    const statsEl = this.$('.prompt-stats');
    if (statsEl) {
      statsEl.className = `prompt-stats ${isOverLimit ? 'warning' : ''}`;
      statsEl.innerHTML = `
        <span>${charCount.toLocaleString()} / ${maxChars.toLocaleString()} chars</span>
        <span>•</span>
        <span>${wordCount} words</span>
        ${isOverLimit ? '<span class="warning-text">Over limit!</span>' : ''}
      `;
    }

    // Update button states
    const clearBtn = this.$('#clear-btn');
    const runBtn = this.$('#run-test-btn');
    const coachBtn = this.$('#start-coaching-btn');
    const provider = this.appState?.get('settings.provider') || 'openai';
    const apiKeys = this.appState?.get('settings.apiKeys') || {};
    const isConfigured = apiKeys[provider]?.trim().length > 0;

    if (clearBtn) clearBtn.disabled = !hasPrompt;
    if (runBtn) runBtn.disabled = !hasPrompt || !isConfigured || isOverLimit;
    if (coachBtn) coachBtn.disabled = !hasPrompt || !isConfigured;
  }

  #scheduleAutoSave() {
    if (this.#autoSaveTimeout) {
      clearTimeout(this.#autoSaveTimeout);
    }
    this.#autoSaveTimeout = setTimeout(() => {
      // Auto-save is handled by AppState persistence
      this.log.debug('Auto-save triggered');
    }, 1000);
  }

  async #runTest() {
    const promptText = this.appState?.get('prompt.text');
    if (!promptText?.trim()) {
      this.appState?.setError('Please enter a prompt to test');
      return;
    }

    // Ensure LlmService has latest settings from AppState
    const settings = {
      provider: this.appState?.get('settings.provider') || 'openai',
      model: this.appState?.get('settings.model') || 'gpt-4o-mini',
      apiKeys: this.appState?.get('settings.apiKeys') || {},
    };
    this.#llmService?.updateSettings(settings);

    this.appState?.setLoading(true);
    this.appState?.clearError();

    const startTime = Date.now();

    try {
      const response = await this.#llmService.sendMessage(promptText, {
        files: this.appState?.get('prompt.files') || [],
      });

      this.#currentResult = new LlmTestResult({
        promptId: this.appState?.get('prompt.id'),
        provider: settings.provider,
        model: response.model,
        promptText,
        response: response.content,
        tokensUsed: response.tokensUsed,
        responseTimeMs: response.responseTimeMs || (Date.now() - startTime),
      });

      // Save test result
      if (this.#storageService) {
        await this.#storageService.saveTestResult(this.#currentResult.toJSON());
      }

      this.log.info('Test completed successfully', {
        provider: settings.provider,
        model: response.model,
        responseTimeMs: this.#currentResult.responseTimeMs,
      });

    } catch (error) {
      this.#currentResult = new LlmTestResult({
        promptId: this.appState?.get('prompt.id'),
        provider: settings.provider,
        model: settings.model,
        promptText,
        error: error.message,
        responseTimeMs: Date.now() - startTime,
      });

      this.log.error('Test failed', { provider: settings.provider }, error);
    } finally {
      this.appState?.setLoading(false);
      this.render();
    }
  }

  async #copyResponse() {
    if (!this.#currentResult?.response) return;

    try {
      await navigator.clipboard.writeText(this.#currentResult.response);
      this.log.info('Response copied to clipboard');
    } catch (error) {
      this.log.error('Failed to copy response', {}, error);
      this.appState?.setError('Failed to copy to clipboard');
    }
  }

  onUnmount() {
    if (this.#autoSaveTimeout) {
      clearTimeout(this.#autoSaveTimeout);
    }
  }
}
