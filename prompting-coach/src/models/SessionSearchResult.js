/**
 * SessionSearchResult
 * Represents a paginated result set from session search
 */

export class SessionSearchResult {
  /** @type {import('./CoachingSession.js').CoachingSession[]} Matching sessions */
  sessions;

  /** @type {number} Total count of matching sessions (for pagination) */
  totalCount;

  /** @type {number} Current offset */
  offset;

  /** @type {number} Limit used for this query */
  limit;

  /** @type {import('./SessionSearchQuery.js').SessionSearchQuery} Query that produced this result */
  query;

  /**
   * Creates a new SessionSearchResult
   * @param {Object} data
   */
  constructor(data = {}) {
    this.sessions = data.sessions || [];
    this.totalCount = data.totalCount || 0;
    this.offset = data.offset || 0;
    this.limit = data.limit || 20;
    this.query = data.query || null;
  }

  /**
   * Checks if there are more results available
   * @returns {boolean}
   */
  hasMore() {
    return this.offset + this.sessions.length < this.totalCount;
  }

  /**
   * Checks if this is the first page
   * @returns {boolean}
   */
  isFirstPage() {
    return this.offset === 0;
  }

  /**
   * Gets the current page number (1-indexed)
   * @returns {number}
   */
  getCurrentPage() {
    return Math.floor(this.offset / this.limit) + 1;
  }

  /**
   * Gets the total number of pages
   * @returns {number}
   */
  getTotalPages() {
    return Math.ceil(this.totalCount / this.limit);
  }

  /**
   * Checks if results are empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.sessions.length === 0;
  }

  /**
   * Gets the range of results shown (e.g., "1-20 of 45")
   * @returns {string}
   */
  getRangeText() {
    if (this.isEmpty()) return '0 results';
    const start = this.offset + 1;
    const end = this.offset + this.sessions.length;
    return `${start}-${end} of ${this.totalCount}`;
  }

  /**
   * Creates an empty result
   * @param {import('./SessionSearchQuery.js').SessionSearchQuery} query
   * @returns {SessionSearchResult}
   */
  static empty(query = null) {
    return new SessionSearchResult({
      sessions: [],
      totalCount: 0,
      offset: 0,
      limit: query?.limit || 20,
      query,
    });
  }

  /**
   * Creates a plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      sessions: this.sessions.map(s => s.toJSON ? s.toJSON() : s),
      totalCount: this.totalCount,
      offset: this.offset,
      limit: this.limit,
      query: this.query?.toJSON() || null,
    };
  }
}
