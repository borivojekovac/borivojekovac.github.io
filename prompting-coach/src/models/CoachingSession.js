/**
 * CoachingSession
 * Represents an active or completed coaching session with conversational state
 */

/**
 * @typedef {'pending'|'passed'|'failed'|'skipped'} EvaluationStatus
 */

/**
 * @typedef {Object} EvaluationState
 * @property {EvaluationStatus} status
 * @property {string} feedback
 * @property {string[]} observations
 * @property {Date|null} evaluatedAt
 * @property {string} promptSnapshot
 */

/**
 * @typedef {'prompt_updated'|'answer_question'|'skip_principle'|'ask_progress'|'ask_clarification'|'request_example'|'end_session'|'general_chat'} UserIntent
 */

/**
 * @typedef {Object} ConversationContext
 * @property {UserIntent|null} lastUserIntent
 * @property {boolean} awaitingPromptUpdate
 * @property {string|null} currentFocus - principleId currently being discussed
 * @property {string|null} lastCoachQuestion
 */

/**
 * @typedef {Object} PromptBaseline
 * @property {string} text - Prompt text when session started
 * @property {string} lastEvaluatedText - Prompt text at last evaluation
 */

/**
 * @typedef {Object} PendingFeedback
 * @property {import('./PrincipleResult.js').PrincipleResult[]} passed
 * @property {import('./PrincipleResult.js').PrincipleResult|null} failed
 */

import { ChatMessage } from './ChatMessage.js';

export class CoachingSession {
  /** @type {string} Unique identifier */
  id;

  /** @type {string} Reference to the Prompt being coached */
  promptId;

  /** @type {string} The initial prompt text when session started */
  initialPromptText;

  /** @type {number} Index of current principle being evaluated */
  currentPrincipleIndex;

  /** @type {import('./PrincipleResult.js').PrincipleResult[]} Results for each evaluated principle */
  principleResults;

  /** @type {import('./ChatMessage.js').ChatMessage[]} Conversation history with coach */
  chatHistory;

  /** @type {'active'|'completed'|'abandoned'} Session status */
  status;

  /** @type {Date} When the session started */
  startedAt;

  /** @type {Date} When the session was last updated */
  updatedAt;

  /** @type {Date|null} When the session was completed */
  completedAt;

  /** @type {boolean} Whether this session is starred/favorited */
  isStarred;

  /** @type {string} User-provided title for the session (auto-generated if empty) */
  title;

  /** @type {string[]} User-defined tags for filtering */
  tags;

  /** @type {string} The final prompt text when session completed */
  finalPromptText;

  /** @type {string} Brief summary of improvements made (auto-generated) */
  summary;

  /** @type {Map<string, EvaluationState>} Evaluation state per principle (internal) */
  evaluationState;

  /** @type {PendingFeedback} Batch pending feedback for natural grouping */
  pendingFeedback;

  /** @type {ConversationContext} Conversation context for intent handling */
  conversationContext;

  /** @type {PromptBaseline} Prompt change detection baseline */
  promptBaseline;

  /**
   * Creates a new CoachingSession
   * @param {Object} data
   */
  constructor(data = {}) {
    this.id = data.id || this.#generateId();
    this.promptId = data.promptId || null;
    this.initialPromptText = data.initialPromptText || '';
    this.currentPrincipleIndex = data.currentPrincipleIndex || 0;
    this.principleResults = data.principleResults || [];
    // Reconstruct ChatMessage objects from plain data to ensure renderedContent is computed
    this.chatHistory = (data.chatHistory || []).map(msg => 
      msg instanceof ChatMessage ? msg : ChatMessage.fromJSON(msg)
    );
    this.status = data.status || 'active';
    this.startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    this.isStarred = data.isStarred || false;
    this.title = data.title || '';
    this.tags = data.tags || [];
    this.finalPromptText = data.finalPromptText || '';
    this.summary = data.summary || '';
    
    // CR001: Conversational coaching state
    this.evaluationState = this.#parseEvaluationState(data.evaluationState);
    this.pendingFeedback = data.pendingFeedback || { passed: [], failed: null };
    this.conversationContext = data.conversationContext || {
      lastUserIntent: null,
      awaitingPromptUpdate: false,
      currentFocus: null,
      lastCoachQuestion: null,
    };
    this.promptBaseline = data.promptBaseline || {
      text: data.initialPromptText || '',
      lastEvaluatedText: data.initialPromptText || '',
    };
  }

