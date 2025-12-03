/**
 * StorageService
 * Manages persistence of prompts, sessions, and settings using IndexedDB and localStorage
 */

import { StorageError, StorageInitError } from '../models/errors/StorageError.js';
import { LogService } from './LogService.js';

const DB_NAME = 'PromptingCoachDB';
const DB_VERSION = 1;

const STORES = {
  prompts: { keyPath: 'id', indexes: ['createdAt', 'title', 'updatedAt'] },
  sessions: { 
    keyPath: 'id', 
    indexes: ['promptId', 'status', 'startedAt', 'updatedAt', 'completedAt', 'isStarred', 'title']
  },
  tests: { keyPath: 'id', indexes: ['promptId', 'testedAt'] },
  activeWork: { keyPath: 'key' },
};

const SETTINGS_KEY = 'prompting-coach-settings';
const UI_STATE_KEY = 'prompting-coach-ui-state';

const DEFAULT_SETTINGS = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKeys: {},
  logLevel: 'info',
  theme: 'system',
  autoSave: true,
};

const DEFAULT_UI_STATE = {
  activeTab: 'editor',
  scrollTop: 0,
  settingsOpen: false,
  expandedMessageId: null,
};

export class StorageService {
  /** @type {IDBDatabase|null} */
  #db = null;
  
  /** @type {LogService} */
  #log;
  
  /** @type {boolean} */
  #initialized = false;

  constructor() {
    this.#log = LogService.getInstance();
  }

