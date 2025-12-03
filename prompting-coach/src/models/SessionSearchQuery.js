/**
 * SessionSearchQuery
 * Represents search and filter criteria for session history
 */

export class SessionSearchQuery {
  /** @type {string} Text to search in title, prompt, and summary */
  searchText;

  /** @type {boolean|null} Filter by starred status (null = no filter) */
  isStarred;

  /** @type {string[]} Filter by tags (empty = no filter) */
  tags;

  /** @type {'recent'|'oldest'|'title'} Sort order */
  sortBy;

  /** @type {number} Maximum results to return */
  limit;

  /** @type {number} Offset for pagination */
  offset;

  /** @type {Date|null} Filter sessions after this date */
  startDate;

  /** @type {Date|null} Filter sessions before this date */
  endDate;

  /** @type {'active'|'completed'|'abandoned'|null} Filter by status */
  status;

  /**
   * Creates a new SessionSearchQuery
   * @param {Object} data
   */
  constructor(data = {}) {
    this.searchText = data.searchText || '';
    this.isStarred = data.isStarred ?? null;
    this.tags = data.tags || [];
    this.sortBy = data.sortBy || 'recent';
    this.limit = data.limit || 20;
    this.offset = data.offset || 0;
    this.startDate = data.startDate ? new Date(data.startDate) : null;
    this.endDate = data.endDate ? new Date(data.endDate) : null;
    this.status = data.status || null;
  }

  /**
   * Creates a query for recent sessions
   * @param {number} limit
   * @returns {SessionSearchQuery}
   */
  static recent(limit = 20) {
    return new SessionSearchQuery({ sortBy: 'recent', limit });
  }

  /**
   * Creates a query for starred sessions
   * @param {number} limit
   * @returns {SessionSearchQuery}
   */
  static starred(limit = 20) {
    return new SessionSearchQuery({ isStarred: true, sortBy: 'recent', limit });
  }

  /**
   * Creates a query for completed sessions
   * @param {number} limit
   * @returns {SessionSearchQuery}
   */
  static completed(limit = 20) {
    return new SessionSearchQuery({ status: 'completed', sortBy: 'recent', limit });
  }

  /**
   * Checks if query has any active filters
   * @returns {boolean}
   */
  hasFilters() {
    return !!(
      this.searchText ||
      this.isStarred !== null ||
      this.tags.length > 0 ||
      this.startDate ||
      this.endDate ||
      this.status
    );
  }

  /**
   * Creates a copy with updated properties
   * @param {Object} updates
   * @returns {SessionSearchQuery}
   */
  with(updates) {
    return new SessionSearchQuery({ ...this.toJSON(), ...updates });
  }

  /**
   * Resets all filters
   * @returns {SessionSearchQuery}
   */
  reset() {
    return new SessionSearchQuery({ sortBy: this.sortBy, limit: this.limit });
  }

  /**
   * Gets the next page query
   * @returns {SessionSearchQuery}
   */
  nextPage() {
    return this.with({ offset: this.offset + this.limit });
  }

  /**
   * Gets the previous page query
   * @returns {SessionSearchQuery}
   */
  previousPage() {
    return this.with({ offset: Math.max(0, this.offset - this.limit) });
  }

  /**
   * Creates a plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      searchText: this.searchText,
      isStarred: this.isStarred,
      tags: this.tags,
      sortBy: this.sortBy,
      limit: this.limit,
      offset: this.offset,
      startDate: this.startDate?.toISOString() || null,
      endDate: this.endDate?.toISOString() || null,
      status: this.status,
    };
  }

  /**
   * Creates a SessionSearchQuery from stored data
   * @param {Object} data
   * @returns {SessionSearchQuery}
   */
  static fromJSON(data) {
    return new SessionSearchQuery(data);
  }
}
