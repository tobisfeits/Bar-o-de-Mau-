/**
 * Haptic Feedback Utility
 * Provides tactile feedback for mobile devices
 */

const Haptic = {
    /**
     * Check if vibration is supported
     */
    isSupported() {
        return 'vibrate' in navigator;
    },

    /**
     * Light tap (10ms)
     */
    light() {
        if (this.isSupported()) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium tap (20ms)
     */
    medium() {
        if (this.isSupported()) {
            navigator.vibrate(20);
        }
    },

    /**
     * Heavy tap (30ms)
     */
    heavy() {
        if (this.isSupported()) {
            navigator.vibrate(30);
        }
    },

    /**
     * Success pattern
     */
    success() {
        if (this.isSupported()) {
            navigator.vibrate([10, 50, 10]);
        }
    },

    /**
     * Error pattern
     */
    error() {
        if (this.isSupported()) {
            navigator.vibrate([20, 100, 20, 100, 20]);
        }
    },

    /**
     * Warning pattern
     */
    warning() {
        if (this.isSupported()) {
            navigator.vibrate([15, 75, 15]);
        }
    },

    /**
     * Selection pattern (for toggles, checkboxes)
     */
    selection() {
        if (this.isSupported()) {
            navigator.vibrate(5);
        }
    },

    /**
     * Custom pattern
     * @param {number|number[]} pattern - Vibration pattern
     */
    custom(pattern) {
        if (this.isSupported()) {
            navigator.vibrate(pattern);
        }
    }
};
