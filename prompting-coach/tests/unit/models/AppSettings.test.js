/**
 * Unit tests for AppSettings model
 */

import { describe, it, expect } from 'vitest';
import { AppSettings, PROVIDERS, LOG_LEVELS, THEMES } from '../../../src/models/AppSettings.js';

describe('AppSettings', () => {
  describe('constructor', () => {
    it('should create settings with default values', () => {
      const settings = new AppSettings();
      
      expect(settings.provider).toBe('openai');
      expect(settings.model).toBe('gpt-4o-mini');
      expect(settings.apiKeys).toEqual({});
      expect(settings.logLevel).toBe('info');
      expect(settings.theme).toBe('system');
      expect(settings.autoSave).toBe(true);
    });

    it('should create settings with provided values', () => {
      const data = {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        apiKeys: { anthropic: 'test-key' },
        logLevel: 'debug',
        theme: 'dark',
        autoSave: false,
      };
      
      const settings = new AppSettings(data);
      
      expect(settings.provider).toBe('anthropic');
      expect(settings.model).toBe('claude-3-sonnet');
      expect(settings.apiKeys.anthropic).toBe('test-key');
      expect(settings.logLevel).toBe('debug');
      expect(settings.theme).toBe('dark');
      expect(settings.autoSave).toBe(false);
    });
  });

  describe('getCurrentApiKey', () => {
    it('should return API key for current provider', () => {
      const settings = new AppSettings({
        provider: 'openai',
        apiKeys: { openai: 'sk-test-key' },
      });
      
      expect(settings.getCurrentApiKey()).toBe('sk-test-key');
    });

    it('should return null for missing key', () => {
      const settings = new AppSettings();
      expect(settings.getCurrentApiKey()).toBeNull();
    });
  });

  describe('setApiKey', () => {
    it('should set API key for specified provider', () => {
      const settings = new AppSettings();
      settings.setApiKey('openai', 'new-key');
      
      expect(settings.apiKeys.openai).toBe('new-key');
    });

    it('should set API key for different provider', () => {
      const settings = new AppSettings();
      settings.setApiKey('google', 'google-key');
      
      expect(settings.apiKeys.google).toBe('google-key');
    });
  });

  describe('hasApiKey', () => {
    it('should return true when API key is set', () => {
      const settings = new AppSettings({
        provider: 'openai',
        apiKeys: { openai: 'sk-test' },
      });
      
      expect(settings.hasApiKey()).toBe(true);
    });

    it('should return falsy when API key is missing', () => {
      const settings = new AppSettings({ provider: 'openai' });
      expect(settings.hasApiKey()).toBeFalsy();
    });

    it('should return falsy when API key is empty', () => {
      const settings = new AppSettings({
        provider: 'openai',
        apiKeys: { openai: '' },
      });
      
      expect(settings.hasApiKey()).toBeFalsy();
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new AppSettings({
        provider: 'openai',
        model: 'gpt-4',
        apiKeys: { openai: 'test-key' },
        theme: 'dark',
      });
      
      const json = original.toJSON();
      const restored = AppSettings.fromJSON(json);
      
      expect(restored.provider).toBe(original.provider);
      expect(restored.model).toBe(original.model);
      expect(restored.apiKeys.openai).toBe(original.apiKeys.openai);
      expect(restored.theme).toBe(original.theme);
    });
  });

  describe('constants', () => {
    it('should export PROVIDERS as object with provider configs', () => {
      expect(PROVIDERS.openai).toBeDefined();
      expect(PROVIDERS.openai.name).toBe('OpenAI');
      expect(PROVIDERS.anthropic).toBeDefined();
      expect(PROVIDERS.google).toBeDefined();
    });

    it('should export LOG_LEVELS', () => {
      expect(LOG_LEVELS).toContain('error');
      expect(LOG_LEVELS).toContain('warn');
      expect(LOG_LEVELS).toContain('info');
      expect(LOG_LEVELS).toContain('debug');
    });

    it('should export THEMES', () => {
      expect(THEMES).toContain('light');
      expect(THEMES).toContain('dark');
      expect(THEMES).toContain('system');
    });
  });
});
