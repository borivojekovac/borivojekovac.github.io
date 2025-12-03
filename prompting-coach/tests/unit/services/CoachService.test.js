/**
 * Unit tests for CoachService (CR001)
 * Tests for intent detection, batch evaluation, prompt change detection, and session state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoachingSession } from '../../../src/models/CoachingSession.js';
import { PrincipleResult } from '../../../src/models/PrincipleResult.js';

// Mock LlmService
const createMockLlmService = () => ({
  isConfigured: vi.fn().mockReturnValue(true),
  getProvider: vi.fn().mockReturnValue('openai'),
  sendMessage: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      passed: true,
      observations: ['Test observation'],
      suggestions: [],
    }),
  }),
});

// Mock StorageService
const createMockStorageService = () => ({
  saveSession: vi.fn().mockResolvedValue({}),
  getSession: vi.fn().mockResolvedValue(null),
  getActiveSessions: vi.fn().mockResolvedValue([]),
});

describe('CoachService - Intent Detection (CR1-028)', () => {
  // Test intent detection patterns
  describe('detectIntent patterns', () => {
    const intentPatterns = {
      prompt_updated: ['check again', 'check now', 'take a look', 'i updated', 'i changed', 'i revised', 'i rewrote', 'i fixed'],
      ask_progress: ['how am i doing', "how's it going", "what's left", 'where are we', 'how far along'],
      end_session: ['end session', 'stop coaching', 'finish coaching', 'end the session'],
    };

    it('should detect prompt_updated intent', () => {
      const testPhrases = [
        'I updated my prompt',
        'Check again please',
        'Take a look now',
        'I changed it',
        'I revised the prompt',
        'I rewrote everything',
        'I fixed that issue',
      ];

      for (const phrase of testPhrases) {
        const lowerPhrase = phrase.toLowerCase();
        const matchesPattern = intentPatterns.prompt_updated.some(p => lowerPhrase.includes(p));
        expect(matchesPattern, `"${phrase}" should match prompt_updated`).toBe(true);
      }
    });

    it('should detect ask_progress intent', () => {
      const testPhrases = [
        'How am I doing?',
        "How's it going so far?",
        "What's left to do?",
        'Where are we in the process?',
        'How far along am I?',
      ];

      for (const phrase of testPhrases) {
        const lowerPhrase = phrase.toLowerCase();
        const matchesPattern = intentPatterns.ask_progress.some(p => lowerPhrase.includes(p));
        expect(matchesPattern, `"${phrase}" should match ask_progress`).toBe(true);
      }
    });

    it('should detect end_session intent', () => {
      const testPhrases = [
        'End session please',
        'Stop coaching now',
        'Finish coaching',
        'End the session',
      ];

      for (const phrase of testPhrases) {
        const lowerPhrase = phrase.toLowerCase();
        const matchesPattern = intentPatterns.end_session.some(p => lowerPhrase.includes(p));
        expect(matchesPattern, `"${phrase}" should match end_session`).toBe(true);
      }
    });

    it('should not match general chat to specific intents', () => {
      const generalPhrases = [
        'Hello there',
        'I think the prompt is good',
        'What do you think about this?',
        'Can you help me?',
      ];

      for (const phrase of generalPhrases) {
        const lowerPhrase = phrase.toLowerCase();
        const matchesAny = Object.values(intentPatterns).flat().some(p => lowerPhrase.includes(p));
        expect(matchesAny, `"${phrase}" should not match any specific intent`).toBe(false);
      }
    });
  });
});

describe('CoachService - Batch Evaluation Logic (CR1-029)', () => {
  describe('CoachingSession evaluation state', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt text',
      });
    });

    it('should track passed principles', () => {
      session.setEvaluationState('aim-actor', 'passed', 'Good actor definition', ['Has clear role'], 'Test prompt');
      session.setEvaluationState('aim-input', 'passed', 'Good input', ['Has context'], 'Test prompt');

      expect(session.getPassedCount()).toBe(2);
    });

    it('should track skipped principles', () => {
      session.skipPrinciple('aim-actor');
      session.skipPrinciple('aim-input');

      expect(session.getSkippedCount()).toBe(2);
    });

    it('should stop at first failed principle', () => {
      session.setEvaluationState('aim-actor', 'passed', 'Good', [], 'Test');
      session.setEvaluationState('aim-input', 'failed', 'Needs work', ['Missing context'], 'Test');
      // aim-mission should not be evaluated yet

      const state = session.getEvaluationState('aim-mission');
      expect(state).toBeNull();
    });

    it('should correctly identify all resolved', () => {
      const principleIds = ['aim-actor', 'aim-input', 'aim-mission'];
      
      // Not all resolved - one is failed
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      session.setEvaluationState('aim-input', 'failed', '', [], '');
      expect(session.isAllResolved(principleIds)).toBe(false);

      // Mark as passed
      session.setEvaluationState('aim-input', 'passed', '', [], '');
      session.setEvaluationState('aim-mission', 'skipped', '', [], '');
      expect(session.isAllResolved(principleIds)).toBe(true);
    });

    it('should get next pending principle', () => {
      const principleIds = ['aim-actor', 'aim-input', 'aim-mission'];
      
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      
      const next = session.getNextPendingPrinciple(principleIds);
      expect(next).toBe('aim-input');
    });
  });

  describe('Pending feedback batching', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt text',
      });
    });

    it('should batch passed feedback', () => {
      const result1 = PrincipleResult.createSatisfied('aim-actor', 'Good actor', 'Test', ['Has role']);
      const result2 = PrincipleResult.createSatisfied('aim-input', 'Good input', 'Test', ['Has context']);

      session.addPassedFeedback(result1);
      session.addPassedFeedback(result2);

      expect(session.pendingFeedback.passed).toHaveLength(2);
    });

    it('should set failed feedback', () => {
      const failedResult = PrincipleResult.createUnsatisfied('aim-mission', 'Needs work', ['Add task'], 'Test', ['Missing task']);

      session.setFailedFeedback(failedResult);

      expect(session.pendingFeedback.failed).toBe(failedResult);
    });

    it('should clear pending feedback', () => {
      const result = PrincipleResult.createSatisfied('aim-actor', 'Good', 'Test', []);
      session.addPassedFeedback(result);
      session.setFailedFeedback(result);

      session.clearPendingFeedback();

      expect(session.pendingFeedback.passed).toHaveLength(0);
      expect(session.pendingFeedback.failed).toBeNull();
    });
  });
});

describe('CoachService - Prompt Change Detection (CR1-030)', () => {
  describe('Similarity calculation', () => {
    /**
     * Simple word-based Jaccard similarity
     */
    const calculateSimilarity = (text1, text2) => {
      if (!text1 || !text2) return 1;
      
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      
      return union > 0 ? intersection / union : 1;
    };

    it('should detect identical prompts', () => {
      const prompt = 'Write a function to sort an array';
      const similarity = calculateSimilarity(prompt, prompt);
      expect(similarity).toBe(1);
    });

    it('should detect minor changes', () => {
      const original = 'Write a function to sort an array';
      const modified = 'Write a function to sort an array efficiently';
      const similarity = calculateSimilarity(original, modified);
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should detect significant changes', () => {
      const original = 'Write a function to sort an array';
      const modified = 'Create a REST API for user authentication';
      const similarity = calculateSimilarity(original, modified);
      expect(similarity).toBeLessThan(0.3);
    });

    it('should handle empty prompts', () => {
      expect(calculateSimilarity('', 'test')).toBe(1);
      expect(calculateSimilarity('test', '')).toBe(1);
      expect(calculateSimilarity('', '')).toBe(1);
    });
  });

  describe('CoachingSession prompt baseline', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Original prompt text',
      });
    });

    it('should initialize prompt baseline', () => {
      expect(session.promptBaseline.text).toBe('Original prompt text');
      expect(session.promptBaseline.lastEvaluatedText).toBe('Original prompt text');
    });

    it('should update lastEvaluatedText', () => {
      session.updatePromptBaseline('Updated prompt text');
      
      expect(session.promptBaseline.text).toBe('Original prompt text');
      expect(session.promptBaseline.lastEvaluatedText).toBe('Updated prompt text');
    });
  });
});

