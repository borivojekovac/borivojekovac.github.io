/**
 * MaximizeToggle
 * Reusable button component for maximize/restore functionality
 */

import { BaseComponent } from './BaseComponent.js';

export class MaximizeToggle extends BaseComponent {
  /** @type {string} Panel ID this toggle controls */
  #panelId;

  /** @type {Function} Callback when toggle is clicked */
  #onToggle;

  /**
   * Creates a MaximizeToggle
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {string} options.panelId - Which panel this toggle controls
   * @param {Function} options.onToggle - Callback when toggled
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#panelId = options.panelId || 'unknown';
    this.#onToggle = options.onToggle || (() => {});
    this.watchState(['ui.maximizedPanel']);
  }

  /**
   * Checks if this panel is currently maximized
   * @returns {boolean}
   */
  isMaximized() {
    return this.appState?.get('ui.maximizedPanel') === this.#panelId;
  }

  /**
   * Gets the SVG icon for maximize/restore
   * @param {boolean} isMaximized
   * @returns {string}
   */
  #getIcon(isMaximized) {
    if (isMaximized) {
      // Fullscreen exit icon (Material Design)
      return `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`;
    }
    // Fullscreen icon (Material Design)
    return `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
  }

  template() {
    const isMaximized = this.isMaximized();
    const label = isMaximized ? 'Restore panel' : 'Maximize panel';

    return `
      <button 
        class="maximize-toggle ${isMaximized ? 'maximize-toggle--active' : ''}"
        aria-label="${label}"
        aria-pressed="${isMaximized}"
        data-panel-id="${this.#panelId}"
        title="${label}"
      >
        <span class="maximize-toggle__icon">${this.#getIcon(isMaximized)}</span>
      </button>
    `;
  }

  onRender() {
    this.on('.maximize-toggle', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#onToggle(this.#panelId);
    });
  }
}
