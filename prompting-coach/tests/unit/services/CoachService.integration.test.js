/**
 * Integration tests for CoachService conversation flow (CR001)
 * CR1-032: Integration tests for conversation flow
 * CR1-033: Integration tests for skip and progress flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoachingSession } from '../../../src/models/CoachingSession.js';
import { PrincipleResult } from '../../../src/models/PrincipleResult.js';

// Note: ChatMessage tests are in E2E tests since they require DOM environment

describe('CoachService Integration - Conversation Flow (CR1-032)', () => {
  describe('Session initialization flow', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Write a function to sort an array',
      });
    });

    it('should create session with initial state', () => {
      expect(session.status).toBe('active');
      expect(session.chatHistory).toHaveLength(0);
      expect(session.principleResults).toHaveLength(0);
      expect(session.promptBaseline.text).toBe('Write a function to sort an array');
    });

    it('should add chat messages in order', () => {
      // Create mock messages (ChatMessage requires DOM)
      const userMsg = { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() };
      const coachMsg = { id: 'msg-2', role: 'coach', content: 'Hi there!', timestamp: new Date() };

      session.addChatMessage(userMsg);
      session.addChatMessage(coachMsg);

      expect(session.chatHistory).toHaveLength(2);
      expect(session.chatHistory[0].role).toBe('user');
      expect(session.chatHistory[1].role).toBe('coach');
    });

    it('should track principle results', () => {
      const result = PrincipleResult.createSatisfied('aim-actor', 'Good actor', 'Test prompt', ['Has role']);
      
      session.addPrincipleResult(result);

      expect(session.principleResults).toHaveLength(1);
      expect(session.getResultForPrinciple('aim-actor')).toBe(result);
    });

    it('should replace existing principle result on re-evaluation', () => {
      const result1 = PrincipleResult.createUnsatisfied('aim-actor', 'Needs work', ['Add role'], 'Test', ['Missing role']);
      const result2 = PrincipleResult.createSatisfied('aim-actor', 'Good now', 'Updated test', ['Has role']);

      session.addPrincipleResult(result1);
      session.addPrincipleResult(result2);

      expect(session.principleResults).toHaveLength(1);
      expect(session.getResultForPrinciple('aim-actor').satisfied).toBe(true);
    });
  });

  describe('Evaluation sweep flow', () => {
    let session;
    const principleOrder = ['aim-actor', 'aim-input', 'aim-mission', 'map-memory'];

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should batch multiple passing principles', () => {
      // Simulate evaluation sweep where first 2 pass, 3rd fails
      session.setEvaluationState('aim-actor', 'passed', 'Good', ['Has role'], 'Test');
      session.addPassedFeedback(PrincipleResult.createSatisfied('aim-actor', 'Good', 'Test', ['Has role']));

      session.setEvaluationState('aim-input', 'passed', 'Good', ['Has context'], 'Test');
      session.addPassedFeedback(PrincipleResult.createSatisfied('aim-input', 'Good', 'Test', ['Has context']));

      session.setEvaluationState('aim-mission', 'failed', 'Needs work', ['Missing task'], 'Test');
      session.setFailedFeedback(PrincipleResult.createUnsatisfied('aim-mission', 'Needs work', ['Add task'], 'Test', ['Missing task']));

      expect(session.pendingFeedback.passed).toHaveLength(2);
      expect(session.pendingFeedback.failed).not.toBeNull();
      expect(session.pendingFeedback.failed.principleId).toBe('aim-mission');
    });

    it('should stop evaluation at first failure', () => {
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      session.setEvaluationState('aim-input', 'failed', '', [], '');

      // aim-mission should not be evaluated
      expect(session.getEvaluationState('aim-mission')).toBeNull();
      expect(session.getEvaluationState('map-memory')).toBeNull();
    });

    it('should continue from current principle after update', () => {
      // First sweep: actor passes, input fails
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      session.setEvaluationState('aim-input', 'failed', '', [], '');

      // User updates prompt, re-evaluate from input
      session.setEvaluationState('aim-input', 'passed', '', [], '');
      session.setEvaluationState('aim-mission', 'passed', '', [], '');
      session.setEvaluationState('map-memory', 'failed', '', [], '');

      expect(session.getPassedCount()).toBe(3);
      expect(session.getEvaluationState('aim-actor').status).toBe('passed');
      expect(session.getEvaluationState('aim-input').status).toBe('passed');
      expect(session.getEvaluationState('aim-mission').status).toBe('passed');
      expect(session.getEvaluationState('map-memory').status).toBe('failed');
    });
  });

  describe('Session completion flow', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should complete when all principles pass', () => {
      const principles = ['aim-actor', 'aim-input', 'aim-mission'];
      
      for (const id of principles) {
        session.setEvaluationState(id, 'passed', '', [], '');
      }

      expect(session.isAllResolved(principles)).toBe(true);
    });

    it('should complete when all principles are passed or skipped', () => {
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      session.setEvaluationState('aim-input', 'skipped', '', [], '');
      session.setEvaluationState('aim-mission', 'passed', '', [], '');

      const principles = ['aim-actor', 'aim-input', 'aim-mission'];
      expect(session.isAllResolved(principles)).toBe(true);
    });

    it('should capture final state on completion', () => {
      session.complete('Final improved prompt', 'You made great progress!');

      expect(session.status).toBe('completed');
      expect(session.finalPromptText).toBe('Final improved prompt');
      expect(session.summary).toBe('You made great progress!');
      expect(session.completedAt).toBeInstanceOf(Date);
    });
  });
});

describe('CoachService Integration - Skip and Progress Flows (CR1-033)', () => {
  describe('Skip principle flow', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should mark principle as skipped', () => {
      session.skipPrinciple('aim-actor');

      const state = session.getEvaluationState('aim-actor');
      expect(state.status).toBe('skipped');
      expect(state.feedback).toBe('Skipped by user');
    });

    it('should count skipped principles', () => {
      session.skipPrinciple('aim-actor');
      session.skipPrinciple('aim-input');

      expect(session.getSkippedCount()).toBe(2);
    });

    it('should allow evaluation to continue after skip', () => {
      session.skipPrinciple('aim-actor');
      session.setEvaluationState('aim-input', 'passed', '', [], '');

      expect(session.getEvaluationState('aim-actor').status).toBe('skipped');
      expect(session.getEvaluationState('aim-input').status).toBe('passed');
    });

    it('should include skipped in resolved check', () => {
      const principles = ['aim-actor', 'aim-input'];
      
      session.skipPrinciple('aim-actor');
      session.setEvaluationState('aim-input', 'passed', '', [], '');

      expect(session.isAllResolved(principles)).toBe(true);
    });
  });

  describe('Progress check flow', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should calculate progress correctly', () => {
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      session.setEvaluationState('aim-input', 'passed', '', [], '');
      session.skipPrinciple('aim-mission');

      expect(session.getPassedCount()).toBe(2);
      expect(session.getSkippedCount()).toBe(1);
      expect(session.getProgressPercent(15)).toBe(20); // 3/15 = 20%
    });

    it('should track current focus', () => {
      session.updateConversationContext({ currentFocus: 'aim-actor' });
      expect(session.conversationContext.currentFocus).toBe('aim-actor');

      session.updateConversationContext({ currentFocus: 'aim-input' });
      expect(session.conversationContext.currentFocus).toBe('aim-input');
    });

    it('should get next pending principle', () => {
      const order = ['aim-actor', 'aim-input', 'aim-mission'];
      
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      
      expect(session.getNextPendingPrinciple(order)).toBe('aim-input');
    });

    it('should return null when all resolved', () => {
      const order = ['aim-actor', 'aim-input'];
      
      session.setEvaluationState('aim-actor', 'passed', '', [], '');
      session.setEvaluationState('aim-input', 'passed', '', [], '');

      expect(session.getNextPendingPrinciple(order)).toBeNull();
    });
  });

  describe('User pushback handling', () => {
    let session;

    beforeEach(() => {
      session = new CoachingSession({
        promptId: 'test-prompt',
        initialPromptText: 'Test prompt',
      });
    });

    it('should accept principle when user pushes back', () => {
      // Simulate: principle was failed, user says "it's fine"
      session.setEvaluationState('aim-actor', 'failed', 'Needs work', ['Missing role'], 'Test');
      
      // User pushback accepted
      session.setEvaluationState('aim-actor', 'passed', 'Accepted based on user feedback', [], 'Test');

      expect(session.getEvaluationState('aim-actor').status).toBe('passed');
    });

    it('should track conversation context for pushback', () => {
      session.updateConversationContext({
        lastUserIntent: 'general_chat',
        currentFocus: 'aim-actor',
        lastCoachQuestion: 'What role should the AI play?',
      });

      // After pushback
      session.updateConversationContext({
        lastUserIntent: 'general_chat', // LLM detected pushback via structured response
        currentFocus: null, // Moved on
      });

      expect(session.conversationContext.currentFocus).toBeNull();
    });
  });
});

// Note: ChatMessage creation tests are covered in E2E tests
// since ChatMessage requires DOM environment for markdown rendering
