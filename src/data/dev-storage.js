/**
 * Development In-Memory Storage
 * Fallback when localStorage is blocked by browser privacy settings
 */

const memoryStore = {
    users: [
        { id: 'diane_direcao', name: 'Diane', password: 'dia2026', role: 'super_admin' },
        { id: 'silas_direcao', name: 'Silas', password: 'sil2026', role: 'super_admin' },
        { id: 'vania_direcao', name: 'Vânia', password: 'van2026', role: 'super_admin' },
        { id: 'tobias_admin', name: 'Tobias', password: 'tob2026', role: 'super_admin' }
    ],
    units: [
        { id: 'baronesas', name: 'Baronesas', logo: null },
        { id: 'baroes', name: 'Barões', logo: null },
        { id: 'duquesas', name: 'Duquesas', logo: null },
        { id: 'imperadores', name: 'Imperadores', logo: null },
        { id: 'imperatrizes', name: 'Imperatrizes', logo: null },
        { id: 'lokomotiva', name: 'Lokomotiva', logo: null }
    ],
    members: [
        { id: 'm001', name: 'Ana Silva', unitId: 'baronesas', active: true, photo_url: null },
        { id: 'm002', name: 'Bruno Costa', unitId: 'baroes', active: true, photo_url: null },
        { id: 'm003', name: 'Carla Souza', unitId: 'duquesas', active: true, photo_url: null }
    ],
    scores: {},
    counselorScores: {},
    currentUser: null
};

export const DevStorage = {
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('⚠️ localStorage bloqueado - usando modo de desenvolvimento (memória)');
            return false;
        }
    },

    get(key) {
        if (this.isAvailable()) {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch (e) {
                return null;
            }
        }

        // Fallback to memory
        switch (key) {
            case 'cd_users':
                return memoryStore.users;
            case 'cd_units':
                return memoryStore.units;
            case 'cd_members':
                return memoryStore.members;
            case 'cd_scores':
                return memoryStore.scores;
            case 'cd_counselor_scores':
                return memoryStore.counselorScores;
            case 'cd_current_user':
                return memoryStore.currentUser;
            default:
                return null;
        }
    },

    set(key, value) {
        if (this.isAvailable()) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Failed to write to localStorage:', e);
            }
        }

        // Fallback to memory
        switch (key) {
            case 'cd_users':
                memoryStore.users = value;
                break;
            case 'cd_units':
                memoryStore.units = value;
                break;
            case 'cd_members':
                memoryStore.members = value;
                break;
            case 'cd_scores':
                memoryStore.scores = value;
                break;
            case 'cd_counselor_scores':
                memoryStore.counselorScores = value;
                break;
            case 'cd_current_user':
                memoryStore.currentUser = value;
                break;
        }
        return false; // Indicate it's using memory, not persistent
    },

    remove(key) {
        if (this.isAvailable()) {
            localStorage.removeItem(key);
        }

        switch (key) {
            case 'cd_current_user':
                memoryStore.currentUser = null;
                break;
        }
    }
};
