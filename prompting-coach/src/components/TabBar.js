/**
 * TabBar
 * Navigation tabs component for switching between panels
 * Supports both full tab mode (legacy) and minimal mode (unified layout)
 */

import { BaseComponent } from './BaseComponent.js';

const TABS = [
  { id: 'editor', label: 'Workspace', icon: 'edit' },
  { id: 'coach', label: 'Coach', icon: 'school' },
  { id: 'history', label: 'History', icon: 'history' },
];

// Minimal tabs for unified layout - only Settings and History
const MINIMAL_TABS = [
  { id: 'history', label: 'History', icon: 'history' },
];

export class TabBar extends BaseComponent {
  /** @type {boolean} Whether to use minimal mode */
  #minimal = false;

  /**
   * Creates a TabBar
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {boolean} options.minimal - Use minimal mode for unified layout
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#minimal = options.minimal || false;
    this.watchState(['ui.activeTab']);
  }

  /**
   * Gets SVG icon markup for a tab
   * @param {string} iconName
   * @returns {string}
   */
  #getIcon(iconName) {
    const icons = {
      edit: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
      school: '<path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>',
      history: '<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',
      play: '<path d="M8 5v14l11-7z"/>',
    };
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">${icons[iconName] || ''}</svg>`;
  }

  template() {
    const activeTab = this.appState?.get('ui.activeTab') || 'editor';
    const tabs = this.#minimal ? MINIMAL_TABS : TABS;

    const tabsHtml = tabs.map(tab => {
      const isActive = tab.id === activeTab;
      return `
        <button 
          class="tab ${isActive ? 'active' : ''}"
          role="tab"
          aria-selected="${isActive}"
          aria-controls="panel-${tab.id}"
          data-tab="${tab.id}"
        >
          ${this.#getIcon(tab.icon)}
          <span>${tab.label}</span>
        </button>
      `;
    }).join('');

    const containerClass = this.#minimal ? 'tabs tabs--minimal' : 'tabs';
    return `<div class="${containerClass}" role="tablist">${tabsHtml}</div>`;
  }

  onRender() {
    const tabs = this.$$('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (event) => {
        const tabId = event.currentTarget.dataset.tab;
        this.#selectTab(tabId);
      });
    });
  }

  /**
   * Selects a tab and updates state
   * @param {string} tabId
   */
  #selectTab(tabId) {
    if (this.appState) {
      this.appState.set('ui.activeTab', tabId);
    }
    this.log.debug('Tab selected', { tabId });
  }
}
