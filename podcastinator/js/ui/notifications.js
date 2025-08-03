// Podcastor App - Notifications Manager
class NotificationsManager {
    constructor() {
        this.notificationTimeouts = new Map();
        this.notificationDuration = 5000; // 5 seconds
    }

    /**
     * Create notification container if it doesn't exist
     * @private
     */
    _ensureContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Create a new notification element
     * @private
     * @param {string} type - Notification type (error, success)
     * @param {string} message - Message to display
     * @returns {HTMLElement} The created notification element
     */
    _createNotification(type, message) {
        const container = this._ensureContainer();
        const notification = document.createElement('div');
        const id = `notification-${type}-${Date.now()}`;
        
        notification.id = id;
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '❌' : '✅'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Trigger reflow to enable animation
        void notification.offsetWidth;
        
        return notification;
    }

    /**
     * Show a notification
     * @private
     * @param {string} type - Notification type (error, success)
     * @param {string} message - Message to display
     */
    _showNotification(type, message) {
        // Clear any existing timeout for this notification type
        if (this.notificationTimeouts.has(type)) {
            clearTimeout(this.notificationTimeouts.get(type));
        }

        const notification = this._createNotification(type, message);
        const self = this;
        
        // Show notification
        notification.classList.add('show');
        
        // Auto-hide after duration
        const timeoutId = setTimeout(function() {
            notification.classList.remove('show');
            notification.classList.add('hide');
            
            // Remove from DOM after animation completes
            notification.addEventListener('transitionend', function handler() {
                notification.removeEventListener('transitionend', handler);
                notification.remove();
            });
            
            self.notificationTimeouts.delete(type);
        }, this.notificationDuration);
        
        this.notificationTimeouts.set(type, timeoutId);
    }

    /**
     * Show error notification
     * @param {string} message - Error message to display
     */
    showError(message) {
        this._showNotification('error', message);
    }

    /**
     * Show success notification
     * @param {string} message - Success message to display
     */
    showSuccess(message) {
        this._showNotification('success', message);
    }

    /**
     * Show a notification (legacy method)
     * @param {string} message - Message to display
     * @param {string} type - Type of notification ('success' or 'error')
     */
    showNotification(message, type) {
        this._showNotification(type, message);
    }
}

export default NotificationsManager;
