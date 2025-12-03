/**
 * BurgerMenu
 * Navigation drawer accessed via hamburger icon
 * Provides access to: New Session, History, Settings
 */

import { BaseComponent } from './BaseComponent.js';

export class BurgerMenu extends BaseComponent {
  #isOpen = false;
  #onSettings;
  #onHistory;
  #onNewSession;

  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#onSettings = options.onSettings || (() => {});
    this.#onHistory = options.onHistory || (() => {});
    this.#onNewSession = options.onNewSession || (() => {});
  }

  open() {
    this.#isOpen = true;
    this.render();
    requestAnimationFrame(() => this.$('.burger-menu__item')?.focus());
  }

  close() {
    this.#isOpen = false;
    this.render();
  }

  toggle() {
    this.#isOpen ? this.close() : this.open();
  }

  isOpen() {
    return this.#isOpen;
  }

  #renderTriggerButton() {
    return `
      <button class="burger-menu__trigger" aria-label="Open menu" aria-expanded="${this.#isOpen}" title="Menu">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <rect x="3" y="6" width="18" height="2" rx="1"/>
          <rect x="3" y="11" width="18" height="2" rx="1"/>
          <rect x="3" y="16" width="18" height="2" rx="1"/>
        </svg>
      </button>
    `;
  }

  #renderDrawer() {
    if (!this.#isOpen) return '';

    return `
      <div class="burger-menu__backdrop"></div>
      <nav class="burger-menu__drawer" role="menu">
        <header class="burger-menu__header">
          <h2 class="burger-menu__title">Prompting Coach</h2>
          <button class="burger-menu__close-btn" aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M18.3 5.71a1 1 0 00-1.42 0L12 10.59 7.12 5.71a1 1 0 00-1.42 1.42L10.59 12l-4.89 4.88a1 1 0 101.42 1.42L12 13.41l4.88 4.89a1 1 0 001.42-1.42L13.41 12l4.89-4.88a1 1 0 000-1.41z"/>
            </svg>
          </button>
        </header>
        <ul class="burger-menu__list">
          <li>
            <button class="burger-menu__item" data-action="new-session" role="menuitem">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z"/>
              </svg>
              <span>New Session</span>
            </button>
          </li>
          <li>
            <button class="burger-menu__item" data-action="history" role="menuitem">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
              </svg>
              <span>History</span>
            </button>
          </li>
          <li class="burger-menu__divider" role="separator"></li>
          <li>
            <button class="burger-menu__item" data-action="settings" role="menuitem">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 15.5A3.5 3.5 0 1115.5 12 3.5 3.5 0 0112 15.5zm7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.49.49 0 0014 2h-4a.49.49 0 00-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.5.5 0 00.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 00-.12.64l2 3.46a.5.5 0 00.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.25.42.49.42h4c.24 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1a.5.5 0 00.61-.22l2-3.46a.5.5 0 00-.12-.64l-2.11-1.65z"/>
              </svg>
              <span>Settings</span>
            </button>
          </li>
        </ul>
        <footer class="burger-menu__footer">
          <small>v1.0.0</small>
        </footer>
      </nav>
    `;
  }

  template() {
    return `
      <div class="burger-menu ${this.#isOpen ? 'burger-menu--open' : ''}">
        ${this.#renderTriggerButton()}
        ${this.#renderDrawer()}
      </div>
    `;
  }

  onRender() {
    this.log.debug('BurgerMenu.onRender called', { isOpen: this.#isOpen });
    
    this.on('.burger-menu__trigger', 'click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Only attach these handlers when menu is open (elements exist)
    if (this.#isOpen) {
      this.on('.burger-menu__close-btn', 'click', () => this.close());
      this.on('.burger-menu__backdrop', 'click', () => this.close());

      // Attach handlers to all menu items
      const menuItems = this.container.querySelectorAll('.burger-menu__item');
      this.log.debug('Found menu items', { count: menuItems.length });
      
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.action;
          this.log.debug('Menu item clicked', { action });
          
          // Store callbacks before closing (which re-renders and loses context)
          const onSettings = this.#onSettings;
          const onHistory = this.#onHistory;
          const onNewSession = this.#onNewSession;
          
          // Close menu first
          this.close();
          
          // Then execute action using stored callbacks
          if (action === 'settings') {
            this.log.debug('Calling onSettings callback');
            onSettings();
          } else if (action === 'history') {
            onHistory();
          } else if (action === 'new-session') {
            onNewSession();
          }
        });
      });
    }

    if (this.#isOpen) {
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    }
  }
}
