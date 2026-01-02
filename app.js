/**
 * Barão de Mauá - Sistema de Pontuação
 * Versão com Supabase + localStorage (fallback)
 */

// ============================================
// CONFIGURAÇÃO SUPABASE
// ============================================
// Configuração agora vem de variáveis de ambiente (config.js)
// Para desenvolvimento local: copie .env.example para .env
// Para Vercel: configure as variáveis no dashboard

let SUPABASE_CONFIG = {
    url: '',
    key: '',
    enabled: false
};

// Inicializar cliente Supabase
let supabaseClient = null;

// Função assíncrona para inicializar o Supabase após carregar ENV_CONFIG
async function initializeSupabase() {
    // Aguardar ENV_CONFIG carregar
    if (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.init) {
        await ENV_CONFIG.init();
    }

    // Atualizar configuração
    SUPABASE_CONFIG = {
        url: ENV_CONFIG.SUPABASE_URL,
        key: ENV_CONFIG.SUPABASE_ANON_KEY,
        enabled: ENV_CONFIG.SUPABASE_ENABLED
    };

    // Criar cliente se habilitado
    if (SUPABASE_CONFIG.enabled && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.key
        );
        console.log('✅ Supabase conectado!', SUPABASE_CONFIG.url);
    } else {
        console.log('⚠️ Usando localStorage (modo offline)');
    }
}

// Helper para URLs do Storage
function getStorageUrl(bucket, file) {
    if (SUPABASE_CONFIG.enabled && file) {
        return `${SUPABASE_CONFIG.url}/storage/v1/object/public/${bucket}/${file}`;
    }
    return file; // Caminho local
}

// ============================================
// UTILIDADES - Toast, Loading, Cache
// ============================================

// Sistema de Notificações Toast
const Toast = {
    show(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in`;
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        `;

        document.body.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Sistema de Loading
const Loading = {
    overlay: null,

    show(message = 'Carregando...') {
        if (this.overlay) return; // Já está mostrando

        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center';
        this.overlay.innerHTML = `
            <div class="bg-slate-900 rounded-xl p-8 shadow-2xl border border-slate-700 flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                <p class="text-white font-medium">${message}</p>
            </div>
        `;

        document.body.appendChild(this.overlay);
    },

    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
};

// Sistema de Cache
const Cache = {
    data: {},
    timestamps: {},
    TTL: 5 * 60 * 1000, // 5 minutos

    set(key, value) {
        this.data[key] = value;
        this.timestamps[key] = Date.now();
    },

    get(key) {
        const timestamp = this.timestamps[key];
        if (!timestamp) return null;

        const age = Date.now() - timestamp;
        if (age > this.TTL) {
            delete this.data[key];
            delete this.timestamps[key];
            return null;
        }

        return this.data[key];
    },

    clear() {
        this.data = {};
        this.timestamps = {};
    },

    invalidate(key) {
        delete this.data[key];
        delete this.timestamps[key];
    }
};

// Sistema de Tema (Dark Mode)
const Theme = {
    current: localStorage.getItem('theme') || 'light',

    init() {
        this.apply(this.current);
    },

    toggle() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        this.apply(this.current);
        localStorage.setItem('theme', this.current);
    },

    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.current = theme;
    },

    isDark() {
        return this.current === 'dark';
    }
};

// Sistema de Navegação
const Navigation = {
    history: [],

    push(view, params = {}) {
        this.history.push({ view, params });
    },

    pop() {
        if (this.history.length > 1) {
            this.history.pop();
            return this.history[this.history.length - 1];
        }
        return { view: 'dashboard', params: {} };
    },

    canGoBack() {
        return this.history.length > 1;
    },

    clear() {
        this.history = [];
    }
};

// Modal de Confirmação
const ConfirmDialog = {
    show(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl animate-scale-in">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-yellow-500"></i>
                    <h3 class="text-xl font-bold text-white">Atenção</h3>
                </div>
                
                <p class="text-slate-300 mb-6">${message}</p>
                
                <div class="flex gap-3">
                    <button id="confirm-no" class="flex-1 py-3 rounded-xl font-bold bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                        Não
                    </button>
                    <button id="confirm-yes" class="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors">
                        Sim, Descartar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        modal.querySelector('#confirm-yes').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };

        modal.querySelector('#confirm-no').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };

        // ESC para fechar
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
};

// ============================================
// RBAC - Role-Based Access Control
// ============================================
const RBAC = {
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
            const { data, error } = await supabaseClient
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

// --- Configuração ---
const CONFIG = {
    USERS: [
        { id: 'u1', name: 'Diane', pin: 'dia2026' },
        { id: 'u2', name: 'Silas', pin: 'sil2026' },
        { id: 'u3', name: 'Vânia', pin: 'vân2026' },
        { id: 'u4', name: 'Tobias', pin: 'tob2026' }
    ],
    SCORE_ITEMS: [
        { id: 'punctuality', name: 'Pontualidade', points: 20 },
        { id: 'presence', name: 'Presença', points: 10 },
        { id: 'uniform', name: 'Uniforme', points: 15 },
        { id: 'presentation', name: 'Apresentação/Asseio', points: 20 },
        { id: 'materials', name: 'Material', points: 20 },
        { id: 'discipline', name: 'Disciplina', points: 15 },
        { id: 'classwork', name: 'Tarefas de Classe', points: 30 },
        { id: 'teamspirit', name: 'Espírito de Equipe', points: 10 }
    ],
    COUNSELOR_ITEMS: [
        { id: 'uniform', name: 'Uniforme Completo', points: 20 },
        { id: 'punctuality', name: 'Pontualidade', points: 20 },
        { id: 'report', name: 'Relatório Entregue', points: 20 },
        { id: 'presence', name: 'Presença', points: 10 },
        { id: 'materials', name: 'Material Organizado', points: 15 },
        { id: 'planning', name: 'Planejamento', points: 15 }
    ],
    STORAGE_KEYS: {
        UNITS: 'cd_units',
        MEMBERS: 'cd_members',
        SCORES: 'cd_scores',
        COUNSELOR_SCORES: 'cd_counselor_scores',
        CURRENT_USER: 'cd_current_user'
    },
    TOTAL_POINTS: 140,
    TOTAL_COUNSELOR_POINTS: 100
};

// ============================================
// DATA ADAPTER - Supabase ou localStorage
// ============================================
const DataAdapter = {
    useSupabase() {
        return SUPABASE_CONFIG.enabled && supabaseClient !== null;
    },

    // UNITS
    async getUnits() {
        // Tentar cache primeiro
        const cached = Cache.get('units');
        if (cached) return cached;

        if (this.useSupabase()) {
            try {
                const { data, error } = await supabaseClient
                    .from('units')
                    .select('*')
                    .order('name');

                if (error) throw error;

                // Salvar no cache
                Cache.set('units', data || []);
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar unidades do Supabase:', error);
                Toast.show('Modo offline ativado', 'warning');
                SUPABASE_CONFIG.enabled = false; // Desabilitar temporariamente
                return this.getUnits(); // Tentar com localStorage
            }
        } else {
            const units = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.UNITS) || '[]');
            Cache.set('units', units);
            return units;
        }
    },

    async saveUnit(unit) {
        if (this.useSupabase()) {
            const { error } = await supabaseClient
                .from('units')
                .upsert(unit);
            if (error) console.error('Erro ao salvar unidade:', error);
        } else {
            const units = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.UNITS) || '[]');
            const index = units.findIndex(u => u.id === unit.id);
            if (index >= 0) {
                units[index] = unit;
            } else {
                units.push(unit);
            }
            localStorage.setItem(CONFIG.STORAGE_KEYS.UNITS, JSON.stringify(units));
        }
    },

    // MEMBERS
    async getMembers() {
        // Tentar cache primeiro
        const cached = Cache.get('members');
        if (cached) return cached;

        if (this.useSupabase()) {
            try {
                const { data, error } = await supabaseClient
                    .from('members')
                    .select('*')
                    .order('name');

                if (error) throw error;

                // Converter snake_case para camelCase
                const members = (data || []).map(member => ({
                    id: member.id,
                    name: member.name,
                    unitId: member.unit_id,
                    image: member.image,
                    isCounselor: member.is_counselor
                }));

                Cache.set('members', members);
                return members;
            } catch (error) {
                console.error('Erro ao buscar membros do Supabase:', error);
                Toast.show('Modo offline ativado', 'warning');
                SUPABASE_CONFIG.enabled = false;
                return this.getMembers();
            }
        } else {
            const members = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MEMBERS) || '[]');
            Cache.set('members', members);
            return members;
        }
    },

    async saveMember(member) {
        if (this.useSupabase()) {
            // Converter camelCase para snake_case
            const dbMember = {
                id: member.id,
                name: member.name,
                unit_id: member.unitId,  // ← Conversão aqui
                image: member.image,
                is_counselor: member.isCounselor || false  // ← Conversão aqui
            };
            const { error } = await supabaseClient
                .from('members')
                .upsert(dbMember);
            if (error) console.error('Erro ao salvar membro:', error);
        } else {
            const members = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MEMBERS) || '[]');
            const index = members.findIndex(m => m.id === member.id);
            if (index >= 0) {
                members[index] = member;
            } else {
                members.push(member);
            }
            localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        }
    },

    // SCORES
    async getScores() {
        if (this.useSupabase()) {
            const { data, error } = await supabaseClient
                .from('scores')
                .select('*');
            if (error) {
                console.error('Erro ao buscar pontuações:', error);
                return {};
            }

            // Converter array para objeto agrupado por data
            const scoresByDate = {};
            data.forEach(score => {
                if (!scoresByDate[score.date]) {
                    scoresByDate[score.date] = {};
                }
                scoresByDate[score.date][score.member_id] = {
                    isAbsent: score.is_absent,
                    items: score.items,
                    createdBy: score.created_by,
                    createdById: score.created_by_id,
                    createdAt: score.created_at
                };
            });
            return scoresByDate;
        } else {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SCORES) || '{}');
        }
    },

    async saveScore(memberId, dateKey, scoreData) {
        if (this.useSupabase()) {
            const { error } = await supabaseClient
                .from('scores')
                .upsert({
                    member_id: memberId,
                    date: dateKey,
                    is_absent: scoreData.isAbsent || false,
                    items: scoreData.items,
                    created_by: scoreData.createdBy,
                    created_by_id: scoreData.createdById,
                    created_at: scoreData.createdAt
                }, {
                    onConflict: 'member_id,date'
                });
            if (error) console.error('Erro ao salvar pontuação:', error);
        } else {
            const scores = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SCORES) || '{}');
            if (!scores[dateKey]) scores[dateKey] = {};
            scores[dateKey][memberId] = scoreData;
            localStorage.setItem(CONFIG.STORAGE_KEYS.SCORES, JSON.stringify(scores));
        }

        // Invalidar cache para forçar reload
        Cache.clear();
    },

    // COUNSELOR SCORES
    async getCounselorScores() {
        if (this.useSupabase()) {
            const { data, error } = await supabaseClient
                .from('counselor_scores')
                .select('*');
            if (error) {
                console.error('Erro ao buscar avaliações:', error);
                return {};
            }

            // Converter para formato agrupado por data
            const scoresByDate = {};
            data.forEach(score => {
                if (!scoresByDate[score.date]) {
                    scoresByDate[score.date] = {};
                }
                scoresByDate[score.date][score.counselor_id] = {
                    items: score.items,
                    createdBy: score.created_by,
                    createdById: score.created_by_id,
                    createdAt: score.created_at
                };
            });
            return scoresByDate;
        } else {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.COUNSELOR_SCORES) || '{}');
        }
    },

    async saveCounselorScore(counselorId, dateKey, scoreData) {
        if (this.useSupabase()) {
            const { error } = await supabaseClient
                .from('counselor_scores')
                .upsert({
                    counselor_id: counselorId,
                    date: dateKey,
                    items: scoreData.items,
                    created_by: scoreData.createdBy,
                    created_by_id: scoreData.createdById,
                    created_at: scoreData.createdAt
                }, {
                    onConflict: 'counselor_id,date'
                });
            if (error) console.error('Erro ao salvar avaliação:', error);
        } else {
            const scores = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.COUNSELOR_SCORES) || '{}');
            if (!scores[dateKey]) scores[dateKey] = {};
            scores[dateKey][counselorId] = scoreData;
            localStorage.setItem(CONFIG.STORAGE_KEYS.COUNSELOR_SCORES, JSON.stringify(scores));
        }
    }
};

