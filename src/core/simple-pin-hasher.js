/**
 * Simplified PIN Hasher - Inline bcrypt alternative
 * Uses Web Crypto API (built-in browser API, no external dependencies)
 * 
 * IMPORTANT: This is a simplified version for demonstration.
 * For production, consider using proper bcrypt from npm with bundler.
 */

export const SimplePINHasher = {
    /**
     * Hash a PIN using SHA-256 with salt
     * @param {string} pin - Plain text PIN
     * @returns {Promise<string>} Hashed PIN in format: salt$hash
     */
    async hashPIN(pin) {
        if (!pin || typeof pin !== 'string') {
            throw new Error('PIN must be a non-empty string');
        }

        try {
            // Generate random salt
            const salt = this.generateSalt();

            // Combine PIN with salt
            const saltedPIN = salt + pin;

            // Hash using SHA-256
            const encoder = new TextEncoder();
            const data = encoder.encode(saltedPIN);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);

            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Return in format: salt$hash
            const hashedPIN = `${salt}$${hashHex}`;

            console.log('✅ PIN hashed successfully (SHA-256)');
            return hashedPIN;
        } catch (error) {
            console.error('Error hashing PIN:', error);
            throw new Error('Failed to hash PIN');
        }
    },

    /**
     * Verify a PIN against a hash
     * @param {string} pin - Plain text PIN
     * @param {string} hashedPIN - Hashed PIN from database (salt$hash format)
     * @returns {Promise<boolean>} True if PIN matches
     */
    async verifyPIN(pin, hashedPIN) {
        if (!pin || !hashedPIN) {
            return false;
        }

        try {
            // Extract salt from stored hash
            const [salt, storedHash] = hashedPIN.split('$');

            if (!salt || !storedHash) {
                console.error('Invalid hash format');
                return false;
            }

            // Hash the input PIN with the same salt
            const saltedPIN = salt + pin;
            const encoder = new TextEncoder();
            const data = encoder.encode(saltedPIN);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);

            // Convert to hex
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Compare hashes (constant-time comparison would be better for production)
            return computedHash === storedHash;
        } catch (error) {
            console.error('Error verifying PIN:', error);
            return false;
        }
    },

    /**
     * Generate random salt
     * @returns {string} Random hex string
     */
    generateSalt() {
        const array = new Uint8Array(16); // 16 bytes = 128 bits
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Validate PIN strength
     * @param {string} pin - Plain text PIN
     * @returns {Object} Validation result
     */
    validatePINStrength(pin) {
        const errors = [];

        if (!pin) {
            return { valid: false, errors: ['PIN é obrigatório'] };
        }

        // Minimum 4 digits
        if (pin.length < 4) {
            errors.push('PIN deve ter pelo menos 4 dígitos');
        }

        // Maximum 8 digits
        if (pin.length > 8) {
            errors.push('PIN deve ter no máximo 8 dígitos');
        }

        // Only digits allowed
        if (!/^\d+$/.test(pin)) {
            errors.push('PIN deve conter apenas números');
        }

        // Avoid simple patterns
        if (pin === '1234' || pin === '0000' || pin === '1111') {
            errors.push('PIN muito simples. Evite sequências óbvias');
        }

        // Check for repeating digits
        if (/^(\d)\1+$/.test(pin)) {
            errors.push('PIN não pode ter todos os dígitos iguais');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

// Make globally available
window.SimplePINHasher = SimplePINHasher;

console.log('🔐 SimplePINHasher loaded (using Web Crypto API - SHA-256)');
