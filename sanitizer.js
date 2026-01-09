/**
 * Input Sanitizer - Prevent XSS attacks
 * Sanitizes user input before rendering
 */

const Sanitizer = {
    /**
     * Sanitize HTML string to prevent XSS
     * @param {string} str - Input string to sanitize
     * @returns {string} - Sanitized string
     */
    html(str) {
        if (!str) return '';

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Sanitize for use in attributes
     * @param {string} str - Input string
     * @returns {string} - Sanitized string
     */
    attribute(str) {
        if (!str) return '';

        return str
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    /**
     * Sanitize URL to prevent javascript: protocol
     * @param {string} url - URL to sanitize
     * @returns {string} - Safe URL or empty string
     */
    url(url) {
        if (!url) return '';

        const trimmed = url.trim().toLowerCase();

        // Block dangerous protocols
        if (trimmed.startsWith('javascript:') ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('vbscript:')) {
            Logger.warn('Blocked dangerous URL', { url });
            return '';
        }

        return url;
    },

    /**
     * Sanitize for SQL-like queries (basic protection)
     * @param {string} str - Input string
     * @returns {string} - Sanitized string
     */
    query(str) {
        if (!str) return '';

        return str
            .replace(/'/g, "''")
            .replace(/;/g, '')
            .replace(/--/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '');
    },

    /**
     * Strip all HTML tags
     * @param {string} str - Input string
     * @returns {string} - Plain text
     */
    stripTags(str) {
        if (!str) return '';

        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    },

    /**
     * Sanitize filename
     * @param {string} filename - Filename to sanitize
     * @returns {string} - Safe filename
     */
    filename(filename) {
        if (!filename) return '';

        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.{2,}/g, '.')
            .substring(0, 255);
    },

    /**
     * Validate and sanitize email
     * @param {string} email - Email to validate
     * @returns {string|null} - Valid email or null
     */
    email(email) {
        if (!email) return null;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitized = email.trim().toLowerCase();

        return emailRegex.test(sanitized) ? sanitized : null;
    },

    /**
     * Sanitize phone number (Brazilian format)
     * @param {string} phone - Phone number
     * @returns {string} - Sanitized phone
     */
    phone(phone) {
        if (!phone) return '';

        // Remove all non-digits
        return phone.replace(/\D/g, '');
    },

    /**
     * Sanitize date input
     * @param {string} date - Date string
     * @returns {string|null} - Valid date or null
     */
    date(date) {
        if (!date) return null;

        const dateObj = new Date(date);
        return isNaN(dateObj.getTime()) ? null : date;
    },

    /**
     * Normalize name to Title Case with exceptions for Portuguese connectives
     * @param {string} name - Name to normalize (e.g., "TOBIAS FEITOSA DE MATOS")
     * @returns {string} - Normalized name (e.g., "Tobias Feitosa de Matos")
     * 
     * Examples:
     * - "TOBIAS FEITOSA DE MATOS" → "Tobias Feitosa de Matos"
     * - "MARIA DAS GRAÇAS" → "Maria das Graças"
     * - "JOÃO DOS SANTOS" → "João dos Santos"
     */
    normalizeName(name) {
        if (!name) return '';

        // List of Portuguese connectives that should remain lowercase
        const exceptions = ['da', 'de', 'do', 'das', 'dos', 'e'];

        // Split the name into words
        const words = name.trim().toLowerCase().split(/\s+/);

        // Process each word
        const normalizedWords = words.map((word, index) => {
            // Check if the word is in the exceptions list
            // Don't apply exception to the first word (always capitalize first word)
            if (index > 0 && exceptions.includes(word)) {
                return word; // Keep lowercase
            }

            // Capitalize first letter, keep rest lowercase
            return word.charAt(0).toUpperCase() + word.slice(1);
        });

        return normalizedWords.join(' ');
    }
};
