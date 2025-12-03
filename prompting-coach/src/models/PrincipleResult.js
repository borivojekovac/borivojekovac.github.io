/**
 * PrincipleResult
 * Represents the evaluation result for a single principle
 */

export class PrincipleResult {
  /** @type {string} Reference to Principle.id */
  principleId;

  /** @type {boolean} Whether the principle is satisfied */
  satisfied;

  /** @type {string} Feedback from the coach */
  feedback;

  /** @type {string[]} Suggested improvements */
  suggestions;

  /** @type {string[]} Specific observations about the prompt (for natural language feedback) */
  observations;

  /** @type {Date} When this was evaluated */
  evaluatedAt;

  /** @type {string} The prompt text at time of evaluation */
  promptSnapshot;

  /** @type {number} Confidence score (0-1) if available */
  confidence;

  /**
   * Creates a new PrincipleResult
   * @param {Object} data
   */
  constructor(data = {}) {
    this.principleId = data.principleId || '';
    this.satisfied = data.satisfied || false;
    this.feedback = data.feedback || '';
    this.suggestions = data.suggestions || [];
    this.observations = data.observations || [];
    this.evaluatedAt = data.evaluatedAt ? new Date(data.evaluatedAt) : new Date();
    this.promptSnapshot = data.promptSnapshot || '';
    this.confidence = data.confidence || 0;
  }

  /**
   * Checks if this result indicates the principle needs work
   * @returns {boolean}
   */
  needsImprovement() {
    return !this.satisfied;
  }

  /**
   * Gets the primary suggestion
   * @returns {string}
   */
  getPrimarySuggestion() {
    return this.suggestions[0] || '';
  }

  /**
   * Gets a summary of the result
   * @returns {string}
   */
  getSummary() {
    if (this.satisfied) {
      return 'Satisfied';
    }
    return this.suggestions.length > 0 
      ? `Needs improvement: ${this.suggestions.length} suggestion(s)`
      : 'Needs improvement';
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  /**
   * Gets observations as natural language points
   * @returns {string[]}
   */
  getObservations() {
    return this.observations.length > 0 ? this.observations : [this.feedback];
  }

  toJSON() {
    return {
      principleId: this.principleId,
      satisfied: this.satisfied,
      feedback: this.feedback,
      suggestions: this.suggestions,
      observations: this.observations,
      evaluatedAt: this.evaluatedAt.toISOString(),
      promptSnapshot: this.promptSnapshot,
      confidence: this.confidence,
    };
  }

  /**
   * Creates a PrincipleResult from stored data
   * @param {Object} data
   * @returns {PrincipleResult}
   */
  static fromJSON(data) {
    return new PrincipleResult(data);
  }

  /**
   * Creates a satisfied result
   * @param {string} principleId
   * @param {string} feedback
   * @param {string} promptSnapshot
   * @returns {PrincipleResult}
   */
  static createSatisfied(principleId, feedback, promptSnapshot, observations = []) {
    return new PrincipleResult({
      principleId,
      satisfied: true,
      feedback,
      suggestions: [],
      observations,
      promptSnapshot,
      confidence: 1,
    });
  }

  /**
   * Creates an unsatisfied result
   * @param {string} principleId
   * @param {string} feedback
   * @param {string[]} suggestions
   * @param {string} promptSnapshot
   * @returns {PrincipleResult}
   */
  static createUnsatisfied(principleId, feedback, suggestions, promptSnapshot, observations = []) {
    return new PrincipleResult({
      principleId,
      satisfied: false,
      feedback,
      suggestions,
      observations,
      promptSnapshot,
      confidence: 0.8,
    });
  }
}
