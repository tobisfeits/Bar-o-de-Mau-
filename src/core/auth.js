import { DataAdapter } from '../data/repository.js';

export const RBAC = {
    // Current user data with role and unit
    currentUser: null,

    // Role definitions
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        CONSELHEIRO: 'conselheiro',
        DESBRAVADOR: 'desbravador'
    },

    /**
     * Fetch user data from Supabase app_users table
     * @param {string} userName - User name to search for
     * @returns {Object|null} User data with role and unidade_id
     */
    async fetchUserData(userName) {
        if (!DataAdapter.useSupabase()) {
            console.warn('Supabase not available, RBAC disabled');
            return null;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('app_users')
                .select('id, name, role, unidade_id')
                .eq('name', userName)
                .single();

            if (error) {
                console.error('Error fetching user data:', error);
                return null;
            }

            this.currentUser = data;
            // Store in localStorage for persistence
            localStorage.setItem('cd_rbac_user', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Error in fetchUserData:', error);
            return null;
        }
    },

    /**
     * Load user data from localStorage
     */
    loadUserData() {
        const stored = localStorage.getItem('cd_rbac_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
        return this.currentUser;
    },

    /**
     * Clear user RBAC data
     */
    clearUserData() {
        this.currentUser = null;
        localStorage.removeItem('cd_rbac_user');
    },

    /**
     * Get current user role
     * @returns {string|null}
     */
    getUserRole() {
        return this.currentUser?.role || null;
    },

    /**
     * Get current user's unit ID
     * @returns {string|null}
     */
    getUserUnitId() {
        return this.currentUser?.unidade_id || null;
    },

    /**
     * Check if user is Super Admin
     * @returns {boolean}
     */
    isSuperAdmin() {
        return this.getUserRole() === this.ROLES.SUPER_ADMIN;
    },

    /**
     * Check if user is Conselheiro
     * @returns {boolean}
     */
    isConselheiro() {
        return this.getUserRole() === this.ROLES.CONSELHEIRO;
    },

    /**
     * Check if user is Desbravador
     * @returns {boolean}
     */
    isDesbravador() {
        return this.getUserRole() === this.ROLES.DESBRAVADOR;
    },

    /**
     * Check if user can view all units
     * @returns {boolean}
     */
    canViewAllUnits() {
        return this.isSuperAdmin();
    },

    /**
     * Check if user can view a specific unit
     * @param {string} unitId
     * @returns {boolean}
     */
    canViewUnit(unitId) {
        if (this.isSuperAdmin()) return true;
        if (this.isConselheiro()) return this.getUserUnitId() === unitId;
        if (this.isDesbravador()) {
            // Desbravador can view their own unit (will be checked via member data)
            return true;
        }
        return false;
    },

    /**
     * Check if user can edit scores for a member
     * @param {Object} member
     * @returns {boolean}
     */
    canEditMemberScore(member) {
        if (this.isSuperAdmin()) return true;
        if (this.isConselheiro()) return member.unitId === this.getUserUnitId();
        return false; // Desbravador cannot edit scores
    },

    /**
     * Check if user can view counselor evaluations
     * @returns {boolean}
     */
    canViewCounselorEvaluations() {
        return this.isSuperAdmin();
    },

    /**
     * Check if user can manage units (create, edit, delete)
     * @returns {boolean}
     */
    canManageUnits() {
        return this.isSuperAdmin();
    },

    /**
     * Check if user can evaluate a specific member
     * @param {string} unitId - Member's unit ID
     * @returns {boolean}
     */
    canEvaluateMember(unitId) {
        if (this.isSuperAdmin()) return true;
        if (this.isConselheiro()) return this.getUserUnitId() === unitId;
        return false;
    },

    /**
     * Check if user can manage members (add, edit, delete)
     * @returns {boolean}
     */
    canManageMembers() {
        return this.isSuperAdmin();
    },

    /**
     * Filter units based on user role
     * @param {Array} units - All units
     * @returns {Array} Filtered units
     */
    filterUnits(units) {
        if (this.isSuperAdmin()) return units;

        if (this.isConselheiro()) {
            const userUnitId = this.getUserUnitId();
            return units.filter(u => u.id === userUnitId);
        }

        // Desbravador - will be filtered via members
        return units;
    },

    /**
     * Filter members based on user role
     * @param {Array} members - All members
     * @returns {Array} Filtered members
     */
    filterMembers(members) {
        if (this.isSuperAdmin()) return members;

        if (this.isConselheiro()) {
            const userUnitId = this.getUserUnitId();
            return members.filter(m => m.unitId === userUnitId);
        }

        if (this.isDesbravador()) {
            const userName = this.currentUser?.name;
            return members.filter(m => m.name === userName);
        }

        return members;
    },

    /**
     * Get user display info for UI
     * @returns {Object}
     */
    getUserDisplayInfo() {
        if (!this.currentUser) return null;

        const roleLabels = {
            [this.ROLES.SUPER_ADMIN]: 'Administrador',
            [this.ROLES.CONSELHEIRO]: 'Conselheiro',
            [this.ROLES.DESBRAVADOR]: 'Desbravador'
        };

        return {
            name: this.currentUser.name,
            role: this.currentUser.role,
            roleLabel: roleLabels[this.currentUser.role] || 'Usuário',
            unitId: this.currentUser.unidade_id
        };
    }
};
