import { DataAdapter } from '../data/repository.js';
import { CONFIG } from '../config/constants.js';

// ID of the test unit seeded in production — used for global exclusion
const TEST_UNIT_ID = 'u_TEST_999';

export const RBAC = {
    // Current user data with role and unit
    currentUser: null,

    // Role definitions (v64: case-insensitive — DB may store 'Conselheiro'/'Diretoria' with capitals)
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        CONSELHEIRO: 'conselheiro',
        DIRETORIA: 'diretoria',
        DESBRAVADOR: 'desbravador',
        AUXILIAR: 'auxiliar',
        AUDITOR: 'auditor'
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
                .select('id, name, role, unidade_id, needs_password_reset')
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
        // v64: normalize to lowercase to handle DB values like 'Conselheiro', 'Diretoria'
        return this.currentUser?.role?.toLowerCase() || null;
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
     * Check if user is Diretoria (v64: new role from DB patch)
     * @returns {boolean}
     */
    isDiretoria() {
        return this.getUserRole() === this.ROLES.DIRETORIA;
    },

    /**
     * Check if user is Desbravador
     * @returns {boolean}
     */
    isDesbravador() {
        return this.getUserRole() === this.ROLES.DESBRAVADOR;
    },

    /**
     * Check if user is Auxiliar de Pontuação
     * @returns {boolean}
     */
    isAuxiliar() {
        return this.getUserRole() === this.ROLES.AUXILIAR;
    },

    /**
     * Check if user is Auditor (Phase 4)
     * @returns {boolean}
     */
    isAuditor() {
        return this.getUserRole() === this.ROLES.AUDITOR;
    },

    /**
     * Check if user can view all units
     * @returns {boolean}
     */
    canViewAllUnits() {
        return this.isSuperAdmin() || this.isAuxiliar() || this.isAuditor();
    },

    /**
     * Check if user can view a specific unit
     * @param {string} unitId
     * @returns {boolean}
     */
    canViewUnit(unitId) {
        // If RBAC data is not loaded, allow access (consistent with filterUnits behavior)
        if (!this.currentUser) return true;

        if (this.isSuperAdmin() || this.isAuxiliar() || this.isAuditor()) return true;
        if (this.isConselheiro()) return this.getUserUnitId() === unitId;
        if (this.isDesbravador()) {
            // Desbravador can view their own unit (will be checked via member data)
            return true;
        }
        return false;
    },

    /**
     * Check if user can edit scores for a specific date
     * @param {string} dateKey
     * @returns {boolean}
     */
    canEditDate(dateKey) {
        if (!this.currentUser) return true;

        // Special rule for 10 Dias de Oração
        const prayerConfig = CONFIG.PRAYER_EVENT;
        if (dateKey >= prayerConfig.startDate && dateKey <= prayerConfig.endDate) {
            // Only Tobias can edit these dates
            return this.currentUser.name === 'Tobias';
        }

        return true;
    },

    /**
     * Check if user is within the 48h Grace Period for CRON retroactive edits
     * A partir de Quarta-Feira 00:00 (48h apos a reunião de domingo), Conselheiros perdem o acesso.
     * @param {string} dateKey - The YYYY-MM-DD local format of the meeting
     * @returns {boolean}
     */
    canEditRetroactive(dateKey) {
        if (!this.currentUser) return true;
        if (this.isSuperAdmin() || this.isAuxiliar() || this.isAuditor()) return true;

        if (this.isConselheiro()) {
            // Assume the meeting was Sunday. Grace period ends on Wednesday 00:00.
            const limitDate = new Date(dateKey + 'T00:00:00-03:00');
            limitDate.setDate(limitDate.getDate() + 3); // Sunday -> Wednesday
            
            const now = new Date();
            if (now >= limitDate) {
                return false;
            }
        }
        return true;
    },

    /**
     * Check if user can edit scores for a member
     * @param {Object} member
     * @returns {boolean}
     */
    canEditMemberScore(member) {
        if (!this.currentUser) return true;
        if (this.isSuperAdmin() || this.isAuxiliar() || this.isAuditor()) return true;
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
        // If RBAC data is not loaded, allow access
        if (!this.currentUser) return true;

        if (this.isSuperAdmin() || this.isAuxiliar() || this.isAuditor()) return true;
        if (this.isConselheiro()) return this.getUserUnitId() === unitId;
        return false;
    },

    /**
     * Check if user can evaluate a counselor (Phase 5 Transparency)
     * @param {string} counselorId - The targeted counselor's ID
     * @param {string} counselorUnitId - The targeted counselor's unit ID
     * @returns {boolean}
     */
    canEvaluateCounselor(counselorId, counselorUnitId) {
        if (!this.currentUser) return true;
        if (this.isSuperAdmin() || this.isAuditor()) return true;
        // Allows owner, or a co-leader sharing the same unit.
        if (this.isConselheiro()) {
            return this.currentUser.id === counselorId || this.getUserUnitId() === counselorUnitId;
        }
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
     * Filter units based on user role and test environment rules
     * @param {Array} units - All units
     * @returns {Array} Filtered units
     */
    filterUnits(units) {
        // Only Tobias (or Super Admin) should see the Test Unit
        const isTobias = this.currentUser?.name === 'Tobias';
        let visibleUnits = units;
        
        if (!isTobias) {
            visibleUnits = units.filter(u => !u.name.toUpperCase().includes('TESTE'));
        }

        if (this.isSuperAdmin() || this.isAuxiliar() || this.isAuditor()) return visibleUnits;

        if (this.isConselheiro()) {
            const userUnitId = this.getUserUnitId();
            return visibleUnits.filter(u => u.id === userUnitId);
        }

        return visibleUnits;
    },

    /**
     * Filter members based on user role
     * @param {Array} members - All members
     * @returns {Array} Filtered members
     */
    filterMembers(members) {
        // Global exclusion: hide test unit members from everyone except Tobias
        const isTobias = this.currentUser?.name === 'Tobias';
        if (!isTobias) {
            members = members.filter(m => m.unitId !== TEST_UNIT_ID);
        }

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
    /**
     * Check if user can view reports
     * @returns {boolean}
     */
    canViewReports() {
        if (!this.currentUser) return false;
        return this.isSuperAdmin();
    },

    /**
     * Check if user can view counselor ranking
     * @returns {boolean}
     */
    canViewRanking() {
        if (!this.currentUser) return false;
        return this.isSuperAdmin();
    },

    /**
     * Check if user can upload photos
     * @returns {boolean}
     */
    canUploadPhotos() {
        if (!this.currentUser) return false;
        return !this.isAuxiliar();
    },

    getUserDisplayInfo() {
        if (!this.currentUser) return null;

        const roleLabels = {
            [this.ROLES.SUPER_ADMIN]: 'Administrador',
            [this.ROLES.CONSELHEIRO]: 'Conselheiro',
            [this.ROLES.DESBRAVADOR]: 'Desbravador',
            [this.ROLES.AUXILIAR]: 'Avaliador de Honras'
        };

        return {
            name: this.currentUser.name,
            role: this.currentUser.role,
            roleLabel: roleLabels[this.currentUser.role] || 'Usuário',
            unitId: this.currentUser.unidade_id
        };
    }
};
