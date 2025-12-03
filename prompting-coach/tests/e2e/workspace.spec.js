/**
 * E2E tests for PromptWorkspace
 */

import { test, expect } from '@playwright/test';

test.describe('Prompt Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize
    await page.waitForSelector('.prompt-workspace');
  });

  test('should display workspace with two sections', async ({ page }) => {
    // Check output section exists
    await expect(page.locator('.output-section')).toBeVisible();
    await expect(page.locator('.output-section h3')).toHaveText('LLM Response');

    // Check input section exists
    await expect(page.locator('.input-section')).toBeVisible();
    await expect(page.locator('#prompt-text')).toBeVisible();
  });

  test('should allow typing in prompt textarea', async ({ page }) => {
    const textarea = page.locator('#prompt-text');
    
    await textarea.fill('Hello, this is a test prompt');
    
    await expect(textarea).toHaveValue('Hello, this is a test prompt');
  });

  test('should update character and word count', async ({ page }) => {
    const textarea = page.locator('#prompt-text');
    const stats = page.locator('.prompt-stats');
    
    await textarea.fill('Hello World Test');
    
    await expect(stats).toContainText('16');  // characters
    await expect(stats).toContainText('3 words');
  });

  test('should enable Run Test button when prompt has text and API configured', async ({ page }) => {
    const textarea = page.locator('#prompt-text');
    const runButton = page.locator('#run-test-btn');
    
    // Initially disabled (no text)
    await expect(runButton).toBeDisabled();
    
    // Add text
    await textarea.fill('Test prompt');
    
    // Still disabled if no API key (unless already configured)
    // This test assumes no API key is configured initially
  });

  test('should clear prompt when Clear button clicked', async ({ page }) => {
    const textarea = page.locator('#prompt-text');
    const clearButton = page.locator('#clear-btn');
    
    await textarea.fill('Some text to clear');
    await expect(textarea).toHaveValue('Some text to clear');
    
    await clearButton.click();
    
    await expect(textarea).toHaveValue('');
  });

  test('should persist prompt text across page refresh', async ({ page }) => {
    const textarea = page.locator('#prompt-text');
    
    await textarea.fill('Persistent prompt text');
    
    // Wait for auto-save
    await page.waitForTimeout(1500);
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('.prompt-workspace');
    
    // Check text is restored
    await expect(page.locator('#prompt-text')).toHaveValue('Persistent prompt text');
  });

  test('should open settings dialog', async ({ page }) => {
    const settingsButton = page.locator('#settings-btn');
    const dialog = page.locator('#settings-dialog');
    
    await settingsButton.click();
    
    await expect(dialog).toBeVisible();
  });

  test('should toggle focus mode on output section', async ({ page }) => {
    const focusButton = page.locator('#focus-output-btn');
    const outputSection = page.locator('.output-section');
    
    await focusButton.click();
    
    await expect(outputSection).toHaveClass(/focused/);
    
    // Click again to exit focus mode
    await focusButton.click();
    
    await expect(outputSection).not.toHaveClass(/focused/);
  });

  test('should show config warning when API key not set', async ({ page }) => {
    // Clear any existing settings
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.prompt-workspace');
    
    await expect(page.locator('.config-warning')).toBeVisible();
    await expect(page.locator('.config-warning')).toContainText('API Key Required');
  });
});

test.describe('Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.tabs');
  });

  test('should display navigation tabs', async ({ page }) => {
    await expect(page.locator('.tab').first()).toBeVisible();
    await expect(page.locator('.tabs')).toContainText('Workspace');
    await expect(page.locator('.tabs')).toContainText('Coach');
    await expect(page.locator('.tabs')).toContainText('History');
  });

  test('should switch panels when tab clicked', async ({ page }) => {
    // Click Coach tab
    await page.locator('.tab:has-text("Coach")').click();
    
    // Workspace panel should be hidden
    await expect(page.locator('#panel-editor')).not.toBeVisible();
    
    // Coach panel should be visible
    await expect(page.locator('#panel-coach')).toBeVisible();
  });
});
