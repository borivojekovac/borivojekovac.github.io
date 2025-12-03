/**
 * Unit tests for LlmTestResult model
 */

import { describe, it, expect } from 'vitest';
import { LlmTestResult } from '../../../src/models/LlmTestResult.js';

describe('LlmTestResult', () => {
  describe('constructor', () => {
    it('should create a result with default values', () => {
      const result = new LlmTestResult({});
      
      expect(result.id).toBeNull();
      expect(result.promptId).toBeNull();
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.promptText).toBe('');
      expect(result.response).toBe('');
      expect(result.error).toBeNull();
      expect(result.tokensUsed).toBe(0);
      expect(result.responseTimeMs).toBe(0);
      expect(result.testedAt).toBeInstanceOf(Date);
    });

    it('should create a successful result', () => {
      const data = {
        promptId: 'prompt-123',
        provider: 'openai',
        model: 'gpt-4o-mini',
        promptText: 'Hello',
        response: 'Hi there!',
        tokensUsed: 25,
        responseTimeMs: 500,
      };
      
      const result = new LlmTestResult(data);
      
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.response).toBe('Hi there!');
      expect(result.tokensUsed).toBe(25);
      expect(result.responseTimeMs).toBe(500);
    });

    it('should create an error result', () => {
      const result = new LlmTestResult({
        provider: 'openai',
        error: 'API rate limit exceeded',
      });
      
      expect(result.error).toBe('API rate limit exceeded');
      expect(result.response).toBe('');
    });
  });

  describe('isSuccess', () => {
    it('should return true when response exists and no error', () => {
      const result = new LlmTestResult({
        response: 'Hello!',
        error: null,
      });
      
      expect(result.isSuccess()).toBe(true);
    });

    it('should return false when error exists', () => {
      const result = new LlmTestResult({
        response: '',
        error: 'Something went wrong',
      });
      
      expect(result.isSuccess()).toBe(false);
    });

    it('should return false when response is empty', () => {
      const result = new LlmTestResult({
        response: '',
        error: null,
      });
      
      expect(result.isSuccess()).toBe(false);
    });
  });

  describe('getFormattedResponseTime', () => {
    it('should format seconds correctly', () => {
      const result = new LlmTestResult({ responseTimeMs: 1500 });
      expect(result.getFormattedResponseTime()).toBe('1.50s');
    });

    it('should format sub-second times in ms', () => {
      const result = new LlmTestResult({ responseTimeMs: 250 });
      expect(result.getFormattedResponseTime()).toBe('250ms');
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new LlmTestResult({
        provider: 'openai',
        model: 'gpt-4o-mini',
        promptText: 'Test',
        response: 'Response',
        tokensUsed: 50,
        responseTimeMs: 1000,
      });
      
      const json = original.toJSON();
      const restored = LlmTestResult.fromJSON(json);
      
      expect(restored.id).toBe(original.id);
      expect(restored.provider).toBe(original.provider);
      expect(restored.model).toBe(original.model);
      expect(restored.response).toBe(original.response);
      expect(restored.tokensUsed).toBe(original.tokensUsed);
    });
  });
});