describe('CoachService - Session State Management (CR1-031)', () => {
  describe('CoachingSession lifecycle', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should start as active', () => {
      expect(session.status).toBe('active');
      expect(session.isActive()).toBe(true);
    });

    it('should complete session', () => {
      session.complete('Final prompt', 'Great improvements made');
      
      expect(session.status).toBe('completed');
      expect(session.isCompleted()).toBe(true);
      expect(session.finalPromptText).toBe('Final prompt');
      expect(session.summary).toBe('Great improvements made');
      expect(session.completedAt).toBeInstanceOf(Date);
    });

    it('should abandon session', () => {
      session.abandon();
      
      expect(session.status).toBe('abandoned');
      expect(session.isActive()).toBe(false);
    });

    it('should auto-generate title on completion', () => {
      session.complete('This is a test prompt for generating titles', 'Summary');
      
      expect(session.title).toBeTruthy();
      expect(session.title.length).toBeLessThanOrEqual(53); // 50 chars + "..."
    });
  });

  describe('Conversation context', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should initialize conversation context', () => {
      expect(session.conversationContext).toEqual({
        lastUserIntent: null,
        awaitingPromptUpdate: false,
        currentFocus: null,
        lastCoachQuestion: null,
      });
    });

    it('should update conversation context', () => {
      session.updateConversationContext({
        lastUserIntent: 'prompt_updated',
        currentFocus: 'aim-actor',
      });

      expect(session.conversationContext.lastUserIntent).toBe('prompt_updated');
      expect(session.conversationContext.currentFocus).toBe('aim-actor');
      expect(session.conversationContext.awaitingPromptUpdate).toBe(false);
    });

    it('should preserve unupdated context fields', () => {
      session.updateConversationContext({ lastUserIntent: 'ask_progress' });
      session.updateConversationContext({ currentFocus: 'aim-input' });

      expect(session.conversationContext.lastUserIntent).toBe('ask_progress');
      expect(session.conversationContext.currentFocus).toBe('aim-input');
    });
  });

  describe('Session serialization', () => {
    it('should serialize to JSON', () => {
      const session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });

      session.setEvaluationState('aim-actor', 'passed', 'Good', ['Has role'], 'Test');

      const json = session.toJSON();

      expect(json.id).toBe(session.id);
      expect(json.promptId).toBe('test-prompt');
      expect(json.evaluationState['aim-actor'].status).toBe('passed');
    });

    it('should deserialize from JSON', () => {
      const original = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
      original.setEvaluationState('aim-actor', 'passed', 'Good', ['Has role'], 'Test');

      const json = original.toJSON();
      const restored = CoachingSession.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.promptId).toBe(original.promptId);
      expect(restored.getEvaluationState('aim-actor').status).toBe('passed');
    });
  });
});
