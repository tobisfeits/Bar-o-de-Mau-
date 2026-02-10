/**
 * Session Management with Timeout
 * Implements automatic logout after 24 hours of inactivity
 */

export const SessionManager = {
    // Session duration: 24 hours
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

    // Warning before logout: 5 minutes
    WARNING_BEFORE_LOGOUT: 5 * 60 * 1000, // 5 minutes

    // Storage keys
    STORAGE_KEYS: {
        USER: 'cd_rbac_user',
        TIMESTAMP: 'cd_session_timestamp',
        LAST_ACTIVITY: 'cd_last_activity'
    },

    /**
     * Start a new session
     * @param {Object} userData - User data to store
     */
    startSession(userData) {
        const now = Date.now();

        localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(this.STORAGE_KEYS.TIMESTAMP, now.toString());
        localStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, now.toString());

        console.log('✅ Session started:', {
            user: userData.name,
            role: userData.role,
            expiresIn: this.getTimeUntilExpiry()
        });

        // Start monitoring session
        this.startMonitoring();
    },

    /**
     * Update last activity timestamp
     */
    updateActivity() {
        const now = Date.now();
        localStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, now.toString());
    },

    /**
     * Check if session is valid
     * @returns {boolean}
     */
    isSessionValid() {
        const timestamp = localStorage.getItem(this.STORAGE_KEYS.TIMESTAMP);

        if (!timestamp) {
            return false;
        }

        const elapsed = Date.now() - parseInt(timestamp);
        return elapsed < this.SESSION_DURATION;
    },

    /**
     * Get time until session expires (in milliseconds)
     * @returns {number}
     */
    getTimeUntilExpiry() {
        const timestamp = localStorage.getItem(this.STORAGE_KEYS.TIMESTAMP);

        if (!timestamp) {
            return 0;
        }

        const elapsed = Date.now() - parseInt(timestamp);
        const remaining = this.SESSION_DURATION - elapsed;

        return Math.max(0, remaining);
    },

    /**
     * Get user data if session is valid
     * @returns {Object|null}
     */
    getUser() {
        if (!this.isSessionValid()) {
            console.warn('⚠️ Session expired');
            this.endSession();
            return null;
        }

        const userData = localStorage.getItem(this.STORAGE_KEYS.USER);

        if (!userData) {
            return null;
        }

        // Update last activity
        this.updateActivity();

        return JSON.parse(userData);
    },

    /**
     * End the session
     */
    endSession() {
        localStorage.removeItem(this.STORAGE_KEYS.USER);
        localStorage.removeItem(this.STORAGE_KEYS.TIMESTAMP);
        localStorage.removeItem(this.STORAGE_KEYS.LAST_ACTIVITY);

        console.log('🔒 Session ended');

        // Stop monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        // Redirect to login
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = '/index.html';
        }
    },

    /**
     * Format time remaining as human-readable string
     * @param {number} ms - Milliseconds
     * @returns {string}
     */
    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    },

    /**
     * Start monitoring session expiry
     */
    startMonitoring() {
        // Clear existing interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Check every minute
        this.monitoringInterval = setInterval(() => {
            const remaining = this.getTimeUntilExpiry();

            // Session expired
            if (remaining <= 0) {
                console.warn('⏰ Session expired');
                this.showExpiryNotification('Sua sessão expirou. Faça login novamente.');
                this.endSession();
                return;
            }

            // Show warning 5 minutes before expiry
            if (remaining <= this.WARNING_BEFORE_LOGOUT && !this.warningShown) {
                this.warningShown = true;
                const timeStr = this.formatTimeRemaining(remaining);
                this.showExpiryNotification(
                    `Sua sessão expirará em ${timeStr}. Salve seu trabalho.`,
                    'warning'
                );
            }

            // Log remaining time (debug)
            if (remaining < 60 * 60 * 1000) { // Less than 1 hour
                console.log(`⏱️ Session expires in: ${this.formatTimeRemaining(remaining)}`);
            }
        }, 60 * 1000); // Check every minute
    },

    /**
     * Show expiry notification to user
     * @param {string} message
     * @param {string} type - 'warning' | 'error'
     */
    showExpiryNotification(message, type = 'error') {
        // Use toast notification if available
        if (window.Toast) {
            window.Toast.show(message, type);
        } else {
            alert(message);
        }
    },

    /**
     * Extend session (refresh timestamp)
     */
    extendSession() {
        const userData = this.getUser();

        if (userData) {
            console.log('🔄 Session extended');
            this.startSession(userData);
            this.warningShown = false; // Reset warning flag
        }
    },

    /**
     * Initialize session manager
     */
    init() {
        // Check for existing session
        const user = this.getUser();

        if (user) {
            console.log('✅ Session restored:', user.name);
            this.startMonitoring();

            // Track user activity
            this.trackActivity();
        }
    },

    /**
     * Track user activity to update last activity timestamp
     */
    trackActivity() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });
    }
};

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
    SessionManager.init();
}

/**
 * Usage in auth.js:
 * 
 * import { SessionManager } from './session-manager.js';
 * 
 * // After successful login:
 * SessionManager.startSession(userData);
 * 
 * // On logout:
 * SessionManager.endSession();
 * 
 * // Check if user is logged in:
 * const user = SessionManager.getUser();
 * if (!user) {
 *     redirectToLogin();
 * }
 */
