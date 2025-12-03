/**
 * Unit tests for LogService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogService } from '../../../src/services/LogService.js';

describe('LogService', () => {
  let logService;

  beforeEach(() => {
    // Get fresh instance and reset
    logService = LogService.getInstance();
    logService.setLevel('debug');
    logService.clearLogs();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LogService.getInstance();
      const instance2 = LogService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('setLevel', () => {
    it('should set log level', () => {
      logService.setLevel('warn');
      expect(logService.getLevel()).toBe('warn');
    });

    it('should keep current level for invalid level', () => {
      logService.setLevel('info');
      logService.setLevel('invalid');
      expect(logService.getLevel()).toBe('info');
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('should log error messages', () => {
      logService.error('Test error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logService.warn('Test warning');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logService.info('Test info');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log debug messages when level is debug', () => {
      logService.setLevel('debug');
      logService.debug('Test debug');
      expect(console.debug).toHaveBeenCalled();
    });

    it('should not log debug messages when level is info', () => {
      logService.setLevel('info');
      logService.debug('Test debug');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('buffer', () => {
    it('should store logs in buffer', () => {
      logService.info('Test message');
      const logs = logService.getRecentLogs();
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].message).toBe('Test message');
    });

    it('should clear buffer', () => {
      logService.info('Test message');
      logService.clearLogs();
      
      expect(logService.getRecentLogs()).toHaveLength(0);
    });
  });

  describe('timer', () => {
    it('should track timing', async () => {
      const timerId = logService.startTimer('test-operation');
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const elapsed = logService.endTimer(timerId);
      
      expect(elapsed).toBeGreaterThanOrEqual(10);
    });
  });
});
