import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { SUPABASE_CONFIG } from '../config/env.js';
import { Navigation } from '../core/router.js';
import { Toast } from '../ui/toast.js';
import { Loading } from '../ui/loading.js';
import { Theme } from '../ui/theme.js';
import { AuthMethods } from './app-auth.js';
import { DashboardMethods } from './app-dashboard.js';
import { UnitMethods } from './app-units.js';
import { ScoringMethods } from './app-scoring.js';
import { ReportMethods } from './app-reports.js';
import { CounselorMethods } from './app-counselor.js';
import { PhotoMethods } from './app-photos.js';
import { VersionChecker } from './version-checker.js';
import { ErrorBoundary } from '../core/error-boundary.js';
import { DevStorage } from '../data/dev-storage.js';
import { SyncManager } from '../data/sync-manager.js';

export const App = {
    // --- State Properties ---
    mountPoint: null,
    currentView: 'login',
    isAuthenticated: false,
    activeFilters: { query: '' },
    currentDate: null,
    searchTimeout: null,

    // --- Merge Sub-Modules ---
    ...AuthMethods,
    ...DashboardMethods,
    ...UnitMethods,
    ...ScoringMethods,
    ...ReportMethods,
    ...CounselorMethods,
    ...PhotoMethods,

    // --- Core Methods ---
    async init() {
        console.log('🚀 Inicializando App...');

        // Initialize Error Boundary
        ErrorBoundary.init();

        // Load Config & Supabase
        await SUPABASE_CONFIG.initialize();

        // Initialize Store
        Loading.show('Inicializando dados...');
        await Store.init();

        // Use Utils to get initial date
        const { Utils } = await import('./ui-utils.js');
        this.currentDate = Utils.getTodayKey();

        Loading.hide();

        // Initialize SyncManager (Offline Support)
        SyncManager.init();

        // Initialize Settings
        this.mountPoint = document.getElementById('app-container');
        this.bindEvents();
        Theme.init();
        VersionChecker.init();

        // Check Auth Status
        const savedAuth = DevStorage.get('cd_auth');
        const savedUser = Store.getCurrentUser();

        if (savedAuth && savedUser) {
            console.log('🔓 Sessão restaurada');
            this.isAuthenticated = true;
            this.navigate('dashboard');
            this.resetSessionTimeout();
            this.setupActivityListeners();
        } else {
            console.log('🔒 Redirecionando para login');
            this.navigate('login');
        }
    },

    bindEvents() {
        window.onpopstate = (event) => {
            if (event.state) {
                this.navigate(event.state.view, event.state.params, false);
            } else {
                this.navigate('dashboard', {}, false);
            }
        };

        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    },

    handleOnline() {
        Toast.show('Conexão restaurada! Sincronizando...', 'success');
        // We could trigger a sync here if we had queue
    },

    handleOffline() {
        Toast.show('Você está offline. Alterações serão salvas localmente.', 'warning');
    },

    toggleNavigation(show) {
        // Find existing nav
        let nav = document.querySelector('nav.fixed.bottom-0');

        if (show) {
            if (!nav) {
                nav = document.createElement('nav');
                nav.className = 'fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 z-50 flex justify-around items-center safe-area-bottom pb-4';
                nav.innerHTML = `
                    <button onclick="App.navigate('dashboard')" class="flex flex-col items-center p-2 text-slate-400 hover:text-brand-gold transition-colors">
                        <i data-lucide="home" class="w-6 h-6 mb-1"></i>
                        <span class="text-[10px] uppercase font-bold">Início</span>
                    </button>
                    
                    ${RBAC.isSuperAdmin() ? `
                    <button onclick="App.navigate('photo-management')" class="flex flex-col items-center p-2 text-slate-400 hover:text-brand-gold transition-colors">
                        <i data-lucide="camera" class="w-6 h-6 mb-1"></i>
                        <span class="text-[10px] uppercase font-bold">Fotos</span>
                    </button>
                    ` : ''}

                    ${RBAC.canViewReports() ? `
                    <button onclick="App.navigate('reports')" id="btn-report" class="flex flex-col items-center p-4 -mt-8 bg-brand-gold text-slate-900 rounded-full shadow-xl shadow-brand-gold/20 border-4 border-slate-900 active:scale-90 transition-all">
                        <i data-lucide="bar-chart-2" class="w-7 h-7"></i>
                    </button>
                    ` : ''}
                    
                    ${RBAC.canViewRanking() ? `
                    <button onclick="App.renderCounselorRanking()" class="flex flex-col items-center p-2 text-slate-400 hover:text-brand-gold transition-colors">
                        <i data-lucide="trophy" class="w-6 h-6 mb-1"></i>
                        <span class="text-[10px] uppercase font-bold">Ranking</span>
                    </button>
                    ` : ''}
                    
                    <button onclick="App.logout()" class="flex flex-col items-center p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="log-out" class="w-6 h-6 mb-1"></i>
                        <span class="text-[10px] uppercase font-bold">Sair</span>
                    </button>
                `;
                document.body.appendChild(nav);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                nav.style.display = 'flex';
            }

            // Adjust body padding
            document.body.style.paddingBottom = '80px';
        } else {
            if (nav) nav.style.display = 'none';
            document.body.style.paddingBottom = '0';
        }
    },

    // --- Navigation System ---
    async navigate(view, params = {}, addToHistory = true) {
        if (!this.isAuthenticated && view !== 'login') {
            this.navigate('login');
            return;
        }

        console.log(`🧭 Navigating to: ${view}`, params);

        this.currentView = view;

        // Reset state
        this.activeFilters = { query: '' };

        if (addToHistory) {
            Navigation.push(view, params);
            // Update browser URL for history support (SPA feel)
            // But checking app.js it just pushed to history array?
            // Actually bindEvents listens to onpopstate.
            // If we want back button to work we should pushState
            window.history.pushState({ view, params }, '', `#${view}`);
        }

        //Render View
        try {
            switch (view) {
                case 'login':
                    this.renderLogin();
                    break;
                case 'password-change':
                    this.renderPasswordChange();
                    break;
                case 'dashboard':
                    await this.renderDashboard();
                    break;
                case 'unit':
                    if (params.unitId) await this.renderUnitDetails(params.unitId);
                    break;
                case 'scoring':
                    if (params.memberId) await this.renderScoring(params.memberId);
                    break;
                case 'counselor-evaluation':
                    if (params.counselorId) await this.renderCounselorEvaluation(params.counselorId);
                    break;
                case 'photo-management':
                    await this.renderPhotoManagement();
                    break;
                case 'reports':
                    await this.renderReport();
                    break;
                default:
                    console.warn(`View not found: ${view}`);
                    this.navigate('dashboard');
            }
        } catch (error) {
            console.error(`Error navigating to ${view}:`, error);
            if (window.Toast) {
                Toast.show(`Erro ao carregar ${view}`, 'error');
            }
            // Don't navigate to dashboard here to avoid loops
            // Just show error and let user try again
        }

        // Scroll to top
        window.scrollTo(0, 0);
    },

    goBack() {
        // Use our internal Navigation stack as the source of truth.
        // window.history.back() is unreliable because the initial page load
        // has no pushState state (null), causing onpopstate to redirect to
        // Dashboard regardless of the actual navigation depth.
        const prev = Navigation.pop(); // pops current, returns previous entry
        this.navigate(prev.view, prev.params, false); // navigate WITHOUT adding to history
    },

    changeSessionDate(newDate) {
        if (!newDate) return;
        this.currentDate = newDate;
        console.log(`📅 Date session changed to: ${this.currentDate}`);
        this.renderDashboard();
    }
};
