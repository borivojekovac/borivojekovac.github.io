// Podcastor App - Entry Point
import PodcastorApp from './app.js';

/**
 * Initialize the application when the DOM is fully loaded
 */
function initApp() {

    window.app = new PodcastorApp();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
