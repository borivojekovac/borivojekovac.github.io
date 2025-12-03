/**
 * HistoryDialog
 * Session history dialog with search, filter, and session list
 */

import { BaseComponent } from './BaseComponent.js';
import { SearchBar } from './SearchBar.js';
import { SessionCard } from './SessionCard.js';
import { SessionSearchQuery } from '../models/SessionSearchQuery.js';

export class HistoryDialog extends BaseComponent {
  /** @type {HTMLDialogElement|null} */
  #dialog = null;

  /** @type {import('../services/StorageService.js').StorageService} */
  #storageService;

  /** @type {Function} Callback when session is loaded */
  #onLoadSession;

  /** @type {SearchBar|null} */
  #searchBar = null;

  /** @type {SessionCard[]} */
  #sessionCards = [];

  /** @type {import('../models/SessionSearchResult.js').SessionSearchResult|null} */
  #searchResult = null;

  /** @type {SessionSearchQuery} */
  #currentQuery;

  /** @type {string[]} */
  #availableTags = [];

  /** @type {boolean} */
  #isLoading = false;

  /**
   * Creates a HistoryPanel (dialog-based)
   * @param {HTMLDialogElement} dialogElement
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {import('../services/StorageService.js').StorageService} options.storageService
   * @param {Function} options.onLoadSession - Callback when session is loaded
   */
  constructor(dialogElement, appState, options = {}) {
    super(dialogElement, appState);
    this.#dialog = dialogElement;
    this.#storageService = options.storageService;
    this.#onLoadSession = options.onLoadSession || (() => {});
    this.#currentQuery = SessionSearchQuery.recent(20);
  }

  /**
   * Opens the history dialog
   */
  async open() {
    if (this.#dialog) {
      this.#dialog.showModal();
      this.#isLoading = true;
      this.render();
      await this.loadData();
    }
  }

  /**
   * Closes the history dialog
   */
  close() {
    this.#dialog?.close();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.#searchResult = null;
    this.#currentQuery = SessionSearchQuery.recent(20);
  }

  /**
   * Loads sessions and available tags
   */
  async loadData() {
    try {
      this.#availableTags = await this.#storageService.getAllSessionTags();
      await this.#executeSearch();
    } catch (error) {
      this.log.error('Failed to load history data', {}, error);
    } finally {
      this.#isLoading = false;
      this.render();
    }
  }