// --- Armazenamento Local ---
const Store = {
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            return [];
        }
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    async init() {
        // Inicializar com dados padrão se vazio
        const units = await this.getUnits();
        if (units.length === 0) {
            this.seedDefaultData();
        }
    },

    seedDefaultData() {
        // Criar unidades
        const units = [
            { id: 'u1', name: 'Barões', logo: 'logo_baroes.png' },
            { id: 'u2', name: 'Baronesa', logo: 'logo_baronesa.png' },
            { id: 'u3', name: 'Duquesas', logo: 'logo_duquesas.png' },
            { id: 'u4', name: 'Imperadores', logo: 'logo_imperadores.jpg' },
            { id: 'u5', name: 'Imperatrizes', logo: 'logo_imperatrizes.png' },
            { id: 'u6', name: 'Lokomotiva', logo: 'logo_lokomotiva.png' }
        ];
        this.set(CONFIG.STORAGE_KEYS.UNITS, units);

        // Criar membros
        const members = [
            // Barões
            { id: 'm1', name: 'JOSUÉ ARAUJO DE OLIVEIRA', unitId: 'u1', image: null },
            { id: 'm2', name: 'ARTHUR BUENO AMANCIO DA SILVA', unitId: 'u1', image: null },
            { id: 'm3', name: 'CARLOS EDUARDO CARVALHO SILVA FILHO', unitId: 'u1', image: null },
            { id: 'm4', name: 'GABRIEL BUENO PINHEIRO', unitId: 'u1', image: null },
            { id: 'm5', name: 'ITALO RAMOS GALÚCIO', unitId: 'u1', image: null },
            { id: 'm6', name: 'LUCAS DE ARAUJO TAVARES', unitId: 'u1', image: null, isCounselor: true },
            { id: 'm7', name: 'MARLON FERREIRA DA SILVA AMORIM', unitId: 'u1', image: null, isCounselor: true },
            { id: 'm8', name: 'PEDRO HENRIQUE APOLINÁRIO FEITOSA', unitId: 'u1', image: null },

            // Baronesa
            { id: 'm9', name: 'ANA LUIZA FERREIRA ARRAIS', unitId: 'u2', image: null },
            { id: 'm10', name: 'DANIELA BEZERRA MARQUES', unitId: 'u2', image: null, isCounselor: true },
            { id: 'm11', name: 'DEBORAH BARRINOVO MARTINS', unitId: 'u2', image: null, isCounselor: true },
            { id: 'm12', name: 'EMILLY LIMA DE FRANCA', unitId: 'u2', image: null, isCounselor: true },
            { id: 'm13', name: 'GIOVANNA RAPOSO SANTOS VIDAL', unitId: 'u2', image: null },
            { id: 'm14', name: 'ISABELLA FERREIRA CAMPOS', unitId: 'u2', image: null },
            { id: 'm15', name: 'JULIA DE SOUZA FEITOSA', unitId: 'u2', image: null },
            { id: 'm16', name: 'RAFAELLA BORGES DA SILVA', unitId: 'u2', image: null },
            { id: 'm17', name: 'REVINE JHULE SANTOS DE OLIVEIRA', unitId: 'u2', image: null },
            { id: 'm18', name: 'VITORIA MEL SANTANA DANTAS', unitId: 'u2', image: null },

            // Duquesas
            { id: 'm19', name: 'DIANA MENEZES DA SILVA', unitId: 'u3', image: null },
            { id: 'm20', name: 'HELOYSA APARECIDA FERNANDES', unitId: 'u3', image: null },
            { id: 'm21', name: 'LAODICÉIA GONÇALVES DIAS DE SOUZA', unitId: 'u3', image: null, isCounselor: true },
            { id: 'm22', name: 'LETÍCIA NUNES DE LIMA', unitId: 'u3', image: null },
            { id: 'm23', name: 'LUISA GABRIELLA DE SOUSA SILVA', unitId: 'u3', image: null, isCounselor: true },
            { id: 'm24', name: 'MANUELA MARQUES DE OLIVEIRA', unitId: 'u3', image: null },
            { id: 'm25', name: 'MARCELA DE OLIVEIRA MOTA', unitId: 'u3', image: null },
            { id: 'm26', name: 'MARIA HELENA FERNANDES GONÇALVES', unitId: 'u3', image: null },
            { id: 'm27', name: 'REBECCA BUENO AMANCIO DA SILVA', unitId: 'u3', image: null },
            { id: 'm28', name: 'SOPHIA VICTORIA GUTIERREZ LIMA', unitId: 'u3', image: null },
            { id: 'm29', name: 'TALINE RAMOS GALÚCIO', unitId: 'u3', image: null },

            // Imperadores
            { id: 'm30', name: 'ARTHUR DE JESUS PINTO DUARTE', unitId: 'u4', image: null },
            { id: 'm31', name: 'DAVID DANIEL BEZERRA BARROSO', unitId: 'u4', image: null },
            { id: 'm32', name: 'DAVID DANTAS DA SILVA', unitId: 'u4', image: null },
            { id: 'm33', name: 'EDUARDO MARQUES DE OLIVEIRA', unitId: 'u4', image: null, isCounselor: true },
            { id: 'm34', name: 'ERIK BUENO PINHEIRO', unitId: 'u4', image: null },
            { id: 'm35', name: 'MATHEUS BARRINOVO MARTINS', unitId: 'u4', image: null },
            { id: 'm36', name: 'NICOLLAS GABRIEL BARBOSA DE ALMEIDA', unitId: 'u4', image: null },
            { id: 'm37', name: 'RICARDO DANIEL JORGE DA SILVA', unitId: 'u4', image: null },
            { id: 'm38', name: 'TOBIAS FEITOSA DE MATOS', unitId: 'u4', image: 'tobias_matos.jpg', isCounselor: true },

            // Imperatrizes
            { id: 'm39', name: 'ANA CLARA DE JESUS PINTO DUARTE', unitId: 'u5', image: null },
            { id: 'm40', name: 'BIANCA VIEIRA AMORIM', unitId: 'u5', image: null, isCounselor: true },
            { id: 'm41', name: 'ISABELA MENDES BISCAIA', unitId: 'u5', image: null },
            { id: 'm42', name: 'JÚLIA CAROLINA PIRES LIMA', unitId: 'u5', image: null },
            { id: 'm43', name: 'KINÉ ROMERO SOW', unitId: 'u5', image: null },
            { id: 'm44', name: 'LARISSA FERREIRA CAMPOS', unitId: 'u5', image: null, isCounselor: true },
            { id: 'm45', name: 'PIETRA GABRIELA VIEIRA DOS SANTOS', unitId: 'u5', image: 'pietra_santos.jpg' },
            { id: 'm46', name: 'YASMIM BORGES SILVA', unitId: 'u5', image: null },

            // Lokomotiva
            { id: 'm47', name: 'ANDRESSA VIEIRA AMORIM', unitId: 'u6', image: null },
            { id: 'm48', name: 'DIANE GONÇALVES DA SILVA FEITOSA', unitId: 'u6', image: null },
            { id: 'm49', name: 'GUSTAVO MORAIS DOS SANTOS', unitId: 'u6', image: null },
            { id: 'm50', name: 'HELLEN CRISTINA BARBOSA DE ALMEIDA', unitId: 'u6', image: null },
            { id: 'm51', name: 'JANE VIRGÍNIA RAMOS SANTOS DE OLIVEIRA', unitId: 'u6', image: null },
            { id: 'm52', name: 'RAMIA BRAGA DE OLIVEIRA', unitId: 'u6', image: null },
            { id: 'm53', name: 'ROBSON DE ALMEIDA SILVA', unitId: 'u6', image: null },
            { id: 'm54', name: 'SILAS MELCHIOR DA SILVA MELO', unitId: 'u6', image: null },
            { id: 'm55', name: 'TANIA CRISTINA FERREIRA CAMPOS', unitId: 'u6', image: null },
            { id: 'm56', name: 'VÂNIA VIEIRA SILVA AMORIM', unitId: 'u6', image: null },
            { id: 'm57', name: 'VICTOR LUIS BRITIS BEZERRIL', unitId: 'u6', image: null }
        ];
        this.set(CONFIG.STORAGE_KEYS.MEMBERS, members);
        this.set(CONFIG.STORAGE_KEYS.SCORES, {});
    },

    async getUnits() {
        return await DataAdapter.getUnits();
    },

    async getMembers() {
        return await DataAdapter.getMembers();
    },

    async getMembersByUnit(unitId) {
        const members = await this.getMembers();
        return members.filter(m => m.unitId === unitId);
    },

    async getScores() {
        return await DataAdapter.getScores();
    },

    async getMemberScore(memberId, dateKey) {
        const scores = await this.getScores();
        if (!scores[dateKey]) return this.getDefaultScore();
        return scores[dateKey][memberId] || this.getDefaultScore();
    },

    getDefaultScore() {
        return {
            isAbsent: false,
            items: CONFIG.SCORE_ITEMS.reduce((acc, item) => {
                acc[item.id] = false;
                return acc;
            }, {})
        };
    },

    async saveScore(memberId, dateKey, scoreData) {
        // Adicionar informações de auditoria
        const currentUser = this.getCurrentUser();
        const timestamp = new Date().toISOString();

        const fullScoreData = {
            ...scoreData,
            createdBy: currentUser ? currentUser.name : 'Desconhecido',
            createdById: currentUser ? currentUser.id : null,
            createdAt: timestamp
        };

        await DataAdapter.saveScore(memberId, dateKey, fullScoreData);
    },

    getCurrentUser() {
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        return userData ? JSON.parse(userData) : null;
    },

    setCurrentUser(user) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    },

    clearCurrentUser() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    },

    // --- Counselor Scores ---
    async getCounselorScores() {
        return await DataAdapter.getCounselorScores();
    },

    async getCounselorScore(counselorId, dateKey) {
        const scores = await this.getCounselorScores();
        if (!scores[dateKey]) return this.getDefaultCounselorScore();
        return scores[dateKey][counselorId] || this.getDefaultCounselorScore();
    },

    getDefaultCounselorScore() {
        return {
            items: CONFIG.COUNSELOR_ITEMS.reduce((acc, item) => {
                acc[item.id] = false;
                return acc;
            }, {})
        };
    },

    async saveCounselorScore(counselorId, dateKey, scoreData) {
        const currentUser = this.getCurrentUser();
        const timestamp = new Date().toISOString();

        const fullScoreData = {
            ...scoreData,
            createdBy: currentUser ? currentUser.name : 'Desconhecido',
            createdById: currentUser ? currentUser.id : null,
            createdAt: timestamp
        };

        await DataAdapter.saveCounselorScore(counselorId, dateKey, fullScoreData);
    },

    async addUnit(name) {
        const units = await this.getUnits();
        const newUnit = {
            id: 'u' + Date.now(),
            name,
            logo: null
        };
        units.push(newUnit);
        await DataAdapter.saveUnit(newUnit);
        return newUnit;
    },

    async addMember(name, unitId) {
        const members = await this.getMembers();
        const newMember = {
            id: 'm' + Date.now(),
            name,
            unitId,
            image: null
        };
        members.push(newMember);
        await DataAdapter.saveMember(newMember);
        return newMember;
    },

    async deleteMember(memberId) {
        // Para Supabase, precisaríamos de um método delete no DataAdapter
        // Por enquanto, mantém localStorage
        let members = await this.getMembers();
        members = members.filter(m => m.id !== memberId);
        this.set(CONFIG.STORAGE_KEYS.MEMBERS, members);

        // Limpar pontuações
        const scores = this.getScores();
        Object.keys(scores).forEach(date => {
            if (scores[date][memberId]) {
                delete scores[date][memberId];
            }
        });
        this.set(CONFIG.STORAGE_KEYS.SCORES, scores);
    },

    getMemberHistory(memberId) {
        const allScores = this.getScores();
        const history = [];

        Object.keys(allScores).forEach(date => {
            if (allScores[date] && allScores[date][memberId]) {
                history.push({
                    date,
                    ...allScores[date][memberId]
                });
            }
        });

        return history.sort((a, b) => b.date.localeCompare(a.date));
    }
};

