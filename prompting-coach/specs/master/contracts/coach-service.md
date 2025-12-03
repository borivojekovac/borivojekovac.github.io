# Coach Service Contract

**Purpose**: Manages the coaching workflow and principle validation

## Class: CoachService

### Constructor

```javascript
/**
 * Creates a new CoachService instance
 * @param {LlmService} llmService - LLM service for AI interactions
 * @param {Principle[]} principles - Ordered list of coaching principles
 */
constructor(llmService, principles)
```

### Methods

#### startSession

```javascript
/**
 * Starts a new coaching session for a prompt
 * @param {Prompt} prompt - The prompt to coach
 * @returns {Promise<CoachingSession>} The new session
 */
async startSession(prompt)
```

#### evaluateCurrentPrinciple

```javascript
/**
 * Evaluates the current principle against the prompt
 * @param {string} sessionId - The session ID
 * @param {string} promptText - Current prompt text to evaluate
 * @returns {Promise<PrincipleResult>} Evaluation result
 * @throws {SessionNotFoundError} If session doesn't exist
 * @throws {SessionCompletedError} If session is already completed
 */
async evaluateCurrentPrinciple(sessionId, promptText)
```

#### advanceToNextPrinciple

```javascript
/**
 * Moves to the next principle after current is satisfied
 * @param {string} sessionId - The session ID
 * @returns {Promise<Principle|null>} Next principle or null if complete
 * @throws {PrincipleNotSatisfiedError} If current principle not satisfied
 */
async advanceToNextPrinciple(sessionId)
```

#### sendCoachMessage

```javascript
/**
 * Sends a message to the coach and gets a response
 * @param {string} sessionId - The session ID
 * @param {string} message - User's message
 * @returns {Promise<ChatMessage>} Coach's response
 */
async sendCoachMessage(sessionId, message)
```

#### getSessionProgress

```javascript
/**
 * Gets the current progress of a coaching session
 * @param {string} sessionId - The session ID
 * @returns {Promise<SessionProgress>} Progress information
 */
async getSessionProgress(sessionId)
```

#### abandonSession

```javascript
/**
 * Abandons an active coaching session
 * @param {string} sessionId - The session ID
 * @returns {Promise<void>}
 */
async abandonSession(sessionId)
```

#### getSuggestions

```javascript
/**
 * Gets improvement suggestions for the current principle
 * @param {string} sessionId - The session ID
 * @param {string} promptText - Current prompt text
 * @returns {Promise<string[]>} List of suggestions
 */
async getSuggestions(sessionId, promptText)
```

### Response Types

```javascript
/**
 * @typedef {Object} SessionProgress
 * @property {number} currentIndex - Current principle index (0-based)
 * @property {number} totalPrinciples - Total number of principles
 * @property {string} currentPrincipleId - ID of current principle
 * @property {string} currentPrincipleName - Name of current principle
 * @property {string} currentFramework - Framework (AIM, MAP, DEBUG, OCEAN)
 * @property {number} completedCount - Number of satisfied principles
 * @property {boolean} isComplete - Whether all principles are satisfied
 */
```

### Error Classes

```javascript
class SessionNotFoundError extends Error {
  /** @type {string} */
  sessionId;
}

class SessionCompletedError extends Error {
  /** @type {string} */
  sessionId;
}

class PrincipleNotSatisfiedError extends Error {
  /** @type {string} */
  principleId;
  /** @type {string} */
  feedback;
}
```

## Coaching Prompts (Internal)

### Principle Evaluation Prompt Template

```text
You are an expert prompt engineering coach. Evaluate the following prompt against this principle:

**Principle**: {principle.name}
**Description**: {principle.description}
**Question**: {principle.question}

**User's Prompt**:
```
{promptText}
```

Respond in JSON format:
{
  "satisfied": boolean,
  "feedback": "Explanation of your assessment",
  "suggestions": ["Specific improvement 1", "Specific improvement 2"]
}

Be constructive and specific. If satisfied, still provide suggestions for enhancement.
```

### Coach Conversation System Prompt

```text
You are a friendly and knowledgeable prompt engineering coach helping users improve their prompts.

Current coaching context:
- Framework: {currentFramework}
- Principle: {currentPrinciple.name}
- Description: {currentPrinciple.description}

The user's current prompt is:
```
{promptText}
```

Guide the user to improve their prompt to satisfy the current principle. Be encouraging, specific, and provide examples when helpful. Keep responses concise but informative.
```
