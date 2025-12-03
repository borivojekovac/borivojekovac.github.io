/**
 * SessionCard
 * Displays a single session in the history list
 */

import { BaseComponent } from './BaseComponent.js';

export class SessionCard extends BaseComponent {
  /** @type {Object} Session data */
  #session;

  /** @type {Function} Callback when card is clicked (load session) */
  #onLoad;

  /** @type {Function} Callback when star is toggled */
  #onStarToggle;

  /** @type {Function} Callback when delete is requested */
  #onDelete;

  /** @type {Function} Callback when tags are edited */
  #onTagsEdit;

  /**
   * Creates a SessionCard
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {Object} options.session - Session data
   * @param {Function} options.onLoad - Callback when card clicked
   * @param {Function} options.onStarToggle - Callback when star toggled
   * @param {Function} options.onDelete - Callback when delete requested
   * @param {Function} options.onTagsEdit - Callback when tags edited
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#session = options.session || {};
    this.#onLoad = options.onLoad || (() => {});
    this.#onStarToggle = options.onStarToggle || (() => {});
    this.#onDelete = options.onDelete || (() => {});
    this.#onTagsEdit = options.onTagsEdit || (() => {});
  }

  /**
   * Updates session data
   * @param {Object} session
   */
  setSession(session) {
    this.#session = session;
    this.render();
  }

  /**
   * Gets the session ID
   * @returns {string}
   */
  getSessionId() {
    return this.#session.id;
  }

  /**
   * Formats a date for display
   * @param {string|Date} date
   * @returns {string}
   */
  #formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'long' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  /**
   * Gets completion percentage
   * @returns {number}
   */
  #getCompletionPercent() {
    const session = this.#session;
    if (!session.evaluationState) return 0;
    
    // Count passed + skipped vs total principles
    let completed = 0;
    const total = 15; // Total principles
    
    if (typeof session.evaluationState === 'object') {
      for (const state of Object.values(session.evaluationState)) {
        if (state.status === 'passed' || state.status === 'skipped') {
          completed++;
        }
      }
    }
    
    return Math.round((completed / total) * 100);
  }

  /**
   * Truncates text to specified length
   * @param {string} text
   * @param {number} maxLength
   * @returns {string}
   */
  #truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength).trim() + '...';
  }

  /**
   * Gets status badge class and text
   * @returns {{class: string, text: string}}
   */
  #getStatusBadge() {
    const status = this.#session.status;
    switch (status) {
      case 'completed':
        return { class: 'badge--success', text: 'Completed' };
      case 'abandoned':
        return { class: 'badge--warning', text: 'Abandoned' };
      case 'active':
      default:
        return { class: 'badge--info', text: 'In Progress' };
    }
  }

  template() {
    const session = this.#session;
    const title = session.title || this.#truncate(session.initialPromptText, 50) || 'Untitled Session';
    const date = this.#formatDate(session.startedAt);
    const preview = this.#truncate(session.initialPromptText, 120);
    const completion = this.#getCompletionPercent();
    const isStarred = session.isStarred || false;
    const tags = session.tags || [];
    const statusBadge = this.#getStatusBadge();

    return `
      <article class="session-card" data-session-id="${session.id}" tabindex="0" role="button" aria-label="Load session: ${this.escapeHtml(title)}">
        <div class="session-card__header">
          <h3 class="session-card__title">${this.escapeHtml(title)}</h3>
          <button 
            class="session-card__star ${isStarred ? 'session-card__star--active' : ''}"
            aria-label="${isStarred ? 'Remove from starred' : 'Add to starred'}"
            aria-pressed="${isStarred}"
            title="${isStarred ? 'Unstar' : 'Star'}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="${isStarred 
                ? 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
                : 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z'
              }"/>
            </svg>
          </button>
        </div>
        
        <div class="session-card__meta">
          <span class="session-card__date">${date}</span>
          <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
          <span class="session-card__completion">${completion}% complete</span>
        </div>
        
        ${preview ? `
          <p class="session-card__preview">${this.escapeHtml(preview)}</p>
        ` : ''}
        
        ${tags.length > 0 ? `
          <div class="session-card__tags">
            ${tags.map(tag => `
              <span class="tag">${this.escapeHtml(tag)}</span>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="session-card__actions">
          <button class="btn btn-text session-card__delete" aria-label="Delete session" title="Delete">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </article>
    `;
  }

  onRender() {
    // Handle card click (load session)
    const card = this.$('.session-card');
    if (card) {
      card.addEventListener('click', (e) => {
        // Don't trigger load if clicking on star or delete
        if (e.target.closest('.session-card__star') || e.target.closest('.session-card__delete')) {
          return;
        }
        this.#onLoad(this.#session);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#onLoad(this.#session);
        }
      });
    }

    // Handle star toggle
    this.on('.session-card__star', 'click', (e) => {
      e.stopPropagation();
      this.#onStarToggle(this.#session);
    });

    // Handle delete
    this.on('.session-card__delete', 'click', (e) => {
      e.stopPropagation();
      this.#onDelete(this.#session);
    });
  }
}
