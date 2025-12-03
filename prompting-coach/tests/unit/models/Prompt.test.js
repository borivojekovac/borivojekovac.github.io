/**
 * Unit tests for Prompt model
 */

import { describe, it, expect } from 'vitest';
import { Prompt } from '../../../src/models/Prompt.js';

describe('Prompt', () => {
  describe('constructor', () => {
    it('should create a prompt with default values', () => {
      const prompt = new Prompt();
      
      expect(prompt.id).toBeNull();
      expect(prompt.text).toBe('');
      expect(prompt.title).toBe('');
      expect(prompt.files).toEqual([]);
      expect(prompt.createdAt).toBeInstanceOf(Date);
      expect(prompt.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a prompt with provided values', () => {
      const data = {
        id: 'test-id',
        text: 'Test prompt text',
        title: 'Test Title',
        files: [{ name: 'file.txt', content: 'content' }],
      };
      
      const prompt = new Prompt(data);
      
      expect(prompt.id).toBe('test-id');
      expect(prompt.text).toBe('Test prompt text');
      expect(prompt.title).toBe('Test Title');
      expect(prompt.files).toHaveLength(1);
    });
  });

  describe('getCharacterCount', () => {
    it('should return correct character count', () => {
      const prompt = new Prompt({ text: 'Hello World' });
      expect(prompt.getCharacterCount()).toBe(11);
    });

    it('should return 0 for empty text', () => {
      const prompt = new Prompt({ text: '' });
      expect(prompt.getCharacterCount()).toBe(0);
    });
  });

  describe('getWordCount', () => {
    it('should return correct word count', () => {
      const prompt = new Prompt({ text: 'Hello World Test' });
      expect(prompt.getWordCount()).toBe(3);
    });

    it('should return 0 for empty text', () => {
      const prompt = new Prompt({ text: '' });
      expect(prompt.getWordCount()).toBe(0);
    });

    it('should handle multiple spaces', () => {
      const prompt = new Prompt({ text: 'Hello   World' });
      expect(prompt.getWordCount()).toBe(2);
    });
  });

  describe('hasContent', () => {
    it('should return true for valid prompt', () => {
      const prompt = new Prompt({ text: 'Valid prompt text' });
      expect(prompt.hasContent()).toBe(true);
    });

    it('should return falsy for empty prompt', () => {
      const prompt = new Prompt({ text: '' });
      expect(prompt.hasContent()).toBeFalsy();
    });

    it('should return false for whitespace-only prompt', () => {
      const prompt = new Prompt({ text: '   ' });
      expect(prompt.hasContent()).toBe(false);
    });
  });

  describe('validate', () => {
    it('should return valid for prompt with text', () => {
      const prompt = new Prompt({ text: 'Valid prompt text' });
      const result = prompt.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for empty prompt', () => {
      const prompt = new Prompt({ text: '' });
      const result = prompt.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prompt text is required');
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new Prompt({
        id: 'test-123',
        text: 'Test prompt',
        title: 'Test Title',
      });
      
      const json = original.toJSON();
      const restored = Prompt.fromJSON(json);
      
      expect(restored.id).toBe(original.id);
      expect(restored.text).toBe(original.text);
      expect(restored.title).toBe(original.title);
    });
  });
});
