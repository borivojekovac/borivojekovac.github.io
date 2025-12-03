/**
 * SearchBar
 * Search input with filter chips for session history
 */

import { BaseComponent } from './BaseComponent.js';

export class SearchBar extends BaseComponent {
  /** @type {Function} Callback when search changes */
  #onSearch;

  /** @type {Function} Callback when starred filter changes */
  #onStarredFilter;

  /** @type {Function} Callback when tag filter changes */
  #onTagFilter;

  /** @type {string} Current search text */
  #searchText = '';

  /** @type {boolean|null} Current starred filter */
  #starredFilter = null;

  /** @type {string[]} Current tag filters */
  #tagFilters = [];

  /** @type {string[]} Available tags */
  #availableTags = [];

  /** @type {number} Debounce timer */
  #debounceTimer = null;

  /**
   * Creates a SearchBar
   * @param {HTMLElement} container
   * @param {import('../state/AppState.js').AppState} appState
   * @param {Object} options
   * @param {Function} options.onSearch - Callback when search text changes
   * @param {Function} options.onStarredFilter - Callback when starred filter changes
   * @param {Function} options.onTagFilter - Callback when tag filter changes
   * @param {string[]} options.availableTags - Available tags for filtering
   */
  constructor(container, appState, options = {}) {
    super(container, appState);
    this.#onSearch = options.onSearch || (() => {});
    this.#onStarredFilter = options.onStarredFilter || (() => {});
    this.#onTagFilter = options.onTagFilter || (() => {});
    this.#availableTags = options.availableTags || [];
  }

  /**
   * Updates available tags
   * @param {string[]} tags
   */
  setAvailableTags(tags) {
    this.#availableTags = tags;
    this.render();
  }

  /**
   * Gets current search text
   * @returns {string}
   */
  getSearchText() {
    return this.#searchText;
  }

  /**
   * Gets current starred filter
   * @returns {boolean|null}
   */
  getStarredFilter() {
    return this.#starredFilter;
  }

  /**
   * Gets current tag filters
   * @returns {string[]}
   */
  getTagFilters() {
    return [...this.#tagFilters];
  }

  /**
   * Clears all filters
   */
  clearFilters() {
    const hadSearch = !!this.#searchText;
    const hadStarred = this.#starredFilter !== null;
    const hadTags = this.#tagFilters.length > 0;
    
    this.#searchText = '';
    this.#starredFilter = null;
    this.#tagFilters = [];
    
    // Clear any pending debounce
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    
    this.render();
    
    // Call all callbacks to notify parent of cleared state
    if (hadSearch) this.#onSearch('');
    if (hadStarred) this.#onStarredFilter(null);
    if (hadTags) this.#onTagFilter([]);
    
    this.#emitChange();
  }

  /**
   * Handles search input change
   * @param {string} text
   */
  #handleSearchInput(text) {
    this.#searchText = text;
    
    // Update Clear filters button visibility without full re-render
    this.#updateClearFiltersVisibility();
    
    // Debounce search
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }
    this.#debounceTimer = setTimeout(() => {
      this.#onSearch(this.#searchText);
    }, 300);
  }
  
  /**
   * Updates the Clear filters button visibility without re-rendering
   */
  #updateClearFiltersVisibility() {
    const filtersContainer = this.$('.search-bar__filters');
    if (!filtersContainer) return;
    
    const hasFilters = this.hasActiveFilters();
    let clearBtn = this.$('.filter-chip--clear');
    
    if (hasFilters && !clearBtn) {
      // Add Clear filters button
      const btn = document.createElement('button');
      btn.className = 'filter-chip filter-chip--clear';
      btn.dataset.filter = 'clear';
      btn.title = 'Clear all filters';
      btn.textContent = 'Clear filters';
      btn.addEventListener('click', () => this.clearFilters());
      filtersContainer.appendChild(btn);
    } else if (!hasFilters && clearBtn) {
      // Remove Clear filters button
      clearBtn.remove();
    }
  }

  /**
   * Handles starred filter toggle
   */
  #handleStarredToggle() {
    // Cycle: null -> true -> null
    this.#starredFilter = this.#starredFilter === null ? true : null;
    this.render();
    this.#onStarredFilter(this.#starredFilter);
  }

  /**
   * Handles tag filter toggle
   * @param {string} tag
   */
  #handleTagToggle(tag) {
    const index = this.#tagFilters.indexOf(tag);
    if (index === -1) {
      this.#tagFilters.push(tag);
    } else {
      this.#tagFilters.splice(index, 1);
    }
    this.render();
    this.#onTagFilter(this.#tagFilters);
  }

  /**
   * Emits change event with current state
   */
  #emitChange() {
    this.emit('search:change', {
      searchText: this.#searchText,
      starredFilter: this.#starredFilter,
      tagFilters: this.#tagFilters,
    });
  }

  /**
   * Checks if any filters are active
   * @returns {boolean}
   */
  hasActiveFilters() {
    return !!(this.#searchText || this.#starredFilter !== null || this.#tagFilters.length > 0);
  }

  template() {
    const starredActive = this.#starredFilter === true;
    const hasFilters = this.hasActiveFilters();

    return `
      <div class="search-bar">
        <div class="search-bar__input-wrapper">
          <svg class="search-bar__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            type="text" 
            class="search-bar__input" 
            placeholder="Search sessions..."
            value="${this.escapeHtml(this.#searchText)}"
            aria-label="Search sessions"
          />
          ${this.#searchText ? `
            <button class="search-bar__clear" aria-label="Clear search" title="Clear search">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          ` : ''}
        </div>
        
        <div class="search-bar__filters">
          <button 
            class="filter-chip ${starredActive ? 'filter-chip--active' : ''}"
            data-filter="starred"
            aria-pressed="${starredActive}"
            title="${starredActive ? 'Show all' : 'Show starred only'}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="${starredActive 
                ? 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
                : 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z'
              }"/>
            </svg>
            Starred
          </button>
          
          ${this.#availableTags.map(tag => {
            const isActive = this.#tagFilters.includes(tag);
            return `
              <button 
                class="filter-chip ${isActive ? 'filter-chip--active' : ''}"
                data-filter="tag"
                data-tag="${this.escapeHtml(tag)}"
                aria-pressed="${isActive}"
              >
                ${this.escapeHtml(tag)}
              </button>
            `;
          }).join('')}
          
          ${hasFilters ? `
            <button class="filter-chip filter-chip--clear" data-filter="clear" title="Clear all filters">
              Clear filters
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  onRender() {
    // Handle search input
    const input = this.$('.search-bar__input');
    if (input) {
      input.addEventListener('input', (e) => {
        this.#handleSearchInput(e.target.value);
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.#searchText = '';
          input.value = '';
          this.#onSearch('');
        }
      });
    }

    // Handle clear search button
    this.on('.search-bar__clear', 'click', () => {
      this.#searchText = '';
      this.render();
      this.#onSearch('');
    });

    // Handle filter chips - attach to all chips since this.on() only gets first match
    const filterChips = this.container.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const filter = chip.dataset.filter;
        
        if (filter === 'starred') {
          this.#handleStarredToggle();
        } else if (filter === 'tag') {
          const tag = chip.dataset.tag;
          if (tag) this.#handleTagToggle(tag);
        } else if (filter === 'clear') {
          this.clearFilters();
        }
      });
    });
  }
}
