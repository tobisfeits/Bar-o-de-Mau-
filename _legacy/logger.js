/**
 * Logger - Structured Logging Utility
 * Provides consistent logging across the application
 */

const Logger = {
    // Log levels
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    // Current log level (can be configured)
    currentLevel: 1, // INFO by default

    /**
     * Format log message with timestamp and context
     */
    format(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const formatted = {
            timestamp,
            level,
            message,
            ...(data && { data })
        };
        return formatted;
    },

    /**
     * Debug - Development information
     */
    debug(message, data = null) {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            const formatted = this.format('DEBUG', message, data);
            console.debug(`🐛 [DEBUG] ${message}`, data || '');
        }
    },

    /**
     * Info - General information
     */
    info(message, data = null) {
        if (this.currentLevel <= this.LEVELS.INFO) {
            const formatted = this.format('INFO', message, data);
            console.log(`ℹ️ [INFO] ${message}`, data || '');
        }
    },

    /**
     * Warn - Warning messages
     */
    warn(message, data = null) {
        if (this.currentLevel <= this.LEVELS.WARN) {
            const formatted = this.format('WARN', message, data);
            console.warn(`⚠️ [WARN] ${message}`, data || '');
        }
    },

    /**
     * Error - Error messages
     */
    error(message, error = null, context = null) {
        if (this.currentLevel <= this.LEVELS.ERROR) {
            const formatted = this.format('ERROR', message, {
                error: error?.message || error,
                stack: error?.stack,
                context
            });
            console.error(`❌ [ERROR] ${message}`, {
                error,
                context
            });

            // Could send to error tracking service
            // this.sendToErrorTracking(formatted);
        }
    },

    /**
     * Success - Success messages
     */
    success(message, data = null) {
        const formatted = this.format('SUCCESS', message, data);
        console.log(`✅ [SUCCESS] ${message}`, data || '');
    },

    /**
     * Performance - Performance measurements
     */
    perf(label, duration) {
        console.log(`⚡ [PERF] ${label}: ${duration}ms`);
    },

    /**
     * Set log level
     */
    setLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = this.LEVELS[level.toUpperCase()] || this.LEVELS.INFO;
        } else {
            this.currentLevel = level;
        }
        console.log(`📊 [LOGGER] Level set to ${level}`);
    },

    /**
     * Performance timer
     */
    time(label) {
        console.time(`⏱️ ${label}`);
    },

    timeEnd(label) {
        console.timeEnd(`⏱️ ${label}`);
    }
};

// Auto-detect debug mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    Logger.setLevel('DEBUG');
}
