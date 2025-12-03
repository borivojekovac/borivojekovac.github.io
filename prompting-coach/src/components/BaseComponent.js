/**
 * BaseComponent
 * Base class for all UI components with lifecycle management and state subscription
 */

import { LogService } from '../services/LogService.js';

export class BaseComponent {
  /** @type {HTMLElement|null} */
  #container = null;

  /** @type {import('../state/AppState.js').AppState|null} */
  #appState = null;

  /** @type {LogService} */
  #log;

  /** @type {boolean} */
  #mounted = false;

  /** @type {Function|null} */
  #stateChangeHandler = null;

  /** @type {string[]} */
  #watchedPaths = [];

  /**
   * Creates a new component
   * @param {HTMLElement} container - Container element to render into
   * @param {import('../state/AppState.js').AppState} [appState] - Application state
   */
  constructor(container, appState = null) {
    this.#container = container;
    this.#appState = appState;
    this.#log = LogService.getInstance();
  }

  /**
   * Gets the container element
   * @returns {HTMLElement|null}
   */
  get container() {
    return this.#container;
  }

  /**
   * Gets the application state
   * @returns {import('../state/AppState.js').AppState|null}
   */
  get appState() {
    return this.#appState;
  }

  /**
   * Gets the logger
   * @returns {LogService}
   */
  get log() {
    return this.#log;
  }

  /**
   * Checks if component is mounted
   * @returns {boolean}
   */
  get isMounted() {
    return this.#mounted;
  }

  /**
   * Sets which state paths to watch for changes
   * @param {string[]} paths - Array of state paths to watch
   */
  watchState(paths) {
    this.#watchedPaths = paths;
  }

  /**
   * Mounts the component
   * Calls onMount lifecycle hook and sets up state subscription
   */
  mount() {
    if (this.#mounted) return;

    this.#log.trace(`Mounting ${this.constructor.name}`);

    // Subscribe to state changes
    if (this.#appState) {
      this.#stateChangeHandler = (event) => {
        const { detail } = event;
        
        // Check if any watched path changed
        if (this.#watchedPaths.length === 0) {
          this.onStateChange(detail);
          this.render();
        } else if (detail.batch) {
          const hasWatchedPath = detail.paths.some(p => 
            this.#watchedPaths.some(wp => p.startsWith(wp) || wp.startsWith(p))
          );
          if (hasWatchedPath) {
            this.onStateChange(detail);
            this.render();
          }
        } else if (detail.path) {
          const isWatched = this.#watchedPaths.some(wp => 
            detail.path.startsWith(wp) || wp.startsWith(detail.path)
          );
          if (isWatched) {
            this.onStateChange(detail);
            this.render();
          }
        }
      };
      
      this.#appState.addEventListener('change', this.#stateChangeHandler);
    }

    this.#mounted = true;
    this.onMount();
    this.render();
  }

  /**
   * Unmounts the component
   * Calls onUnmount lifecycle hook and removes state subscription
   */
  unmount() {
    if (!this.#mounted) return;

    this.#log.trace(`Unmounting ${this.constructor.name}`);

    // Unsubscribe from state changes
    if (this.#appState && this.#stateChangeHandler) {
      this.#appState.removeEventListener('change', this.#stateChangeHandler);
      this.#stateChangeHandler = null;
    }

    this.onUnmount();
    this.#mounted = false;

    // Clear container
    if (this.#container) {
      this.#container.innerHTML = '';
    }
  }

  /**
   * Renders the component
   * Override in subclass to provide component HTML
   */
  render() {
    if (!this.#container || !this.#mounted) return;
    
    const html = this.template();
    if (html !== null) {
      this.#container.innerHTML = html;
      this.onRender();
    }
  }

  /**
   * Returns the component's HTML template
   * Override in subclass
   * @returns {string|null}
   */
  template() {
    return null;
  }

  /**
   * Lifecycle hook called when component is mounted
   * Override in subclass
   */
  onMount() {}

  /**
   * Lifecycle hook called when component is unmounted
   * Override in subclass
   */
  onUnmount() {}

  /**
   * Lifecycle hook called after render
   * Use this to attach event listeners
   * Override in subclass
   */
  onRender() {}

  /**
   * Lifecycle hook called when watched state changes
   * @param {Object} detail - Change details
   */
  onStateChange(detail) {}

  /**
   * Queries an element within the container
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null}
   */
  $(selector) {
    return this.#container?.querySelector(selector) || null;
  }

  /**
   * Queries all elements within the container
   * @param {string} selector - CSS selector
   * @returns {NodeListOf<HTMLElement>|Array}
   */
  $$(selector) {
    if (!this.#container) return [];
    return this.#container.querySelectorAll(selector);
  }

  /**
   * Adds an event listener to an element within the container
   * @param {string} selector - CSS selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(selector, event, handler) {
    const element = this.$(selector);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  /**
   * Emits a custom event
   * @param {string} name - Event name
   * @param {*} [detail] - Event detail
   */
  emit(name, detail) {
    this.#container?.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      detail,
    }));
  }

  /**
   * Shows a loading state in the container
   * @param {string} [message='Loading...']
   */
  showLoading(message = 'Loading...') {
    if (this.#container) {
      this.#container.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-md" style="padding: var(--spacing-xl);">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * Shows an error state in the container
   * @param {string} message
   */
  showError(message) {
    if (this.#container) {
      this.#container.innerHTML = `
        <div class="message message-error">
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * Escapes HTML to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
