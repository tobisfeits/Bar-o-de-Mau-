/**
 * BiometricAuth - WebAuthn Passkeys for fingerprint/FaceID login
 * Uses the Web Authentication API (navigator.credentials)
 * Works on HTTPS only (Vercel ✓)
 */
export const BiometricAuth = {
    STORAGE_KEY: 'barao_biometric_credential',

    /**
     * Check if WebAuthn is supported on this device/browser
     */
    isAvailable() {
        return !!(window.PublicKeyCredential && navigator.credentials);
    },

    /**
     * Check if this device already has a registered credential
     */
    hasCredential() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return !!stored;
        } catch {
            return false;
        }
    },

    /**
     * Get stored credential info
     */
    getStoredCredential() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        } catch {
            return null;
        }
    },

    /**
     * Register biometric credential for a user
     * Called after successful PIN login
     */
    async register(userId, userName) {
        if (!this.isAvailable()) {
            throw new Error('WebAuthn não suportado neste navegador');
        }

        try {
            // Generate a random challenge
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // RP (Relying Party) info
            const rp = {
                name: 'Barão de Mauá',
                id: window.location.hostname
            };

            // User info
            const user = {
                id: new TextEncoder().encode(userId),
                name: userName,
                displayName: userName
            };

            // Create credential options
            const createOptions = {
                publicKey: {
                    challenge,
                    rp,
                    user,
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },   // ES256
                        { alg: -257, type: 'public-key' }  // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform', // Use device biometric
                        userVerification: 'required',
                        residentKey: 'preferred'
                    },
                    timeout: 60000,
                    attestation: 'none'
                }
            };

            const credential = await navigator.credentials.create(createOptions);

            if (!credential) {
                throw new Error('Credencial não criada');
            }

            // Store credential info locally
            const credentialData = {
                credentialId: this._arrayBufferToBase64(credential.rawId),
                userId: userId,
                userName: userName,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentialData));
            console.log('✅ Biometric credential registered for:', userName);

            return true;

        } catch (error) {
            console.error('❌ Biometric registration failed:', error);
            // NotAllowedError = user cancelled
            if (error.name === 'NotAllowedError') {
                throw new Error('Registro cancelado pelo usuário');
            }
            throw error;
        }
    },

    /**
     * Authenticate using biometrics
     * Returns the userId if successful
     */
    async authenticate() {
        if (!this.isAvailable() || !this.hasCredential()) {
            throw new Error('Biometria não disponível');
        }

        const stored = this.getStoredCredential();
        if (!stored) {
            throw new Error('Nenhuma credencial registrada');
        }

        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const getOptions = {
                publicKey: {
                    challenge,
                    allowCredentials: [{
                        id: this._base64ToArrayBuffer(stored.credentialId),
                        type: 'public-key',
                        transports: ['internal']
                    }],
                    userVerification: 'required',
                    timeout: 60000
                }
            };

            const assertion = await navigator.credentials.get(getOptions);

            if (!assertion) {
                throw new Error('Autenticação falhou');
            }

            console.log('✅ Biometric authentication successful for:', stored.userName);
            return {
                userId: stored.userId,
                userName: stored.userName
            };

        } catch (error) {
            console.error('❌ Biometric authentication failed:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Autenticação cancelada');
            }
            throw error;
        }
    },

    /**
     * Remove stored credential (logout / reset)
     */
    removeCredential() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('🗑️ Biometric credential removed');
    },

    // --- Utility ---
    _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    },

    _base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
};