  /**
   * Parses evaluation state from stored data (Map or object)
   * @param {Object|Map} data
   * @returns {Map<string, EvaluationState>}
   */
  #parseEvaluationState(data) {
    if (!data) return new Map();
    if (data instanceof Map) return data;
    // Convert plain object to Map
    const map = new Map();
    for (const [key, value] of Object.entries(data)) {
      map.set(key, {
        ...value,
        evaluatedAt: value.evaluatedAt ? new Date(value.evaluatedAt) : null,
      });
    }
    return map;
  }

  /**
   * Generates a unique ID
   * @returns {string}
   */
  #generateId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Checks if the session is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Checks if the session is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Gets the number of passed principles
   * @returns {number}
   */
  getPassedCount() {
    let count = 0;
    for (const state of this.evaluationState.values()) {
      if (state.status === 'passed') count++;
    }
    return count;
  }

  /**
   * Gets the number of skipped principles
   * @returns {number}
   */
  getSkippedCount() {
    let count = 0;
    for (const state of this.evaluationState.values()) {
      if (state.status === 'skipped') count++;
    }
    return count;
  }

  /**
   * Checks if all principles are resolved (passed, failed, or skipped)
   * @param {string[]} allPrincipleIds
   * @returns {boolean}
   */
  isAllResolved(allPrincipleIds) {
    for (const id of allPrincipleIds) {
      const state = this.evaluationState.get(id);
      if (!state || state.status === 'pending') return false;
      if (state.status === 'failed') return false; // Still has work to do
    }
    return true;
  }

  /**
   * Gets the next principle that needs evaluation
   * @param {string[]} orderedPrincipleIds - Principles in evaluation order
   * @returns {string|null} - principleId or null if all done
   */
  getNextPendingPrinciple(orderedPrincipleIds) {
    for (const id of orderedPrincipleIds) {
      const state = this.evaluationState.get(id);
      if (!state || state.status === 'pending' || state.status === 'failed') {
        return id;
      }
    }
    return null;
  }

  /**
   * Gets evaluation state for a principle
   * @param {string} principleId
   * @returns {EvaluationState|null}
   */
  getEvaluationState(principleId) {
    return this.evaluationState.get(principleId) || null;
  }

  /**
   * Sets evaluation state for a principle
   * @param {string} principleId
   * @param {EvaluationStatus} status
   * @param {string} feedback
   * @param {string[]} observations
   * @param {string} promptSnapshot
   */
  setEvaluationState(principleId, status, feedback, observations, promptSnapshot) {
    this.evaluationState.set(principleId, {
      status,
      feedback,
      observations: observations || [],
      evaluatedAt: new Date(),
      promptSnapshot,
    });
    this.updatedAt = new Date();
  }

  /**
   * Marks a principle as skipped
   * @param {string} principleId
   */
  skipPrinciple(principleId) {
    this.setEvaluationState(principleId, 'skipped', 'Skipped by user', [], this.promptBaseline.lastEvaluatedText);
  }

  /**
   * Clears pending feedback
   */
  clearPendingFeedback() {
    this.pendingFeedback = { passed: [], failed: null };
  }

  /**
   * Adds a passed result to pending feedback
   * @param {import('./PrincipleResult.js').PrincipleResult} result
   */
  addPassedFeedback(result) {
    this.pendingFeedback.passed.push(result);
  }

  /**
   * Sets the failed result in pending feedback
   * @param {import('./PrincipleResult.js').PrincipleResult} result
   */
  setFailedFeedback(result) {
    this.pendingFeedback.failed = result;
  }

  /**
   * Updates conversation context
   * @param {Partial<ConversationContext>} updates
   */
  updateConversationContext(updates) {
    this.conversationContext = { ...this.conversationContext, ...updates };
    this.updatedAt = new Date();
  }

  /**
   * Updates the prompt baseline after evaluation
   * @param {string} promptText
   */
  updatePromptBaseline(promptText) {
    this.promptBaseline.lastEvaluatedText = promptText;
    this.updatedAt = new Date();
  }

  // Legacy method - kept for compatibility
  /**
   * Gets the number of satisfied principles (legacy)
   * @returns {number}
   * @deprecated Use getPassedCount() instead
   */
  getSatisfiedCount() {
    return this.getPassedCount();
  }

  // Legacy method - kept for compatibility  
  /**
   * Gets progress percentage (legacy - internal use only)
   * @param {number} totalPrinciples
   * @returns {number}
   * @deprecated Progress should not be exposed to user
   */
  getProgressPercent(totalPrinciples) {
    if (totalPrinciples === 0) return 0;
    const resolved = this.getPassedCount() + this.getSkippedCount();
    return Math.round((resolved / totalPrinciples) * 100);
  }

  /**
   * Gets the result for a specific principle
   * @param {string} principleId
   * @returns {import('./PrincipleResult.js').PrincipleResult|undefined}
   */
  getResultForPrinciple(principleId) {
    return this.principleResults.find(r => r.principleId === principleId);
  }

  /**
   * Adds a principle result
   * @param {import('./PrincipleResult.js').PrincipleResult} result
   */
  addPrincipleResult(result) {
    // Remove existing result for this principle if any
    this.principleResults = this.principleResults.filter(r => r.principleId !== result.principleId);
    this.principleResults.push(result);
    this.updatedAt = new Date();
  }

  /**
   * Adds a chat message
   * @param {import('./ChatMessage.js').ChatMessage} message
   */
  addChatMessage(message) {
    this.chatHistory.push(message);
    this.updatedAt = new Date();
  }

  /**
   * Advances to the next principle
   * @param {number} totalPrinciples
   * @returns {boolean} True if advanced, false if already at end
   */
  advanceToNextPrinciple(totalPrinciples) {
    if (this.currentPrincipleIndex < totalPrinciples - 1) {
      this.currentPrincipleIndex++;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Marks the session as completed
   * @param {string} finalPromptText
   * @param {string} summary
   */
  complete(finalPromptText, summary) {
    this.status = 'completed';
    this.finalPromptText = finalPromptText;
    this.summary = summary;
    this.completedAt = new Date();
    this.updatedAt = new Date();
    
    // Auto-generate title if not set
    if (!this.title) {
      this.title = this.#generateTitle();
    }
  }

  /**
   * Marks the session as abandoned
   */
  abandon() {
    this.status = 'abandoned';
    this.updatedAt = new Date();
  }

  /**
   * Generates an automatic title based on prompt content
   * @returns {string}
   */
  #generateTitle() {
    const text = this.finalPromptText || this.initialPromptText;
    if (!text) return 'Untitled Session';
    
    // Take first 50 chars, cut at word boundary
    const truncated = text.slice(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    const title = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated;
    return title + (text.length > 50 ? '...' : '');
  }

  /**
   * Toggles starred status
   */
  toggleStar() {
    this.isStarred = !this.isStarred;
    this.updatedAt = new Date();
  }

  /**
   * Adds a tag
   * @param {string} tag
   */
  addTag(tag) {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  /**
   * Removes a tag
   * @param {string} tag
   */
  removeTag(tag) {
    const normalizedTag = tag.trim().toLowerCase();
    this.tags = this.tags.filter(t => t !== normalizedTag);
    this.updatedAt = new Date();
  }

  /**
   * Gets duration in minutes
   * @returns {number}
   */
  getDurationMinutes() {
    const endTime = this.completedAt || new Date();
    return Math.round((endTime.getTime() - this.startedAt.getTime()) / 60000);
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    // Convert Map to plain object for storage
    const evaluationStateObj = {};
    for (const [key, value] of this.evaluationState.entries()) {
      evaluationStateObj[key] = {
        ...value,
        evaluatedAt: value.evaluatedAt?.toISOString() || null,
      };
    }

    return {
      id: this.id,
      promptId: this.promptId,
      initialPromptText: this.initialPromptText,
      currentPrincipleIndex: this.currentPrincipleIndex,
      principleResults: this.principleResults.map(r => r.toJSON ? r.toJSON() : r),
      chatHistory: this.chatHistory.map(m => m.toJSON ? m.toJSON() : m),
      status: this.status,
      startedAt: this.startedAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      completedAt: this.completedAt?.toISOString() || null,
      isStarred: this.isStarred,
      title: this.title,
      tags: this.tags,
      finalPromptText: this.finalPromptText,
      summary: this.summary,
      // CR001: Conversational coaching state
      evaluationState: evaluationStateObj,
      pendingFeedback: this.pendingFeedback,
      conversationContext: this.conversationContext,
      promptBaseline: this.promptBaseline,
    };
  }

  /**
   * Creates a CoachingSession from stored data
   * @param {Object} data
   * @returns {CoachingSession}
   */
  static fromJSON(data) {
    return new CoachingSession(data);
  }
}
