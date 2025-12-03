/**
 * Principle
 * Represents a coaching principle from the AIM/MAP/DEBUG/OCEAN frameworks
 */

export class Principle {
  /** @type {string} Unique identifier (e.g., 'aim-actor') */
  id;

  /** @type {string} Display name (e.g., 'Actor (A)') */
  name;

  /** @type {string} Framework this belongs to (AIM, MAP, DEBUG, OCEAN) */
  framework;

  /** @type {string} Description of what this principle checks */
  description;

  /** @type {string} Question to ask the user */
  question;

  /** @type {string[]} Example improvements */
  examples;

  /** @type {number} Order in the coaching sequence */
  order;

  /** @type {string} Prompt template for LLM evaluation */
  evaluationPrompt;

  /**
   * Creates a new Principle
   * @param {Object} data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.framework = data.framework || '';
    this.description = data.description || '';
    this.question = data.question || '';
    this.examples = data.examples || [];
    this.order = data.order || 0;
    this.evaluationPrompt = data.evaluationPrompt || '';
  }

  /**
   * Gets a formatted display string
   * @returns {string}
   */
  getDisplayName() {
    return `${this.framework} - ${this.name}`;
  }

  /**
   * Checks if this is the first principle in its framework
   * @param {Principle[]} allPrinciples
   * @returns {boolean}
   */
  isFirstInFramework(allPrinciples) {
    const frameworkPrinciples = allPrinciples.filter(p => p.framework === this.framework);
    return frameworkPrinciples.length > 0 && frameworkPrinciples[0].id === this.id;
  }

  /**
   * Creates a plain object for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      framework: this.framework,
      description: this.description,
      question: this.question,
      examples: this.examples,
      order: this.order,
      evaluationPrompt: this.evaluationPrompt,
    };
  }

  /**
   * Creates a Principle from stored data
   * @param {Object} data
   * @returns {Principle}
   */
  static fromJSON(data) {
    return new Principle(data);
  }
}
