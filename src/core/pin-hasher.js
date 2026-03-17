/**
 * PIN Hashing Utility
 * Uses bcryptjs for client-side PIN hashing
 * 
 * Installation required:
 * npm install bcryptjs
 * 
 * OR use CDN in index.html:
 * <script src="https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js"></script>
 */

export const PINHasher = {
    /**
     * Hash a PIN using bcrypt
     * @param {string} pin - Plain text PIN
     * @returns {Promise<string>} Hashed PIN
     */
    async hashPIN(pin) {
        if (!pin || typeof pin !== 'string') {
            throw new Error('PIN must be a non-empty string');
        }

        try {
            // Use bcrypt from CDN (global variable) or import
            const bcrypt = window.dcodeIO?.bcrypt || window.bcrypt;

            if (!bcrypt) {
                throw new Error('bcrypt library not loaded. Add script tag to index.html');
            }

            // Generate salt with cost factor 10 (good balance of security/speed)
            const salt = await bcrypt.genSalt(10);

            // Hash the PIN
            const hashedPIN = await bcrypt.hash(pin, salt);

            console.log('PIN hashed successfully');
            return hashedPIN;
        } catch (error) {
            console.error('Error hashing PIN:', error);
            throw new Error('Failed to hash PIN');
        }
    },

    /**
     * Verify a PIN against a hash
     * @param {string} pin - Plain text PIN
     * @param {string} hashedPIN - Hashed PIN from database
     * @returns {Promise<boolean>} True if PIN matches
     */
    async verifyPIN(pin, hashedPIN) {
        if (!pin || !hashedPIN) {
            return false;
        }

        try {
            const bcrypt = window.dcodeIO?.bcrypt || window.bcrypt;

            if (!bcrypt) {
                throw new Error('bcrypt library not loaded');
            }

            const isValid = await bcrypt.compare(pin, hashedPIN);
            return isValid;
        } catch (error) {
            console.error('Error verifying PIN:', error);
            return false;
        }
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

        // Maximum 20 characters
        if (pin.length > 20) {
            errors.push('A senha deve ter no máximo 20 caracteres');
        }

        // Only digits allowed
        if (!/^\d+$/.test(pin)) {
            errors.push('PIN deve conter apenas números');
        }

        // Avoid simple patterns
        if (pin === '1234' || pin === '0000' || pin === '1111') {
            errors.push('PIN muito simples. Evite sequências óbvias');
        }

        // Check for repeating digits (e.g., 1111, 2222)
        if (/^(\d)\1+$/.test(pin)) {
            errors.push('PIN não pode ter todos os dígitos iguais');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

/**
 * Example usage in login flow:
 * 
 * // During password change:
 * const newPIN = '1234';
 * const validation = PINHasher.validatePINStrength(newPIN);
 * 
 * if (!validation.valid) {
 *     showError(validation.errors.join(', '));
 *     return;
 * }
 * 
 * const hashedPIN = await PINHasher.hashPIN(newPIN);
 * 
 * // Save to database
 * await supabaseClient
 *     .from('app_users')
 *     .update({ hashed_pin: hashedPIN, must_change_password: false })
 *     .eq('id', userId);
 * 
 * 
 * // During login:
 * const user = await supabaseClient
 *     .from('app_users')
 *     .select('*')
 *     .eq('name', userName)
 *     .single();
 * 
 * const isValid = await PINHasher.verifyPIN(enteredPIN, user.hashed_pin);
 * 
 * if (isValid) {
 *     // Login successful
 * } else {
 *     // Invalid PIN
 * }
 */