// --- Utilitários ---
const Utils = {
    countTotal(scoreRecord) {
        if (!scoreRecord || scoreRecord.isAbsent) return 0;

        return CONFIG.SCORE_ITEMS.reduce((sum, item) => {
            return sum + (scoreRecord.items[item.id] ? item.points : 0);
        }, 0);
    },

    getPercentage(total) {
        return Math.round((total / CONFIG.TOTAL_POINTS) * 100);
    },

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    },

    formatDate(dateStr) {
        try {
            return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
        } catch (e) {
            return dateStr;
        }
    },

    generateWhatsAppLink(text) {
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    },

    getUnitForMember(member, units) {
        return units.find(u => u.id === member.unitId);
    },

    // --- Counselor Ranking Functions ---
    countCounselorTotal(scoreRecord) {
        if (!scoreRecord) return 0;

        return CONFIG.COUNSELOR_ITEMS.reduce((sum, item) => {
            return sum + (scoreRecord.items[item.id] ? item.points : 0);
        }, 0);
    },

    async calculateUnitEfficiency(unitId, dateKey) {
        const members = await Store.getMembersByUnit(unitId);
        if (members.length === 0) return 0;

        const totalPossible = members.length * CONFIG.TOTAL_POINTS;

        let totalObtained = 0;
        for (const member of members) {
            const score = await Store.getMemberScore(member.id, dateKey);
            totalObtained += this.countTotal(score);
        }

        return (totalObtained / totalPossible) * 100;
    },

    async calculateCounselorPersonalScore(counselorId, dateKey) {
        const evaluation = await Store.getCounselorScore(counselorId, dateKey);
        const totalObtained = this.countCounselorTotal(evaluation);

        return (totalObtained / CONFIG.TOTAL_COUNSELOR_POINTS) * 100;
    },

    async calculateCounselorFinalScore(counselorId, dateKey) {
        const members = await Store.getMembers();
        const member = members.find(m => m.id === counselorId);
        if (!member) return 0;

        const unitEfficiency = await this.calculateUnitEfficiency(member.unitId, dateKey);
        const personalScore = await this.calculateCounselorPersonalScore(counselorId, dateKey);

        // Fórmula: (Eficiência × 0.7) + (Pessoal × 0.3)
        return (unitEfficiency * 0.7) + (personalScore * 0.3);
    }
};

