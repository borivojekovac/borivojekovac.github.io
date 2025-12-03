/**
 * Application Entry Point
 * Initializes services and mounts the application
 */

import { App } from './App.js';
import { LogService } from './services/LogService.js';

// Initialize logging first
const log = LogService.getInstance();
log.info('Application starting...');

// Initialize and mount the application
const app = new App();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.initialize();
    log.info('Application initialized successfully');
  } catch (error) {
    log.error('Failed to initialize application', {}, error);
    
    // Show error to user
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div class="message message-error" style="margin: 2rem;">
          <div>
            <h2>Failed to Start</h2>
            <p>The application could not be initialized. Please refresh the page or check the console for details.</p>
            <p><small>${error.message}</small></p>
          </div>
        </div>
      `;
    }
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  log.error('Unhandled promise rejection', { reason: event.reason?.message }, event.reason);
});

// Handle global errors
window.addEventListener('error', (event) => {
  log.error('Global error', { message: event.message, filename: event.filename, lineno: event.lineno }, event.error);
});
