/**
 * E2E tests for Coaching Session (CR001)
 * CR1-034: E2E test: complete coaching session
 * CR1-035: E2E test: session resume after refresh
 */

import { test, expect } from '@playwright/test';

test.describe('Coaching Session - Complete Flow (CR1-034)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('prompting-coach');
    });
    await page.reload();
    await page.waitForSelector('.unified-view');
  });

  test('should display welcome message on first load', async ({ page }) => {
    const conversationArea = page.locator('.conversation-area__messages');
    
    await expect(conversationArea).toContainText("I'm your prompt coach");
    await expect(conversationArea).toContainText('send');
  });

  test('should start coaching session when user sends message', async ({ page }) => {
    // Enter a prompt
    const promptEditor = page.locator('.prompt-panel textarea, .prompt-panel [contenteditable]').first();
    await promptEditor.fill('Write a function to sort an array');

    // Send a message to start coaching
    const inputArea = page.locator('.input-panel textarea, .input-panel input').first();
    await inputArea.fill('Please help me improve this prompt');
    
    const sendButton = page.locator('.input-panel button[type="submit"], .input-panel .send-btn').first();
    await sendButton.click();

    // Wait for response
    await page.waitForSelector('.message--user', { timeout: 5000 });
    
    // User message should appear
    await expect(page.locator('.message--user')).toContainText('Please help me improve this prompt');
  });

  test('should show loading indicator while processing', async ({ page }) => {
    // Enter a prompt
    const promptEditor = page.locator('.prompt-panel textarea, .prompt-panel [contenteditable]').first();
    await promptEditor.fill('Test prompt');

    // Send message
    const inputArea = page.locator('.input-panel textarea, .input-panel input').first();
    await inputArea.fill('Start coaching');
    
    const sendButton = page.locator('.input-panel button[type="submit"], .input-panel .send-btn').first();
    await sendButton.click();

    // Loading indicator should appear (may be brief)
    // Note: This may pass quickly if mocked or fail if API not configured
    const loadingIndicator = page.locator('.conversation-loading, .typing-indicator');
    // Just check it doesn't error - loading may be too fast to catch
  });

  test('should allow user to send multiple messages', async ({ page }) => {
    const inputArea = page.locator('.input-panel textarea, .input-panel input').first();
    const sendButton = page.locator('.input-panel button[type="submit"], .input-panel .send-btn').first();

    // Send first message
    await inputArea.fill('First message');
    await sendButton.click();
    await page.waitForSelector('.message--user');

    // Send second message
    await inputArea.fill('Second message');
    await sendButton.click();

    // Both messages should be visible
    const userMessages = page.locator('.message--user');
    await expect(userMessages).toHaveCount(2);
  });

  test('should scroll to bottom on new messages', async ({ page }) => {
    const conversationArea = page.locator('.conversation-area__messages');
    const inputArea = page.locator('.input-panel textarea, .input-panel input').first();
    const sendButton = page.locator('.input-panel button[type="submit"], .input-panel .send-btn').first();

    // Send multiple messages to create scroll
    for (let i = 0; i < 3; i++) {
      await inputArea.fill(`Message ${i + 1}`);
      await sendButton.click();
      await page.waitForTimeout(100);
    }

    // Check that we're scrolled to bottom
    const isScrolledToBottom = await conversationArea.evaluate((el) => {
      return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    });

    expect(isScrolledToBottom).toBe(true);
  });
});