// --- Aplicação ---
const App = {
    mountPoint: document.getElementById('app-container'),
    currentView: 'dashboard',
    isAuthenticated: false,
    sessionTimeout: null,
    SESSION_DURATION: 10 * 60 * 1000, // 10 minutos em milissegundos

    async init() {
        if (!this.mountPoint) {
            console.error('App container not found');
            return;
        }

        // Inicializar Supabase primeiro
        await initializeSupabase();

        // Depois inicializar Store
        await Store.init();

        // Verificar autenticação
        const auth = localStorage.getItem('cd_auth');
        if (auth === 'true') {
            this.isAuthenticated = true;
            // Load RBAC data from localStorage
            RBAC.loadUserData();
            this.startSessionTimeout();
            this.setupActivityListeners();
            this.navigate('dashboard');
        } else {
            this.navigate('login');
        }
    },

    startSessionTimeout() {
        // Limpar timeout anterior se existir
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }

        // Criar novo timeout
        this.sessionTimeout = setTimeout(() => {
            this.sessionExpired();
        }, this.SESSION_DURATION);
    },

    resetSessionTimeout() {
        // Resetar o contador sempre que houver atividade
        if (this.isAuthenticated) {
            this.startSessionTimeout();
        }
    },

    setupActivityListeners() {
        // Detectar atividade do usuário
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetSessionTimeout();
            }, { passive: true });
        });
    },

    sessionExpired() {
        alert('Sua sessão expirou por inatividade. Por favor, faça login novamente.');
        this.logout();
    },

    navigate(view, params = {}) {
        this.currentView = view;

        // Adicionar ao histórico de navegação
        Navigation.push(view, params);

        if (!this.mountPoint) return;

        this.mountPoint.innerHTML = '';

        switch (view) {
            case 'login':
                this.renderLogin();
                break;
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'unit':
                if (params.unitId) {
                    this.renderUnitDetails(params.unitId);
                }
                break;
            case 'scoring':
                if (params.memberId) {
                    this.renderScoring(params.memberId);
                }
                break;
            case 'counselor-evaluation':
                if (params.counselorId) {
                    this.renderCounselorEvaluation(params.counselorId);
                }
                break;
            case 'counselor-ranking':
                this.renderCounselorRanking();
                break;
            case 'report':
                this.renderReport();
                break;
            default:
                this.renderDashboard();
        }

        setTimeout(() => lucide.createIcons(), 100);
    },

    goBack() {
        // Verificar se há mudanças não salvas
        const hasChanges = this.currentView === 'scoring'
            ? this.hasUnsavedScoringChanges()
            : this.currentView === 'counselor-evaluation'
                ? this.hasUnsavedCounselorChanges()
                : false;

        if (hasChanges) {
            ConfirmDialog.show(
                'Existem dados não salvos. Deseja realmente sair e perder as alterações?',
                () => {
                    // Sim - Descartar e voltar
                    const previous = Navigation.pop();
                    this.navigate(previous.view, previous.params);
                },
                () => {
                    // Não - Permanecer na tela
                    // Não faz nada
                }
            );
        } else {
            // Sem mudanças - Voltar direto
            const previous = Navigation.pop();
            this.navigate(previous.view, previous.params);
        }
    },

    captureScoringState() {
        const absentToggle = document.getElementById('toggle-absent');
        const scoreToggles = document.querySelectorAll('.score-toggle');

        return {
            isAbsent: absentToggle?.checked || false,
            items: Array.from(scoreToggles).map(t => ({
                id: t.dataset.id,
                checked: t.checked
            }))
        };
    },

    hasUnsavedScoringChanges() {
        if (!this.initialScoringState) return false;

        const currentState = this.captureScoringState();

        if (currentState.isAbsent !== this.initialScoringState.isAbsent) return true;

        return currentState.items.some((item, idx) =>
            item.checked !== this.initialScoringState.items[idx]?.checked
        );
    },

    captureCounselorState() {
        const scoreToggles = document.querySelectorAll('.counselor-toggle');

        return {
            items: Array.from(scoreToggles).map(t => ({
                id: t.dataset.id,
                checked: t.checked
            }))
        };
    },

    hasUnsavedCounselorChanges() {
        if (!this.initialCounselorState) return false;

        const currentState = this.captureCounselorState();

        return currentState.items.some((item, idx) =>
            item.checked !== this.initialCounselorState.items[idx]?.checked
        );
    },

    renderLogin() {
        const html = `
            <div class="flex flex-col items-center justify-center h-full p-6 slide-in">
                <div class="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-800">
                    <div class="bg-brand-navy/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
                        <i data-lucide="lock" class="w-10 h-10"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2 text-center">Área Restrita</h2>
                    <p class="text-slate-400 mb-8 text-sm text-center">Faça login para continuar</p>
                    
                    <div class="space-y-4">
                        <!-- Campo Usuário -->
                        <div>
                            <label class="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Usuário</label>
                            <select id="login-user" 
                                   class="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl 
                                          focus:outline-none focus:border-brand-gold 
                                          text-white font-bold transition-all appearance-none cursor-pointer">
                                <option value="">Selecione seu usuário</option>
                                ${CONFIG.USERS.map(u => `
                                    <option value="${u.id}">${u.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <!-- Campo Senha -->
                        <div>
                            <label class="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Senha</label>
                            <input type="password" id="login-password" 
                                   placeholder="Digite sua senha" 
                                   class="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl 
                                          focus:outline-none focus:border-brand-gold 
                                          text-white font-bold transition-all">
                        </div>
                        
                        <!-- Botão Login -->
                        <button onclick="App.login()" 
                                class="w-full bg-brand-navy text-white font-bold py-4 rounded-xl 
                                       shadow-lg hover:bg-blue-900 transition-transform 
                                       active:scale-95 flex items-center justify-center gap-2 mt-6">
                            ENTRAR NO SISTEMA
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </button>
                        
                        <!-- Link Esqueci Senha -->
                        <button onclick="App.showPasswordRecovery()" 
                                class="w-full text-sm text-slate-500 hover:text-brand-gold transition-colors py-2">
                            Esqueci minha senha
                        </button>
                    </div>
                </div>
                <p class="mt-8 text-slate-500 text-xs">Clube de Desbravadores &copy; 2026</p>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        this.toggleNavigation(false);

        const passwordInput = document.getElementById('login-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        }
    },

    showPasswordRecovery() {
        const userSelect = document.getElementById('login-user');
        const selectedUserId = userSelect ? userSelect.value : '';

        if (!selectedUserId) {
            alert('Por favor, selecione seu usuário primeiro!');
            return;
        }

        const user = CONFIG.USERS.find(u => u.id === selectedUserId);
        if (!user) return;

        // Mostrar senha em um modal
        const modal = `
            <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onclick="this.remove()">
                <div class="bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-800" onclick="event.stopPropagation()">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-full bg-brand-gold/20 flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="key" class="w-8 h-8 text-brand-gold"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Recuperação de Senha</h3>
                        <p class="text-sm text-slate-400">Usuário: <span class="text-white font-bold">${user.name}</span></p>
                    </div>
                    
                    <div class="bg-slate-950 p-4 rounded-xl border border-slate-700 mb-6">
                        <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Sua senha é:</p>
                        <p class="text-2xl font-bold text-brand-gold text-center tracking-wider">${user.pin}</p>
                    </div>
                    
                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-full bg-brand-navy text-white font-bold py-3 rounded-xl 
                                   hover:bg-blue-900 transition-colors">
                        Entendi, fechar
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
        setTimeout(() => lucide.createIcons(), 100);
    },

    async login() {
        const userSelect = document.getElementById('login-user');
        const passwordInput = document.getElementById('login-password');

        if (!userSelect || !passwordInput) return;

        const selectedUserId = userSelect.value;
        const password = passwordInput.value.trim().toLowerCase();

        // Validações
        if (!selectedUserId) {
            alert('Por favor, selecione seu usuário!');
            userSelect.focus();
            return;
        }

        if (!password) {
            alert('Por favor, digite sua senha!');
            passwordInput.focus();
            return;
        }

        // Buscar usuário selecionado
        const user = CONFIG.USERS.find(u => u.id === selectedUserId);

        if (!user) {
            alert('Usuário não encontrado!');
            return;
        }

        // Validar senha
        if (user.pin.toLowerCase() !== password) {
            alert('Senha incorreta! Tente novamente ou clique em "Esqueci minha senha".');
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }

        // Login bem-sucedido
        Store.setCurrentUser(user);
        localStorage.setItem('cd_auth', 'true');
        this.isAuthenticated = true;

        // Fetch RBAC data from Supabase
        Loading.show('Carregando permissões...');
        try {
            await RBAC.fetchUserData(user.name);
            const userInfo = RBAC.getUserDisplayInfo();
            if (userInfo) {
                console.log(`✅ Login: ${userInfo.name} (${userInfo.roleLabel})`);
            }
        } catch (error) {
            console.error('Error loading RBAC data:', error);
            Toast.show('Aviso: Permissões não carregadas', 'warning');
        } finally {
            Loading.hide();
        }

        // Iniciar timeout de sessão e listeners de atividade
        this.startSessionTimeout();
        this.setupActivityListeners();

        // Navegar para dashboard
        this.navigate('dashboard');
    },

    logout() {
        // Limpar timeout de sessão
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }

        Store.clearCurrentUser();
        RBAC.clearUserData(); // Clear RBAC data
        localStorage.removeItem('cd_auth');
        this.isAuthenticated = false;
        this.navigate('login');
    },

    // Filtrar unidades/membros em tempo real
    async filterUnits(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.renderDashboard();
            return;
        }

        const units = await Store.getUnits();
        const members = await Store.getMembers();

        const matchingMembers = members.filter(m =>
            m.name.toLowerCase().includes(searchTerm)
        );

        const matchingUnitIds = [...new Set(matchingMembers.map(m => m.unitId))];
        const filteredUnits = units.filter(u =>
            u.name.toLowerCase().includes(searchTerm) || matchingUnitIds.includes(u.id)
        );

        const container = document.getElementById('units-container');
        if (container) {
            container.innerHTML = filteredUnits.length === 0
                ? `<div class="text-center py-12">
                    <i data-lucide="search-x" class="w-16 h-16 mx-auto text-slate-600 mb-4"></i>
                    <p class="text-slate-400">Nenhum resultado para "${query}"</p>
                   </div>`
                : filteredUnits.map(unit => `
                    <div onclick="App.navigate('unit', { unitId: '${unit.id}' })" 
                         class="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group hover:border-brand-navy/50">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-brand-gold overflow-hidden border border-slate-800">
                                ${unit.logo ? `<img src="${unit.logo}" class="w-full h-full object-cover" alt="${unit.name}">` : `<i data-lucide="flag" class="w-6 h-6"></i>`}
                            </div>
                            <span class="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">${unit.name}</span>
                        </div>
                        <i data-lucide="chevron-right" class="w-6 h-6 text-slate-600 group-hover:text-brand-gold"></i>
                    </div>
                  `).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    // Atalhos de teclado
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const search = document.getElementById('search-members');
                if (search) search.focus();
            }
            if (e.key === 'Escape') {
                const search = document.getElementById('search-members');
                if (search && search.value) {
                    search.value = '';
                    this.filterUnits('');
                }
            }
        });
    },

    async renderDashboard() {
        Loading.show('Carregando unidades...');

        try {
            const allUnits = await Store.getUnits();
            // Apply RBAC filtering
            const units = RBAC.filterUnits(allUnits);
            const currentUser = Store.getCurrentUser();
            const userInfo = RBAC.getUserDisplayInfo();

            // Check for birthdays
            const birthdays = await this.checkBirthdays();

            const html = `
            <div class="slide-in space-y-4">
                ${currentUser ? `
                    <div class="bg-gradient-to-r from-brand-navy/20 to-transparent p-4 rounded-xl border border-brand-navy/30 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                                <i data-lucide="user" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="text-xs text-slate-500 uppercase tracking-wider">Logado como</p>
                                <p class="text-sm font-bold text-white">${currentUser.name}</p>
                                ${userInfo ? `<p class="text-xs text-brand-gold">${userInfo.roleLabel}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${RBAC.isSuperAdmin() ? `
                                <button onclick="App.runUnitClassification()" 
                                        class="px-3 py-2 rounded-lg bg-brand-gold/20 hover:bg-brand-gold/30 
                                               text-brand-gold transition-colors flex items-center gap-2"
                                        title="Executar classificação automática de unidades">
                                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                    <span class="text-xs font-bold">Classificar</span>
                                </button>
                            ` : ''}
                            <button onclick="Theme.toggle(); App.renderDashboard();" 
                                    class="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                    title="Alternar tema">
                                <i data-lucide="${Theme.isDark() ? 'sun' : 'moon'}" class="w-5 h-5 text-brand-gold"></i>
                            </button>
                            <button onclick="App.logout()" class="p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <i data-lucide="log-out" class="w-4 h-4 text-slate-500"></i>
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                ${birthdays && birthdays.length > 0 ? this.renderBirthdayBanner(birthdays) : ''}
                
                <!-- Search Field -->
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i data-lucide="search" class="w-5 h-5 text-slate-400"></i>
                    </div>
                    <input type="text" 
                           id="search-members"
                           placeholder="Buscar desbravador... (Ctrl+K)"
                           class="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl 
                                  text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 
                                  focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                           onkeyup="App.filterUnits(this.value)">
                    <button onclick="document.getElementById('search-members').value=''; App.filterUnits('');" 
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <!-- Units List (FIRST) -->
                <div id="units-container" class="space-y-3">
                    ${units.map(unit => `
                        <div onclick="App.navigate('unit', { unitId: '${unit.id}' })" 
                             class="bg-slate-900 rounded-xl shadow-sm border border-slate-800 
                                    p-5 flex items-center justify-between cursor-pointer 
                                    active:scale-[0.98] transition-all group 
                                    hover:border-brand-navy/50">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-slate-950 
                                            flex items-center justify-center text-brand-gold 
                                            overflow-hidden border border-slate-800">
                                    ${unit.logo
                    ? `<img src="${unit.logo}" class="w-full h-full object-cover" alt="${unit.name}">`
                    : `<i data-lucide="flag" class="w-6 h-6"></i>`
                }
                                </div>
                                <span class="font-bold text-lg text-slate-200 
                                             group-hover:text-white transition-colors">
                                    ${unit.name}
                                </span>
                            </div>
                            <i data-lucide="chevron-right" 
                               class="w-6 h-6 text-slate-600 group-hover:text-brand-gold"></i>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Add Unit Button -->
                <div class="pt-4">
                    <button onclick="App.addUnitPrompt()" 
                            class="w-full py-4 border-2 border-dashed border-slate-700 
                                   rounded-xl flex items-center justify-center gap-2 
                                   text-slate-500 font-bold hover:bg-slate-900 
                                   hover:border-slate-600 transition-colors">
                        <i data-lucide="plus-circle" class="w-6 h-6"></i>
                        Adicionar Unidade
                    </button>
                </div>
                
                <!-- Action Buttons (LAST - Ranking & Reports) -->
                <div class="pt-6 border-t border-slate-800 mt-6 pb-20">
                    <button onclick="document.getElementById('extra-features').classList.toggle('hidden')" 
                            class="w-full py-3 text-slate-400 hover:text-slate-200 text-sm font-medium 
                                   flex items-center justify-center gap-2 transition-colors rounded-lg hover:bg-slate-900">
                        <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                        <span>Mais Opções</span>
                    </button>
                    
                    <div id="extra-features" class="hidden space-y-3 mt-3">
                        <button onclick="App.navigate('counselor-ranking')" 
                                class="w-full bg-gradient-to-r from-brand-gold/20 to-brand-gold/10 text-brand-gold border border-brand-gold/30 py-4 rounded-xl 
                                       font-bold shadow-lg 
                                       flex items-center justify-center gap-3 
                                       active:scale-[0.98] transition-transform hover:from-brand-gold/30 hover:to-brand-gold/20">
                            <i data-lucide="trophy" class="w-6 h-6"></i>
                            RANKING DE CONSELHEIROS
                        </button>
                        
                        <button onclick="App.navigate('report')" 
                                class="w-full bg-brand-navy text-white py-4 rounded-xl 
                                       font-bold shadow-lg shadow-brand-navy/20 
                                       flex items-center justify-center gap-3 
                                       active:scale-[0.98] transition-transform">
                            <i data-lucide="bar-chart-2" class="w-6 h-6"></i>
                            RELATÓRIOS
                        </button>
                    </div>
                </div>
                
            </div>
        `;

            this.mountPoint.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(false);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            Toast.show('Erro ao carregar unidades', 'error');
        } finally {
            Loading.hide();
        }
    },

    async renderUnitDetails(unitId) {
        const units = await Store.getUnits();
        const unit = units.find(u => u.id === unitId);
        if (!unit) {
            this.navigate('dashboard');
            return;
        }

        // Check RBAC permissions
        if (!RBAC.canViewUnit(unitId)) {
            Toast.show('Você não tem permissão para visualizar esta unidade', 'error');
            this.navigate('dashboard');
            return;
        }

        const allMembers = await Store.getMembersByUnit(unitId);
        // Apply RBAC filtering to members
        const members = RBAC.filterMembers(allMembers);


        const html = `
            <div class="slide-in space-y-6 pb-20">
                <div class="text-center border-b-2 border-dashed border-slate-700 pb-4 mt-2">
                    <h2 class="text-xl font-black text-white uppercase tracking-widest">${unit.name}</h2>
                    ${unit.logo ? `<img src="${unit.logo}" class="w-24 mx-auto mt-3 drop-shadow-md" alt="Logo">` : ''}
                </div>
                
                <div class="space-y-3">
                    ${members.map(member => `
                        <div onclick="App.navigate('scoring', { memberId: '${member.id}' })" 
                             class="bg-slate-900 rounded-xl shadow-sm border border-slate-800 
                                    p-4 flex items-center justify-between cursor-pointer 
                                    active:scale-[0.98] transition-all hover:bg-slate-800/50">
                            <div class="flex items-center gap-3">
                                ${member.image
                ? `<img src="${member.image}" 
                                           class="w-10 h-10 rounded-full object-cover border border-slate-700" 
                                           alt="${member.name}">`
                : `<div class="w-10 h-10 rounded-full bg-slate-800 
                                                flex items-center justify-center text-slate-500">
                                            <i data-lucide="user" class="w-6 h-6"></i>
                                       </div>`
            }
                                <div class="flex flex-col">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-lg text-slate-200">${member.name}</span>
                                        ${member.isCounselor ? `
                                            <span class="text-xs px-2 py-0.5 bg-brand-gold/20 text-brand-gold rounded-full font-bold uppercase tracking-wider border border-brand-gold/30">
                                                cons
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            <i data-lucide="chevron-right" class="w-5 h-5 text-slate-600"></i>
                        </div>
                    `).join('')}
                </div>
                
                <button onclick="App.addMemberPrompt('${unitId}')" 
                        class="w-full py-4 border-2 border-dashed border-slate-700 
                               rounded-xl flex items-center justify-center gap-2 
                               text-slate-500 font-bold hover:bg-slate-900 transition-colors">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                    Adicionar Desbravador
                </button>
                
                <div class="fixed bottom-6 left-4 right-4">
                    <button onclick="App.navigate('dashboard')" 
                            class="w-full py-4 rounded-xl font-bold text-slate-300 
                                   bg-slate-800 hover:bg-slate-700 shadow-lg 
                                   flex items-center justify-center gap-2">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        Voltar
                    </button>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(false);
    },

    async renderScoring(memberId) {
        const members = await Store.getMembers();
        const member = members.find(m => m.id === memberId);
        if (!member) {
            this.navigate('dashboard');
            return;
        }

        // Check RBAC permissions
        if (!RBAC.canEditMemberScore(member)) {
            Toast.show('Você não tem permissão para editar pontuações deste membro', 'error');
            this.navigate('dashboard');
            return;
        }

        const units = await Store.getUnits();
        const unit = Utils.getUnitForMember(member, units);
        if (!unit) {
            this.navigate('dashboard');
            return;
        }

        const existingScore = await Store.getMemberScore(memberId, Utils.getTodayKey());
        const currentTotal = Utils.countTotal(existingScore);

        const html = `
            <div class="slide-in pb-24">
                <!-- Header com Botão Voltar -->
                <div class="flex items-center justify-between mb-4">
                    <button onclick="App.goBack()" 
                            class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        <span class="font-bold">Voltar</span>
                    </button>
                    <span class="text-brand-gold font-bold text-sm">${unit.name}</span>
                </div>
                
                <div class="text-center border-b-2 border-dashed border-slate-700 pb-4 mb-6">
                    <div class="flex flex-col items-center justify-center gap-2 mb-2">
                        ${member.image
                ? `<img src="${member.image}" 
                                   class="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-lg" 
                                   alt="${member.name}">`
                : ''
            }
                        <h2 class="text-2xl font-black text-white uppercase tracking-wide leading-none">
                            ${member.name}
                        </h2>
                    </div>
                    <p class="text-sm font-bold text-slate-400 uppercase">Unidade: ${unit.name}</p>
                </div>
                
                <div class="bg-red-900/10 rounded-xl p-4 mb-6 border border-red-900/30 
                            flex items-center justify-between shadow-sm">
                    <span class="font-bold text-red-400 flex items-center gap-2 text-sm">
                        <i data-lucide="user-x" class="w-5 h-5"></i>
                        Ausente
                    </span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="toggle-absent" 
                               class="sr-only peer" ${existingScore.isAbsent ? 'checked' : ''}>
                        <div class="toggle-switch"></div>
                    </label>
                </div>
                
                <div class="text-center mb-4">
                    <span class="text-lg font-bold text-slate-400">
                        Pontuação total: 
                        <span id="score-text-val" class="text-brand-gold">${currentTotal}</span>/160
                    </span>
                </div>
                
                <div id="scoring-list" class="space-y-2 ${existingScore.isAbsent ? 'opacity-50 pointer-events-none' : ''}">
                    ${CONFIG.SCORE_ITEMS.map(item => `
                        <div class="bg-slate-900 rounded-lg p-3 border border-slate-800 
                                    shadow-sm flex items-center justify-between">
                            <span class="font-bold text-slate-200 text-sm">
                                ${item.name}
                            </span>
                            <div class="flex items-center gap-3">
                                <span class="font-bold text-brand-gold text-sm">
                                    ${item.points} pts
                                </span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer score-toggle" 
                                           data-id="${item.id}" 
                                           ${existingScore.items[item.id] ? 'checked' : ''}>
                                    <div class="toggle-switch"></div>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="fixed bottom-6 left-4 right-4 flex gap-3 justify-end">
                    <button onclick="App.saveCurrentScore('${memberId}')" 
                            class="w-14 h-14 rounded-full font-bold text-white 
                                   bg-brand-navy shadow-xl shadow-brand-navy/30 
                                   flex items-center justify-center 
                                   active:scale-95 transition-transform hover:bg-blue-900"
                            title="Salvar Pontuação">
                        <i data-lucide="save" class="w-6 h-6"></i>
                    </button>
                    
                    <button onclick="App.removeMemberPrompt('${memberId}')" 
                            class="w-14 h-14 rounded-full font-bold text-red-400 
                                   bg-red-900/20 border-2 border-red-900/30 
                                   flex items-center justify-center 
                                   active:scale-95 transition-transform 
                                   hover:bg-red-900/30"
                            title="Remover Desbravador">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
            
            <style>
                .toggle-switch {
                    width: 44px;
                    height: 24px;
                    background-color: #374151;
                    border-radius: 9999px;
                    position: relative;
                    transition: all 0.3s;
                }
                
                .toggle-switch::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 20px;
                    height: 20px;
                    background-color: white;
                    border-radius: 50%;
                    transition: all 0.3s;
                }
                
                .peer:checked ~ .toggle-switch {
                    background-color: #10B981;
                }
                
                .peer:checked ~ .toggle-switch::after {
                    transform: translateX(20px);
                }
            </style>
        `;

        this.mountPoint.innerHTML = html;
        this.toggleNavigation(false);
        this.bindScoringEvents(memberId);

        // Capturar estado inicial para detectar mudanças
        this.initialScoringState = null;
        setTimeout(() => {
            this.initialScoringState = this.captureScoringState();
        }, 100);
    },

    bindScoringEvents(memberId) {
        const absentToggle = document.getElementById('toggle-absent');
        const scoreToggles = document.querySelectorAll('.score-toggle');
        const scoringList = document.getElementById('scoring-list');

        if (absentToggle) {
            absentToggle.addEventListener('change', (e) => {
                const isAbsent = e.target.checked;

                if (isAbsent) {
                    scoringList.classList.add('opacity-50', 'pointer-events-none');
                    scoreToggles.forEach(toggle => toggle.checked = false);
                } else {
                    scoringList.classList.remove('opacity-50', 'pointer-events-none');
                }

                this.recalcScore();
            });
        }

        scoreToggles.forEach(toggle => {
            toggle.addEventListener('change', () => this.recalcScore());
        });
    },

    recalcScore() {
        const toggles = document.querySelectorAll('.score-toggle:checked');
        const absentToggle = document.getElementById('toggle-absent');

        if (absentToggle && absentToggle.checked) {
            const valEl = document.getElementById('score-text-val');
            if (valEl) valEl.textContent = '0';
            return;
        }

        let total = 0;
        toggles.forEach(toggle => {
            const item = CONFIG.SCORE_ITEMS.find(i => i.id === toggle.dataset.id);
            if (item) total += item.points;
        });

        const valEl = document.getElementById('score-text-val');
        if (valEl) valEl.textContent = total;
    },

    async saveCurrentScore(memberId) {
        const members = await Store.getMembers();
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        const absentToggle = document.getElementById('toggle-absent');
        const scoreToggles = document.querySelectorAll('.score-toggle');

        const isAbsent = absentToggle ? absentToggle.checked : false;
        const items = {};

        if (!isAbsent) {
            scoreToggles.forEach(toggle => {
                items[toggle.dataset.id] = toggle.checked;
            });
        }

        const scoreData = { isAbsent, items };
        await Store.saveScore(memberId, Utils.getTodayKey(), scoreData);

        Toast.show('Pontuação salva com sucesso!', 'success');
        this.navigate('unit', { unitId: member.unitId });
    },

    requestReAuth(callback) {
        const currentUser = Store.getCurrentUser();

        if (!currentUser) {
            alert('Sessão inválida. Por favor, faça login novamente.');
            this.logout();
            return;
        }

        // Criar modal de re-autenticação
        const modal = `
            <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in" id="reauth-modal">
                <div class="bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-800" onclick="event.stopPropagation()">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-full bg-brand-gold/20 flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="shield-check" class="w-8 h-8 text-brand-gold"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Confirme sua Identidade</h3>
                        <p class="text-sm text-slate-400 mb-1">Usuário: <span class="text-white font-bold">${currentUser.name}</span></p>
                        <p class="text-xs text-slate-500">Digite sua senha para confirmar o lançamento</p>
                    </div>
                    
                    <div class="mb-6">
                        <input type="password" id="reauth-password" 
                               placeholder="Digite sua senha" 
                               class="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl 
                                      focus:outline-none focus:border-brand-gold 
                                      text-white font-bold transition-all text-center">
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="App.cancelReAuth()" 
                                class="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl 
                                       hover:bg-slate-700 transition-colors">
                            Cancelar
                        </button>
                        <button onclick="App.confirmReAuth()" 
                                class="flex-1 bg-brand-navy text-white font-bold py-3 rounded-xl 
                                       hover:bg-blue-900 transition-colors">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
        setTimeout(() => lucide.createIcons(), 100);

        // Focar no input de senha
        const passwordInput = document.getElementById('reauth-password');
        if (passwordInput) {
            passwordInput.focus();
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.confirmReAuth();
            });
        }

        // Armazenar callback
        this.reAuthCallback = callback;
    },

    confirmReAuth() {
        const currentUser = Store.getCurrentUser();
        const passwordInput = document.getElementById('reauth-password');

        if (!passwordInput || !currentUser) {
            this.cancelReAuth();
            return;
        }

        const password = passwordInput.value.trim().toLowerCase();

        if (!password) {
            alert('Por favor, digite sua senha!');
            passwordInput.focus();
            return;
        }

        // Validar senha
        if (currentUser.pin.toLowerCase() !== password) {
            alert('Senha incorreta! Tente novamente.');
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }

        // Senha correta - fechar modal e executar callback
        const modal = document.getElementById('reauth-modal');
        if (modal) modal.remove();

        if (this.reAuthCallback) {
            this.reAuthCallback(true);
            this.reAuthCallback = null;
        }
    },

    cancelReAuth() {
        const modal = document.getElementById('reauth-modal');
        if (modal) modal.remove();

        if (this.reAuthCallback) {
            this.reAuthCallback(false);
            this.reAuthCallback = null;
        }
    },

    removeMemberPrompt(memberId) {
        if (!confirm('Tem certeza que deseja remover este desbravador? Esta ação não pode ser desfeita.')) {
            return;
        }

        const member = Store.getMembers().find(m => m.id === memberId);
        if (!member) return;

        Store.deleteMember(memberId);
        this.navigate('unit', { unitId: member.unitId });
    },

    // Criar gráfico de comparação de unidades
    createUnitComparisonChart(unitStats) {
        const canvas = document.getElementById('unitComparisonChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: unitStats.map(u => u.name),
                datasets: [{
                    label: 'Média de Pontos',
                    data: unitStats.map(u => u.average),
                    backgroundColor: Theme.isDark() ? '#fbbf24' : '#d4af37',
                    borderColor: Theme.isDark() ? '#f59e0b' : '#b8941f',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Comparação entre Unidades',
                        color: Theme.isDark() ? '#f1f5f9' : '#1f2937',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 140,
                        ticks: { color: Theme.isDark() ? '#cbd5e1' : '#6b7280' },
                        grid: { color: Theme.isDark() ? '#334155' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: Theme.isDark() ? '#cbd5e1' : '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    // Exportar para Excel
    async exportToExcel() {
        if (typeof XLSX === 'undefined') {
            Toast.show('Biblioteca de exportação não carregada', 'error');
            return;
        }

        const todayKey = Utils.getTodayKey();
        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();
        const scores = allScores[todayKey] || {};

        const data = members.map(member => {
            const score = scores[member.id];
            const unit = units.find(u => u.id === member.unitId);
            const points = score?.isAbsent ? 0 : Utils.countTotal(score);

            return {
                'Desbravador': member.name,
                'Unidade': unit?.name || 'N/A',
                'Pontos': points,
                'Percentual': Utils.getPercentage(points) + '%',
                'Status': !score ? 'Não avaliado' : score.isAbsent ? 'Ausente' : 'Presente'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

        const filename = `relatorio_${todayKey}.xlsx`;
        XLSX.writeFile(wb, filename);

        Toast.show('Relatório exportado com sucesso!', 'success');
    },

    async renderReport() {
        const todayKey = Utils.getTodayKey();
        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();
        const scores = allScores[todayKey] || {};

        const memberStats = members.map(member => {
            const score = scores[member.id];
            const isAbsent = score?.isAbsent || false;
            const points = isAbsent ? 0 : Utils.countTotal(score);
            const percent = Utils.getPercentage(points);
            const evaluated = !!score;

            return {
                ...member,
                points,
                percent,
                isAbsent,
                evaluated,
                unit: units.find(u => u.id === member.unitId)
            };
        });

        const unitStats = units.map(unit => {
            const unitMembers = memberStats.filter(m => m.unitId === unit.id);
            const totalPoints = unitMembers.reduce((sum, m) => sum + m.points, 0);
            const average = unitMembers.length > 0 ? Math.round(totalPoints / unitMembers.length) : 0;

            return {
                ...unit,
                average,
                memberCount: unitMembers.length,
                members: unitMembers
            };
        }).sort((a, b) => b.average - a.average);

        const bestUnit = unitStats[0];

        const generateWhatsAppText = () => {
            let text = `*RELATÓRIO DA REUNIÃO - ${Utils.formatDate(todayKey)}*\n\n`;
            text += `🏆 *Unidade Destaque:* ${bestUnit ? bestUnit.name : 'N/A'}\n`;
            text += `📊 *Média Geral:* ${Math.round(unitStats.reduce((sum, u) => sum + u.average, 0) / (unitStats.length || 1))} pts\n\n`;

            unitStats.forEach(unit => {
                text += `*${unit.name}* (Média: ${unit.average} pts)\n`;
                unit.members.forEach(member => {
                    const status = !member.evaluated
                        ? 'Não avaliado'
                        : member.isAbsent
                            ? 'Ausente'
                            : `${member.points} pts (${member.percent}%)`;
                    text += `- ${member.name}: ${status}\n`;
                });
                text += '\n';
            });

            return text;
        };

        const html = `
            <div class="slide-in pb-24 space-y-8">
                <div class="text-center border-b-2 border-slate-800 pb-4 mt-4">
                    <h2 class="text-2xl font-black text-white uppercase tracking-widest">
                        RELATÓRIO DA REUNIÃO
                    </h2>
                    <p class="text-sm font-bold text-slate-400 mt-1">
                        Data: ${Utils.formatDate(todayKey)}
                    </p>
                </div>
                
                <div class="bg-brand-navy/10 p-4 rounded-xl border border-brand-navy/20 text-center">
                    <span class="text-xs font-bold text-brand-gold uppercase">
                        Unidade Destaque do Dia
                    </span>
                    <div class="text-xl font-black text-white mt-1">
                        ${bestUnit ? bestUnit.name : '-'}
                    </div>
                    <div class="text-sm text-slate-400 mt-1">
                        Média: ${bestUnit ? bestUnit.average : '0'} pontos
                    </div>
                </div>
                
                <div class="space-y-8">
                    ${unitStats.map(unit => `
                        <div class="space-y-4">
                            <h3 class="text-lg font-bold text-white border-b border-slate-700 pb-2">
                                ${unit.name} 
                                <span class="text-sm font-normal text-slate-400">
                                    (Média: ${unit.average} pts)
                                </span>
                            </h3>
                            
                            ${unit.members.map(member => `
                                <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-sm">
                                    <div class="flex justify-between items-start mb-3">
                                        <div>
                                            <div class="font-bold text-white">${member.name}</div>
                                            <div class="text-sm text-slate-400">
                                                ${member.evaluated
                ? (member.isAbsent
                    ? '<span class="text-red-400">Ausente</span>'
                    : `${member.points} pontos (${member.percent}%)`)
                : '<span class="text-yellow-400">Não avaliado</span>'
            }
                                            </div>
                                        </div>
                                        ${member.image
                ? `<img src="${member.image}" 
                                                   class="w-12 h-12 rounded-full object-cover border border-slate-700" 
                                                   alt="${member.name}">`
                : ''
            }
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                
                <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur 
                            border-t border-slate-800 flex flex-col gap-2 z-50">
                    <button onclick="window.print()" 
                            class="w-full py-3 rounded-xl font-bold text-white 
                                   bg-brand-navy hover:bg-brand-navy/90 
                                   flex items-center justify-center gap-2 shadow-lg">
                        <i data-lucide="file-text" class="w-5 h-5"></i> 
                        Exportar PDF
                    </button>
                    
                    <a href="${Utils.generateWhatsAppLink(generateWhatsAppText())}" 
                       target="_blank" 
                       class="w-full py-3 rounded-xl font-bold text-green-400 
                              bg-green-900/20 border border-green-900/30 hover:bg-green-900/30 
                              flex items-center justify-center gap-2 no-underline">
                        <i data-lucide="message-circle" class="w-5 h-5"></i> 
                        Compartilhar WhatsApp
                    </a>
                    
                    <button onclick="App.navigate('dashboard')" 
                            class="w-full py-3 rounded-xl font-bold text-slate-400 
                                   bg-slate-800 hover:bg-slate-700 
                                   flex items-center justify-center gap-2">
                        Voltar
                    </button>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(false);
    },

    // --- Birthday Alert System ---
    async checkBirthdays() {
        if (!DataAdapter.useSupabase()) {
            return [];
        }

        try {
            const { data, error } = await supabaseClient
                .rpc('get_birthday_alerts');

            if (error) {
                console.error('Error fetching birthdays:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in checkBirthdays:', error);
            return [];
        }
    },

    renderBirthdayBanner(birthdays) {
        return `
            <div class="bg-gradient-to-r from-pink-500/20 to-purple-500/20 
                        border border-pink-500/30 rounded-xl p-4 animate-fade-in">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <i data-lucide="cake" class="w-6 h-6 text-pink-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-lg">🎉 Aniversariantes de Hoje!</h3>
                        <p class="text-xs text-pink-300">Parabéns aos nossos desbravadores!</p>
                    </div>
                </div>
                <div class="space-y-2">
                    ${birthdays.map(b => `
                        <div class="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center">
                                    <i data-lucide="user" class="w-4 h-4 text-brand-gold"></i>
                                </div>
                                <div>
                                    <p class="text-white font-bold text-sm">${b.member_name}</p>
                                    <p class="text-xs text-slate-400">${b.unit_name || 'Sem unidade'}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-brand-gold font-bold text-lg">${b.new_age}</p>
                                <p class="text-xs text-slate-500">anos</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // --- Unit Classification ---
    async runUnitClassification() {
        if (!RBAC.isSuperAdmin()) {
            Toast.show('Apenas administradores podem executar esta ação', 'error');
            return;
        }

        const confirmed = confirm(
            'Deseja executar a classificação automática de unidades?\n\n' +
            'Esta ação irá mover membros entre unidades baseado em:\n' +
            '- Idade (calculada em 30/06)\n' +
            '- Sexo\n\n' +
            'ATENÇÃO: Conselheiros NÃO serão movidos para Lokomotiva.\n\n' +
            'Continuar?'
        );

        if (!confirmed) return;

        Loading.show('Executando classificação...');

        try {
            if (!DataAdapter.useSupabase()) {
                Toast.show('Esta funcionalidade requer conexão com Supabase', 'error');
                return;
            }

            // Call the stored procedure
            const { data, error } = await supabaseClient
                .rpc('update_member_units');

            if (error) {
                console.error('Error running classification:', error);
                Toast.show('Erro ao executar classificação: ' + error.message, 'error');
                return;
            }

            Toast.show('Classificação executada com sucesso!', 'success');

            // Refresh dashboard to show updated units
            setTimeout(() => {
                this.renderDashboard();
            }, 1500);

        } catch (error) {
            console.error('Error in runUnitClassification:', error);
            Toast.show('Erro ao executar classificação', 'error');
        } finally {
            Loading.hide();
        }
    },

    toggleNavigation(show) {
        const nav = document.querySelector('nav.absolute.bottom-0');
        const reportBtn = document.getElementById('btn-report');

        if (nav) nav.style.display = show ? 'block' : 'none';
        if (reportBtn) reportBtn.style.display = show ? 'block' : 'none';
    },

    addUnitPrompt() {
        const name = prompt('Nome da Nova Unidade:');
        if (name && name.trim()) {
            Store.addUnit(name.trim());
            this.navigate('dashboard');
        }
    },

    addMemberPrompt(unitId) {
        const name = prompt('Nome do Desbravador:');
        if (name && name.trim()) {
            Store.addMember(name.trim(), unitId);
            this.navigate('unit', { unitId });
        }
    },

    // --- Counselor Evaluation ---
    async renderCounselorEvaluation(counselorId) {
        const members = await Store.getMembers();
        const member = members.find(m => m.id === counselorId);
        if (!member || !member.isCounselor) {
            alert('Conselheiro não encontrado!');
            this.navigate('dashboard');
            return;
        }

        const units = await Store.getUnits();
        const unit = units.find(u => u.id === member.unitId);
        const todayKey = Utils.getTodayKey();
        const evaluation = await Store.getCounselorScore(counselorId, todayKey);
        const currentTotal = Utils.countCounselorTotal(evaluation);

        const html = `
            <div class="slide-in pb-24">
                <!-- Header com Botão Voltar -->
                <div class="flex items-center justify-between mb-4">
                    <button onclick="App.goBack()" 
                            class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        <span class="font-bold">Voltar</span>
                    </button>
                    <span class="text-brand-gold font-bold text-sm">${unit ? unit.name : ''}</span>
                </div>
                
                <div class="text-center border-b-2 border-dashed border-slate-700 pb-4 mb-6">
                    <div class="flex flex-col items-center justify-center gap-2 mb-2">
                        ${member.image
                ? `<img src="${member.image}" 
                                   class="w-24 h-24 rounded-full object-cover border-4 border-brand-gold/30 shadow-lg" 
                                   alt="${member.name}">`
                : `<div class="w-24 h-24 rounded-full bg-brand-gold/20 flex items-center justify-center border-4 border-brand-gold/30">
                                   <i data-lucide="user-check" class="w-12 h-12 text-brand-gold"></i>
                               </div>`
            }
                        <h2 class="text-2xl font-black text-white uppercase tracking-wide leading-none">
                            ${member.name}
                        </h2>
                        <span class="text-xs px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full font-bold uppercase tracking-wider border border-brand-gold/30">
                            Conselheiro
                        </span>
                    </div>
                    <p class="text-sm font-bold text-slate-400 uppercase">Unidade: ${unit.name}</p>
                </div>
                
                <div class="text-center mb-4">
                    <span class="text-lg font-bold text-slate-400">
                        Avaliação Pessoal: 
                        <span id="counselor-score-val" class="text-brand-gold">${currentTotal}</span>/100
                    </span>
                </div>
                
                <div id="counselor-scoring-list" class="space-y-2">
                    ${CONFIG.COUNSELOR_ITEMS.map(item => `
                        <div class="bg-slate-900 rounded-lg p-3 border border-slate-800 
                                    shadow-sm flex items-center justify-between">
                            <span class="font-bold text-slate-200 text-sm">
                                ${item.name}
                            </span>
                            <div class="flex items-center gap-3">
                                <span class="font-bold text-brand-gold text-sm">
                                    ${item.points} pts
                                </span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer counselor-toggle" 
                                           data-id="${item.id}" 
                                           ${existingScore.items[item.id] ? 'checked' : ''}>
                                    <div class="toggle-switch"></div>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="fixed bottom-6 left-4 right-4 flex flex-col gap-3">
                    <button onclick="App.saveCounselorScore('${counselorId}')" 
                            class="w-full py-4 rounded-xl font-bold text-white 
                                   bg-brand-navy shadow-xl shadow-brand-navy/30 
                                   flex items-center justify-center gap-2 
                                   active:scale-95 transition-transform uppercase 
                                   tracking-widest text-sm">
                        <i data-lucide="save" class="w-5 h-5"></i>
                        Salvar Avaliação
                    </button>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(true);

        // Event listeners
        document.querySelectorAll('.counselor-toggle').forEach(toggle => {
            toggle.addEventListener('change', () => this.recalcCounselorScore());
        });

        // Capturar estado inicial para detectar mudanças
        this.initialCounselorState = null;
        setTimeout(() => {
            this.initialCounselorState = this.captureCounselorState();
        }, 100);
    },

    recalcCounselorScore() {
        const toggles = document.querySelectorAll('.counselor-toggle:checked');

        let total = 0;
        toggles.forEach(toggle => {
            const item = CONFIG.COUNSELOR_ITEMS.find(i => i.id === toggle.dataset.id);
            if (item) total += item.points;
        });

        const valEl = document.getElementById('counselor-score-val');
        if (valEl) valEl.textContent = total;
    },

    async saveCounselorScore(counselorId) {
        const members = await Store.getMembers();
        const member = members.find(m => m.id === counselorId);
        if (!member) return;

        const scoreToggles = document.querySelectorAll('.counselor-toggle');
        const items = {};

        scoreToggles.forEach(toggle => {
            items[toggle.dataset.id] = toggle.checked;
        });

        const scoreData = { items };
        await Store.saveCounselorScore(counselorId, Utils.getTodayKey(), scoreData);

        Toast.show('Avaliação salva com sucesso!', 'success');
        this.navigate('dashboard');
    },

    // --- Counselor Ranking ---
    async renderCounselorRanking() {
        Loading.show('Calculando ranking...');

        try {
            const dateKey = Utils.getTodayKey();
            const members = await Store.getMembers();
            const counselors = members.filter(m => m.isCounselor);
            const units = await Store.getUnits();

            // Calcular scores para todos os conselheiros
            const rankingsPromises = counselors.map(async (counselor) => {
                const unit = units.find(u => u.id === counselor.unitId);
                const unitEfficiency = await Utils.calculateUnitEfficiency(counselor.unitId, dateKey);
                const personalScore = await Utils.calculateCounselorPersonalScore(counselor.id, dateKey);
                const finalScore = await Utils.calculateCounselorFinalScore(counselor.id, dateKey);

                return {
                    counselor,
                    unit,
                    unitEfficiency,
                    personalScore,
                    finalScore
                };
            });

            const rankings = (await Promise.all(rankingsPromises)).sort((a, b) => b.finalScore - a.finalScore);

            const medals = ['🥇', '🥈', '🥉'];

            const html = `
            <div class="slide-in pb-20">
                <div class="text-center mb-6">
                    <div class="bg-brand-gold/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-brand-gold/30">
                        <i data-lucide="trophy" class="w-10 h-10 text-brand-gold"></i>
                    </div>
                    <h2 class="text-2xl font-black text-white uppercase tracking-widest">Ranking de Conselheiros</h2>
                    <p class="text-sm text-slate-400 mt-2">📅 ${Utils.formatDate(dateKey)}</p>
                    <p class="text-xs text-slate-500 mt-1">Fórmula: (Eficiência × 70%) + (Pessoal × 30%)</p>
                </div>

                <div class="space-y-3">
                    ${rankings.map((rank, index) => `
                        <div class="bg-slate-900 rounded-xl border ${index < 3 ? 'border-brand-gold/30' : 'border-slate-800'} 
                                    p-4 shadow-sm">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">${index < 3 ? medals[index] : `${index + 1}º`}</span>
                                    <div>
                                        <h3 class="font-bold text-white text-sm">${rank.counselor.name}</h3>
                                        <p class="text-xs text-slate-500">${rank.unit.name}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-black ${index < 3 ? 'text-brand-gold' : 'text-white'}">
                                        ${rank.finalScore.toFixed(1)}
                                    </p>
                                    <p class="text-xs text-slate-500">pontos</p>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                                <div class="bg-slate-950 rounded-lg p-2">
                                    <p class="text-xs text-slate-500 mb-1">Eficiência (70%)</p>
                                    <p class="text-sm font-bold text-blue-400">${rank.unitEfficiency.toFixed(1)}%</p>
                                </div>
                                <div class="bg-slate-950 rounded-lg p-2">
                                    <p class="text-xs text-slate-500 mb-1">Pessoal (30%)</p>
                                    <p class="text-sm font-bold text-green-400">${rank.personalScore.toFixed(1)}%</p>
                                </div>
                            </div>

                            <button onclick="App.navigate('counselor-evaluation', { counselorId: '${rank.counselor.id}' })"
                                    class="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors">
                                Ver/Editar Avaliação
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${rankings.length === 0 ? `
                    <div class="text-center py-12">
                        <i data-lucide="users-round" class="w-16 h-16 text-slate-600 mx-auto mb-4"></i>
                        <p class="text-slate-500">Nenhuma avaliação registrada hoje</p>
                        <p class="text-xs text-slate-600 mt-2">Avalie os conselheiros para ver o ranking</p>
                    </div>
                ` : ''}
            </div>
        `;

            this.mountPoint.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(true);
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            Toast.show('Erro ao carregar ranking', 'error');
            this.navigate('dashboard');
        } finally {
            Loading.hide();
        }
    }
};

// --- Inicialização ---
window.App = App;

document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});