  /**
   * Initializes the database connection
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.#initialized) return;

    this.#log.debug('Initializing StorageService');

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        const error = new StorageInitError(request.error?.message || 'Unknown error');
        this.#log.error('Failed to open database', {}, error);
        reject(error);
      };

      request.onsuccess = () => {
        this.#db = request.result;
        this.#initialized = true;
        this.#log.info('StorageService initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = /** @type {IDBOpenDBRequest} */ (event.target).result;
        this.#createStores(db);
      };
    });
  }

  /**
   * Creates object stores during database upgrade
   * @param {IDBDatabase} db
   */
  #createStores(db) {
    for (const [storeName, config] of Object.entries(STORES)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
        
        for (const indexName of config.indexes || []) {
          if (typeof indexName === 'string') {
            store.createIndex(indexName, indexName, { unique: false });
          } else {
            store.createIndex(indexName.name, indexName.name, { 
              unique: false, 
              multiEntry: indexName.multiEntry || false 
            });
          }
        }
        
        this.#log.debug(`Created store: ${storeName}`);
      }
    }
  }

  /**
   * Gets a transaction for the specified stores
   * @param {string|string[]} storeNames
   * @param {'readonly'|'readwrite'} mode
   * @returns {IDBTransaction}
   */
  #getTransaction(storeNames, mode = 'readonly') {
    if (!this.#db) {
      throw new StorageError('Database not initialized', { operation: 'transaction' });
    }
    return this.#db.transaction(storeNames, mode);
  }

  /**
   * Generates a unique ID
   * @returns {string}
   */
  #generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  // ========================================
  // PROMPT METHODS
  // ========================================

  /**
   * Saves a prompt to storage
   * @param {Object} prompt - The prompt to save
   * @returns {Promise<Object>}
   */
  async savePrompt(prompt) {
    const now = new Date();
    const record = {
      ...prompt,
      id: prompt.id || this.#generateId(),
      createdAt: prompt.createdAt || now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('prompts', 'readwrite');
      const store = tx.objectStore('prompts');
      const request = store.put(record);

      request.onsuccess = () => {
        this.#log.debug('Prompt saved', { id: record.id });
        resolve(record);
      };
      request.onerror = () => {
        reject(StorageError.writeFailed('prompts', record.id));
      };
    });
  }

  /**
   * Gets a prompt by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getPrompt(id) {
    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('prompts');
      const store = tx.objectStore('prompts');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(StorageError.readFailed('prompts', id));
    });
  }

  /**
   * Gets all prompts
   * @param {Object} [options]
   * @param {number} [options.limit=50]
   * @param {string} [options.sortBy='updatedAt']
   * @param {'asc'|'desc'} [options.sortOrder='desc']
   * @returns {Promise<Object[]>}
   */
  async getPrompts(options = {}) {
    const { limit = 50, sortBy = 'updatedAt', sortOrder = 'desc' } = options;

    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('prompts');
      const store = tx.objectStore('prompts');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        // Sort
        results.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return sortOrder === 'desc' ? -cmp : cmp;
        });

        // Limit
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(StorageError.readFailed('prompts'));
    });
  }

  /**
   * Deletes a prompt by ID
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deletePrompt(id) {
    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('prompts', 'readwrite');
      const store = tx.objectStore('prompts');
      const request = store.delete(id);

      request.onsuccess = () => {
        this.#log.debug('Prompt deleted', { id });
        resolve(true);
      };
      request.onerror = () => reject(StorageError.deleteFailed('prompts', id));
    });
  }

  // ========================================
  // SETTINGS METHODS
  // ========================================

  /**
   * Gets application settings
   * @returns {Object}
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      this.#log.warn('Failed to parse settings', {}, error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Saves application settings
   * @param {Object} settings
   * @returns {Object}
   */
  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      this.#log.debug('Settings saved');
    } catch (error) {
      this.#log.error('Failed to save settings', {}, error);
      throw StorageError.writeFailed('settings');
    }
    
    return updated;
  }

  /**
   * Clears all settings
   * @returns {Object}
   */
  clearSettings() {
    localStorage.removeItem(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS };
  }

  // ========================================
  // UI STATE METHODS
  // ========================================

  /**
   * Gets the UI state from sessionStorage
   * @returns {Object}
   */
  getUIState() {
    try {
      const stored = sessionStorage.getItem(UI_STATE_KEY);
      if (stored) {
        return { ...DEFAULT_UI_STATE, ...JSON.parse(stored) };
      }
    } catch (error) {
      this.#log.warn('Failed to parse UI state', {}, error);
    }
    return { ...DEFAULT_UI_STATE };
  }

  /**
   * Saves UI state to sessionStorage
   * @param {Object} state
   * @returns {Object}
   */
  saveUIState(state) {
    const current = this.getUIState();
    const updated = { ...current, ...state };
    
    try {
      sessionStorage.setItem(UI_STATE_KEY, JSON.stringify(updated));
    } catch (error) {
      this.#log.warn('Failed to save UI state', {}, error);
    }
    
    return updated;
  }

  /**
   * Clears UI state
   * @returns {Object}
   */
  clearUIState() {
    sessionStorage.removeItem(UI_STATE_KEY);
    return { ...DEFAULT_UI_STATE };
  }

  // ========================================
  // ACTIVE WORK STATE METHODS
  // ========================================

  /**
   * Gets the current active work state for refresh recovery
   * @returns {Promise<Object|null>}
   */
  async getActiveWorkState() {
    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('activeWork');
      const store = tx.objectStore('activeWork');
      const request = store.get('current');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        this.#log.warn('Failed to get active work state');
        resolve(null);
      };
    });
  }

  /**
   * Saves the current active work state
   * @param {Object} state
   * @returns {Promise<void>}
   */
  async saveActiveWorkState(state) {
    const record = {
      ...state,
      key: 'current',
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('activeWork', 'readwrite');
      const store = tx.objectStore('activeWork');
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        this.#log.warn('Failed to save active work state');
        resolve(); // Don't fail the app for this
      };
    });
  }

  /**
   * Clears the active work state
   * @returns {Promise<void>}
   */
  async clearActiveWorkState() {
    return new Promise((resolve) => {
      const tx = this.#getTransaction('activeWork', 'readwrite');
      const store = tx.objectStore('activeWork');
      const request = store.delete('current');

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  // ========================================
  // SESSION METHODS
  // ========================================

  /**
   * Saves a coaching session
   * @param {Object} session
   * @returns {Promise<Object>}
   */
  async saveSession(session) {
    const now = new Date();
    const record = {
      ...session,
      id: session.id || this.#generateId(),
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const request = store.put(record);

      request.onsuccess = () => {
        this.#log.debug('Session saved', { id: record.id });
        resolve(record);
      };
      request.onerror = () => reject(StorageError.writeFailed('sessions', record.id));
    });
  }

  /**
   * Gets a session by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getSession(id) {
    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('sessions');
      const store = tx.objectStore('sessions');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(StorageError.readFailed('sessions', id));
    });
  }

  /**
   * Gets all sessions
   * @param {Object} [options]
   * @param {number} [options.limit=50]
   * @param {string} [options.sortBy='updatedAt']
   * @param {'asc'|'desc'} [options.sortOrder='desc']
   * @param {string} [options.status] - Filter by status
   * @returns {Promise<Object[]>}
   */
  async getSessions(options = {}) {
    const { limit = 50, sortBy = 'updatedAt', sortOrder = 'desc', status } = options;

    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('sessions');
      const store = tx.objectStore('sessions');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        // Filter by status if specified
        if (status) {
          results = results.filter(s => s.status === status);
        }
        
        // Sort
        results.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return sortOrder === 'desc' ? -cmp : cmp;
        });

        // Limit
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(StorageError.readFailed('sessions'));
    });
  }

  /**
   * Gets active sessions
   * @returns {Promise<Object[]>}
   */
  async getActiveSessions() {
    return this.getSessions({ status: 'active', limit: 10 });
  }

  /**
   * Gets completed sessions
   * @param {number} [limit=50]
   * @returns {Promise<Object[]>}
   */
  async getCompletedSessions(limit = 50) {
    return this.getSessions({ status: 'completed', limit, sortBy: 'completedAt' });
  }

  /**
   * Deletes a session by ID
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteSession(id) {
    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const request = store.delete(id);

      request.onsuccess = () => {
        this.#log.debug('Session deleted', { id });
        resolve(true);
      };
      request.onerror = () => reject(StorageError.deleteFailed('sessions', id));
    });
  }

  /**
   * Updates a session's starred status
   * @param {string} id
   * @param {boolean} isStarred
   * @returns {Promise<Object|null>}
   */
  async updateSessionStar(id, isStarred) {
    const session = await this.getSession(id);
    if (!session) return null;

    session.isStarred = isStarred;
    session.updatedAt = new Date();
    return this.saveSession(session);
  }

  /**
   * Gets starred sessions
   * @param {number} [limit=50]
   * @returns {Promise<Object[]>}
   */
  async getStarredSessions(limit = 50) {
    const sessions = await this.getSessions({ limit: 1000 });
    return sessions.filter(s => s.isStarred).slice(0, limit);
  }

  // ========================================
  // TEST RESULT METHODS
  // ========================================

  /**
   * Saves an LLM test result
   * @param {Object} result
   * @returns {Promise<Object>}
   */
  async saveTestResult(result) {
    const record = {
      ...result,
      id: result.id || this.#generateId(),
      testedAt: result.testedAt || new Date(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('tests', 'readwrite');
      const store = tx.objectStore('tests');
      const request = store.put(record);

      request.onsuccess = () => {
        this.#log.debug('Test result saved', { id: record.id });
        resolve(record);
      };
      request.onerror = () => reject(StorageError.writeFailed('tests', record.id));
    });
  }

  /**
   * Gets test results for a prompt
   * @param {string} promptId
   * @param {number} [limit=10]
   * @returns {Promise<Object[]>}
   */
  async getTestResults(promptId, limit = 10) {
    return new Promise((resolve, reject) => {
      const tx = this.#getTransaction('tests');
      const store = tx.objectStore('tests');
      const index = store.index('promptId');
      const request = index.getAll(promptId);

      request.onsuccess = () => {
        let results = request.result || [];
        results.sort((a, b) => new Date(b.testedAt) - new Date(a.testedAt));
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(StorageError.readFailed('tests'));
    });
  }

  // ========================================
  // SESSION SEARCH & MANAGEMENT (US3)
  // ========================================

  /**
   * Searches sessions based on query criteria (T055)
   * @param {import('../models/SessionSearchQuery.js').SessionSearchQuery} query
   * @returns {Promise<import('../models/SessionSearchResult.js').SessionSearchResult>}
   */
  async searchSessions(query) {
    const { SessionSearchResult } = await import('../models/SessionSearchResult.js');
    
    try {
      // Get all sessions first (IndexedDB doesn't support complex queries)
      const allSessions = await this.getSessions({ limit: 10000 });
      
      // Apply filters
      let filtered = allSessions.filter(session => {
        // Status filter
        if (query.status && session.status !== query.status) return false;
        
        // Starred filter
        if (query.isStarred !== null && session.isStarred !== query.isStarred) return false;
        
        // Tags filter (session must have ALL specified tags)
        if (query.tags.length > 0) {
          const sessionTags = session.tags || [];
          if (!query.tags.every(tag => sessionTags.includes(tag))) return false;
        }
        
        // Date range filter
        if (query.startDate && new Date(session.startedAt) < query.startDate) return false;
        if (query.endDate && new Date(session.startedAt) > query.endDate) return false;
        
        // Text search (title, prompt, summary)
        if (query.searchText) {
          const searchLower = query.searchText.toLowerCase();
          const title = (session.title || '').toLowerCase();
          const prompt = (session.initialPromptText || '').toLowerCase();
          const summary = (session.summary || '').toLowerCase();
          if (!title.includes(searchLower) && 
              !prompt.includes(searchLower) && 
              !summary.includes(searchLower)) {
            return false;
          }
        }
        
        return true;
      });
      
      // Sort
      filtered.sort((a, b) => {
        switch (query.sortBy) {
          case 'oldest':
            return new Date(a.startedAt) - new Date(b.startedAt);
          case 'title':
            return (a.title || '').localeCompare(b.title || '');
          case 'recent':
          default:
            return new Date(b.startedAt) - new Date(a.startedAt);
        }
      });
      
      // Pagination
      const totalCount = filtered.length;
      const paginated = filtered.slice(query.offset, query.offset + query.limit);
      
      return new SessionSearchResult({
        sessions: paginated,
        totalCount,
        offset: query.offset,
        limit: query.limit,
        query,
      });
    } catch (error) {
      this.#log.error('Failed to search sessions', {}, error);
      return SessionSearchResult.empty(query);
    }
  }

  /**
   * Toggles starred status for a session (T056)
   * @param {string} sessionId
   * @returns {Promise<boolean>} New starred status
   */
  async toggleSessionStar(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw StorageError.notFound('session', sessionId);
    }
    
    session.isStarred = !session.isStarred;
    session.updatedAt = new Date().toISOString();
    await this.saveSession(session);
    
    this.#log.debug('Session star toggled', { sessionId, isStarred: session.isStarred });
    return session.isStarred;
  }

  /**
   * Adds tags to a session (T057)
   * @param {string} sessionId
   * @param {string[]} tags
   * @returns {Promise<string[]>} Updated tags array
   */
  async addSessionTags(sessionId, tags) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw StorageError.notFound('session', sessionId);
    }
    
    const existingTags = session.tags || [];
    const normalizedTags = tags.map(t => t.trim().toLowerCase()).filter(Boolean);
    const newTags = [...new Set([...existingTags, ...normalizedTags])];
    
    session.tags = newTags;
    session.updatedAt = new Date().toISOString();
    await this.saveSession(session);
    
    this.#log.debug('Session tags added', { sessionId, tags: newTags });
    return newTags;
  }

  /**
   * Removes tags from a session (T057)
   * @param {string} sessionId
   * @param {string[]} tags
   * @returns {Promise<string[]>} Updated tags array
   */
  async removeSessionTags(sessionId, tags) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw StorageError.notFound('session', sessionId);
    }
    
    const existingTags = session.tags || [];
    const tagsToRemove = tags.map(t => t.trim().toLowerCase());
    const newTags = existingTags.filter(t => !tagsToRemove.includes(t));
    
    session.tags = newTags;
    session.updatedAt = new Date().toISOString();
    await this.saveSession(session);
    
    this.#log.debug('Session tags removed', { sessionId, tags: newTags });
    return newTags;
  }

  /**
   * Gets all unique tags across all sessions (T057)
   * @returns {Promise<string[]>}
   */
  async getAllSessionTags() {
    try {
      const sessions = await this.getSessions({ limit: 10000 });
      const tagSet = new Set();
      
      for (const session of sessions) {
        if (session.tags) {
          session.tags.forEach(tag => tagSet.add(tag));
        }
      }
      
      return Array.from(tagSet).sort();
    } catch (error) {
      this.#log.error('Failed to get all session tags', {}, error);
      return [];
    }
  }

  /**
   * Gets recent sessions (T058)
   * @param {number} [limit=10]
   * @returns {Promise<Object[]>}
   */
  async getRecentSessions(limit = 10) {
    const { SessionSearchQuery } = await import('../models/SessionSearchQuery.js');
    const query = SessionSearchQuery.recent(limit);
    const result = await this.searchSessions(query);
    return result.sessions;
  }

  /**
   * Gets starred sessions (T058)
   * @param {number} [limit=20]
   * @returns {Promise<Object[]>}
   */
  async getStarredSessions(limit = 20) {
    const { SessionSearchQuery } = await import('../models/SessionSearchQuery.js');
    const query = SessionSearchQuery.starred(limit);
    const result = await this.searchSessions(query);
    return result.sessions;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Cleans up old abandoned sessions (CR1-027)
   * Removes abandoned sessions older than the specified days
   * @param {number} [maxAgeDays=7] - Maximum age in days for abandoned sessions
   * @returns {Promise<number>} - Number of sessions cleaned up
   */
  async cleanupAbandonedSessions(maxAgeDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    try {
      const sessions = await this.getSessions({ limit: 1000 });
      let cleanedCount = 0;

      for (const session of sessions) {
        // Clean up abandoned sessions older than cutoff
        if (session.status === 'abandoned') {
          const updatedAt = new Date(session.updatedAt);
          if (updatedAt < cutoffDate) {
            await this.deleteSession(session.id);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        this.#log.info('Cleaned up abandoned sessions', { count: cleanedCount });
      }

      return cleanedCount;
    } catch (error) {
      this.#log.error('Failed to cleanup abandoned sessions', {}, error);
      return 0;
    }
  }

  /**
   * Gets storage usage statistics
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    const stats = {
      promptCount: 0,
      sessionCount: 0,
      testCount: 0,
      totalSizeBytes: 0,
    };

    const countStore = async (storeName) => {
      return new Promise((resolve) => {
        const tx = this.#getTransaction(storeName);
        const store = tx.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    };

    stats.promptCount = await countStore('prompts');
    stats.sessionCount = await countStore('sessions');
    stats.testCount = await countStore('tests');

    // Estimate storage size
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      stats.totalSizeBytes = estimate.usage || 0;
    }

    return stats;
  }

  /**
   * Clears all stored data
   * @returns {Promise<void>}
   */
  async clearAll() {
    const storeNames = Object.keys(STORES);
    
    for (const storeName of storeNames) {
      await new Promise((resolve) => {
        const tx = this.#getTransaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    }

    localStorage.removeItem(SETTINGS_KEY);
    sessionStorage.removeItem(UI_STATE_KEY);
    
    this.#log.info('All storage cleared');
  }
}