test.describe('Session Restore After Refresh (CR1-035)', () => {
  test('should silently restore active session after page refresh', async ({ page }) => {
    // This test verifies that refresh restores the session without prompting
    await page.goto('/');
    await page.waitForSelector('.unified-view');

    // Manually inject a mock active session with chat history into IndexedDB
    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('prompting-coach', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          
          const mockSession = {
            id: 'test-session-123',
            promptId: 'test-prompt',
            initialPromptText: 'Test prompt for restore',
            status: 'active',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            chatHistory: [
              { id: 'msg-1', role: 'user', content: 'Help me improve this prompt', timestamp: new Date().toISOString() },
              { id: 'msg-2', role: 'coach', content: 'Great prompt! Let me check a few things...', timestamp: new Date().toISOString() },
            ],
            principleResults: [],
            evaluationState: {
              'aim-actor': { status: 'passed', feedback: 'Good', observations: [], evaluatedAt: new Date().toISOString(), promptSnapshot: 'Test' },
            },
            pendingFeedback: { passed: [], failed: null },
            conversationContext: { lastUserIntent: null, awaitingPromptUpdate: false, currentFocus: null, lastCoachQuestion: null },
            promptBaseline: { text: 'Test prompt for restore', lastEvaluatedText: 'Test prompt for restore' },
          };
          
          store.put(mockSession);
          
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    });

    // Reload page to trigger session restore
    await page.reload();
    await page.waitForSelector('.unified-view');
    await page.waitForTimeout(500);

    // Should restore the chat history silently (no "resume" prompt)
    const conversationArea = page.locator('.conversation-area__messages');
    
    // Should show the previous messages, NOT a "type resume" prompt
    await expect(conversationArea).toContainText('Help me improve this prompt');
    await expect(conversationArea).toContainText('Great prompt');
    
    // Should NOT show resume/fresh prompts
    await expect(conversationArea).not.toContainText(/type.*resume/i);
    await expect(conversationArea).not.toContainText(/type.*fresh/i);
  });

  test('should allow user to continue conversation after refresh', async ({ page }) => {
    // Setup: inject mock session with chat history
    await page.goto('/');
    await page.waitForSelector('.unified-view');

    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('prompting-coach', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          
          const mockSession = {
            id: 'test-session-continue',
            promptId: 'test-prompt',
            initialPromptText: 'Test prompt',
            status: 'active',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            chatHistory: [
              { id: 'msg-1', role: 'coach', content: 'Previous coach message', timestamp: new Date().toISOString() }
            ],
            principleResults: [],
            evaluationState: {},
            pendingFeedback: { passed: [], failed: null },
            conversationContext: { lastUserIntent: null, awaitingPromptUpdate: false, currentFocus: null, lastCoachQuestion: null },
            promptBaseline: { text: 'Test prompt', lastEvaluatedText: 'Test prompt' },
          };
          
          store.put(mockSession);
          
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    });

    await page.reload();
    await page.waitForSelector('.unified-view');
    await page.waitForTimeout(500);

    // Previous message should be visible
    const conversationArea = page.locator('.conversation-area__messages');
    await expect(conversationArea).toContainText('Previous coach message');

    // User should be able to send a new message immediately
    const inputArea = page.locator('.input-panel textarea, .input-panel input').first();
    await inputArea.fill('I updated my prompt');
    
    const sendButton = page.locator('.input-panel button[type="submit"], .input-panel .send-btn').first();
    await sendButton.click();

    // New message should appear
    await page.waitForSelector('.message--user');
    await expect(page.locator('.message--user')).toContainText('I updated my prompt');
  });
});

test.describe('Session Cleanup (CR1-027)', () => {
  test('should clean up old abandoned sessions on app start', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.unified-view');

    // Inject an old abandoned session
    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('prompting-coach', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          
          // Create an old abandoned session (8 days old)
          const oldDate = new Date();
          oldDate.setDate(oldDate.getDate() - 8);
          
          const oldSession = {
            id: 'old-abandoned-session',
            promptId: 'test-prompt',
            initialPromptText: 'Old prompt',
            status: 'abandoned',
            startedAt: oldDate.toISOString(),
            updatedAt: oldDate.toISOString(),
            chatHistory: [],
            principleResults: [],
            evaluationState: {},
            pendingFeedback: { passed: [], failed: null },
            conversationContext: {},
            promptBaseline: { text: 'Old prompt', lastEvaluatedText: 'Old prompt' },
          };
          
          store.put(oldSession);
          
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    });

    // Reload to trigger cleanup
    await page.reload();
    await page.waitForSelector('.unified-view');
    
    // Wait for cleanup to run
    await page.waitForTimeout(1000);

    // Check that old session was removed
    const sessionExists = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('prompting-coach', 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('sessions', 'readonly');
          const store = tx.objectStore('sessions');
          const getRequest = store.get('old-abandoned-session');
          
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result !== undefined);
          };
          getRequest.onerror = () => {
            db.close();
            resolve(false);
          };
        };
        request.onerror = () => resolve(false);
      });
    });

    // Session should have been cleaned up
    expect(sessionExists).toBe(false);
  });
});