  /**
   * Executes current search query
   */
  async #executeSearch() {
    try {
      this.#searchResult = await this.#storageService.searchSessions(this.#currentQuery);
      // Only update the content area, not the whole panel (preserves SearchBar focus)
      this.#updateContent();
    } catch (error) {
      this.log.error('Failed to search sessions', {}, error);
    }
  }
  
  /**
   * Updates just the content area without re-rendering SearchBar
   */
  #updateContent() {
    const contentContainer = this.$('.history-panel__content');
    if (!contentContainer) {
      // Fall back to full render if container not found
      this.render();
      return;
    }
    
    const sessions = this.#searchResult?.sessions || [];
    let contentHtml;
    if (this.#isLoading) {
      contentHtml = this.#renderLoading();
    } else if (sessions.length === 0) {
      contentHtml = this.#renderEmpty();
    } else {
      contentHtml = this.#renderSessionList();
    }
    
    contentContainer.innerHTML = contentHtml;
    
    // Re-mount session cards
    this.#mountSessionCards();
  }
  
  /**
   * Mounts SessionCard components for each session
   */
  #mountSessionCards() {
    this.#sessionCards = [];
    const sessions = this.#searchResult?.sessions || [];
    
    for (const session of sessions) {
      const wrapper = this.$(`[data-session-id="${session.id}"]`);
      if (wrapper) {
        const card = new SessionCard(wrapper, this.appState, {
          session,
          onLoad: (s) => this.#handleLoadSession(s),
          onStarToggle: (s) => this.#handleStarToggle(s),
          onDelete: (s) => this.#handleDelete(s),
        });
        card.mount();
        this.#sessionCards.push(card);
      }
    }
    
    // Handle load more button
    const loadMoreBtn = this.$('[data-load-more]');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.#handleLoadMore());
    }
  }

  /**
   * Handles search text change
   * @param {string} text
   */
  async #handleSearch(text) {
    this.#currentQuery = this.#currentQuery.with({ searchText: text, offset: 0 });
    await this.#executeSearch();
  }

  /**
   * Handles starred filter change
   * @param {boolean|null} isStarred
   */
  async #handleStarredFilter(isStarred) {
    this.#currentQuery = this.#currentQuery.with({ isStarred, offset: 0 });
    await this.#executeSearch();
  }

  /**
   * Handles tag filter change
   * @param {string[]} tags
   */
  async #handleTagFilter(tags) {
    this.#currentQuery = this.#currentQuery.with({ tags, offset: 0 });
    await this.#executeSearch();
  }

  /**
   * Handles session load request
   * @param {Object} session
   */
  #handleLoadSession(session) {
    if (session.initialPromptText) {
      this.appState?.set('prompt.text', session.initialPromptText);
    }
    this.#onLoadSession(session);
    this.close();
  }

  /**
   * Handles star toggle request
   * @param {Object} session
   */
  async #handleStarToggle(session) {
    try {
      await this.#storageService.toggleSessionStar(session.id);
      await this.#executeSearch();
    } catch (error) {
      this.log.error('Failed to toggle star', {}, error);
    }
  }

  /**
   * Handles session delete request
   * @param {Object} session
   */
  async #handleDelete(session) {
    const title = session.title || 'Untitled';
    const confirmed = confirm(`Delete session "${title}"?\n\nThis cannot be undone.`);
    if (!confirmed) return;

    try {
      await this.#storageService.deleteSession(session.id);
      await this.#executeSearch();
      this.#availableTags = await this.#storageService.getAllSessionTags();
    } catch (error) {
      this.log.error('Failed to delete session', {}, error);
    }
  }

  /**
   * Handles pagination - load more sessions
   */
  async #handleLoadMore() {
    if (!this.#searchResult?.hasMore()) return;
    
    this.#currentQuery = this.#currentQuery.nextPage();
    const newResult = await this.#storageService.searchSessions(this.#currentQuery);
    
    if (this.#searchResult) {
      this.#searchResult.sessions = [...this.#searchResult.sessions, ...newResult.sessions];
      this.#searchResult.offset = newResult.offset;
    }
    this.#updateContent();
  }

  /**
   * Renders the loading state
   * @returns {string}
   */
  #renderLoading() {
    return `
      <div class="history-panel__loading">
        <div class="spinner"></div>
        <p>Loading sessions...</p>
      </div>
    `;
  }

  /**
   * Renders the empty state
   * @returns {string}
   */
  #renderEmpty() {
    return `
      <div class="history-panel__empty">
        <svg viewBox="0 0 24 24" fill="currentColor" class="history-panel__empty-icon">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        <p>No sessions found</p>
        <p class="history-panel__empty-hint">Complete a coaching session to see it here</p>
      </div>
    `;
  }

  /**
   * Renders the session list
   * @returns {string}
   */
  #renderSessionList() {
    const sessions = this.#searchResult?.sessions || [];
    const hasMore = this.#searchResult?.hasMore() || false;
    const rangeText = this.#searchResult?.getRangeText() || '0 results';

    return `
      <div class="history-panel__results-info">
        <span>${rangeText}</span>
      </div>
      <div class="history-panel__list" data-session-list>
        ${sessions.map(session => `
          <div class="history-panel__card-wrapper" data-session-id="${session.id}"></div>
        `).join('')}
      </div>
      ${hasMore ? `
        <div class="history-panel__load-more">
          <button class="btn btn-secondary" data-load-more>Load More</button>
        </div>
      ` : ''}
    `;
  }

  template() {
    // Only render when dialog is open
    if (!this.#dialog?.open) {
      return null;
    }

    const sessions = this.#searchResult?.sessions || [];

    let contentHtml;
    if (this.#isLoading) {
      contentHtml = this.#renderLoading();
    } else if (sessions.length === 0) {
      contentHtml = this.#renderEmpty();
    } else {
      contentHtml = this.#renderSessionList();
    }

    return `
      <div class="dialog-header">
        <h2>Session History</h2>
        <button class="btn btn-icon" id="close-history-btn" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="history-panel__search" data-search-bar></div>
        <div class="history-panel__content">
          ${contentHtml}
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-primary" id="done-history-btn">Done</button>
      </div>
    `;
  }

  onRender() {
    // Mount SearchBar component
    const searchContainer = this.$('[data-search-bar]');
    if (searchContainer) {
      this.#searchBar = new SearchBar(searchContainer, this.appState, {
        availableTags: this.#availableTags,
        onSearch: (text) => this.#handleSearch(text),
        onStarredFilter: (isStarred) => this.#handleStarredFilter(isStarred),
        onTagFilter: (tags) => this.#handleTagFilter(tags),
      });
      this.#searchBar.mount();
    }

    // Mount SessionCard components for each session
    this.#sessionCards = [];
    const sessions = this.#searchResult?.sessions || [];
    
    for (const session of sessions) {
      const wrapper = this.$(`[data-session-id="${session.id}"]`);
      if (wrapper) {
        const card = new SessionCard(wrapper, this.appState, {
          session,
          onLoad: (s) => this.#handleLoadSession(s),
          onStarToggle: (s) => this.#handleStarToggle(s),
          onDelete: (s) => this.#handleDelete(s),
        });
        card.mount();
        this.#sessionCards.push(card);
      }
    }

    // Close button handlers
    this.on('#close-history-btn', 'click', () => this.close());
    this.on('#done-history-btn', 'click', () => this.close());

    // Load more button handler
    this.on('[data-load-more]', 'click', () => this.#handleLoadMore());
  }

  onUnmount() {
    this.#searchBar?.unmount();
    this.#sessionCards.forEach(card => card.unmount());
    this.#sessionCards = [];
  }
}
