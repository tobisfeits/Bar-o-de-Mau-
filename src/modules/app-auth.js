import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { Loading } from '../ui/loading.js';
import { Toast } from '../ui/toast.js';
import { CONFIG } from '../config/constants.js';
import { DevStorage } from '../data/dev-storage.js';
import { BiometricAuth } from '../core/biometric-auth.js';
import { ConfirmDialog } from '../ui/dialogs.js';
import { Sanitizer } from '../utils/sanitizer.js';

export const AuthMethods = {
    sessionTimeout: null,
    activityTimeout: null,
    _loginUsers: [], // Cache for dropdown

    async renderLogin() {
        // Clear session data if any
        Store.clearSession();
        this.isAuthenticated = false;

        // Fetch users from Supabase or Cache
        Loading.show('Carregando usuários...');
        let users = [];
        try {
            users = await Store.getUsers();
        } catch (error) {
            console.error('Login error:', error);
            Toast.show('Erro ao carregar usuários', 'error');
        } finally {
            Loading.hide();
        }

        this._loginUsers = users;

        const html = `
            <div class="min-h-screen flex items-center justify-center p-4 bg-[url('/fotos/barao-logo.png')] bg-cover bg-center bg-no-repeat relative">
                <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
                
                <div class="relative w-full max-w-md bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl p-8 backdrop-blur animate-fade-in">
                    <div class="flex flex-col items-center mb-8">
                        <img src="logo_barao_maua.png" alt="Logo" class="w-32 h-32 mb-4 drop-shadow-2xl animate-float">
                        <h1 class="text-3xl font-black text-center text-white uppercase tracking-wider">
                            Barão de Mauá
                        </h1>
                        <p class="text-brand-gold font-bold text-sm tracking-widest uppercase mt-2">
                            Sistema de Pontuação
                        </p>
                    </div>

                    <div class="space-y-4">
                        <!-- Custom Dropdown -->
                        <div class="space-y-2">
                            <label class="block text-sm font-bold text-slate-400 uppercase">Selecione seu Usuário</label>
                            <div class="relative" id="user-dropdown-container">
                                <button type="button" id="user-dropdown-trigger"
                                        onclick="App.toggleUserDropdown()"
                                        class="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-left
                                               focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all
                                               flex items-center gap-3">
                                    <span id="selected-user-avatar"
                                          class="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center
                                                 text-xs font-black text-slate-500 shrink-0">
                                        ?
                                    </span>
                                    <span id="selected-user-name" class="text-slate-500 font-medium truncate">
                                        Selecione...
                                    </span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-slate-500 absolute right-3 top-4 transition-transform" id="dropdown-chevron"></i>
                                </button>
                                <input type="hidden" id="login-user" value="">

                                <!-- Dropdown Panel -->
                                <div id="user-dropdown-panel" 
                                     class="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl
                                            shadow-2xl shadow-black/50 overflow-hidden z-50 hidden
                                            animate-fade-in">
                                    <!-- Search -->
                                    <div class="p-2 border-b border-slate-800">
                                        <div class="relative">
                                            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-2.5"></i>
                                            <input type="text" id="user-search-input"
                                                   placeholder="Buscar..."
                                                   oninput="App.filterUserDropdown(this.value)"
                                                   class="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                                                          text-white text-sm placeholder-slate-600 focus:border-brand-gold outline-none">
                                        </div>
                                    </div>
                                    <!-- Options List -->
                                    <div id="user-dropdown-list" class="max-h-48 overflow-y-auto py-1">
                                        ${users.map(u => {
            const safeName = Sanitizer.html(u.name);
            const attrName = Sanitizer.attribute(u.name);
            const initials = u.name.split(' ').map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
            return `
                                            <button type="button" 
                                                    onclick="App.selectUser('${u.id}', '${attrName}', '${initials}')"
                                                    class="user-option w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-800/80
                                                           transition-colors text-left"
                                                    data-name="${attrName.toLowerCase()}">
                                                <span class="w-8 h-8 rounded-full bg-brand-gold/15 border border-brand-gold/30 
                                                             flex items-center justify-center text-xs font-black text-brand-gold shrink-0">
                                                    ${initials}
                                                </span>
                                                <span class="text-white text-sm font-medium truncate">${safeName}</span>
                                            </button>`;
        }).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-bold text-slate-400 uppercase">Senha de Acesso</label>
                            <div class="relative">
                                <input type="password" id="login-password" 
                                       placeholder="Digite sua senha"
                                       class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all">
                                <i data-lucide="lock" class="absolute left-3 top-3.5 w-5 h-5 text-slate-500"></i>
                            </div>
                        </div>

                        <button onclick="App.login()" 
                                class="w-full py-4 bg-brand-gold hover:bg-yellow-500 text-slate-900 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-brand-gold/20 active:scale-95 transition-all mt-6 flex items-center justify-center gap-2">
                            <i data-lucide="log-in" class="w-5 h-5"></i>
                            Entrar no Sistema
                        </button>
                    </div>
                    
                    <div class="mt-6 flex items-center justify-between text-sm">
                         <a href="#" onclick="alert('Procure o diretor do clube para redefinir sua senha.')" class="text-slate-500 hover:text-brand-gold transition-colors">
                            Esqueci minha senha
                        </a>
                    </div>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(false);

        // Bind Enter key
        document.getElementById('login-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const container = document.getElementById('user-dropdown-container');
            if (container && !container.contains(e.target)) {
                this._closeDropdown();
            }
        });
    },

    // --- Custom Dropdown Methods ---
    toggleUserDropdown() {
        const panel = document.getElementById('user-dropdown-panel');
        const chevron = document.getElementById('dropdown-chevron');
        if (!panel) return;

        const isOpen = !panel.classList.contains('hidden');
        if (isOpen) {
            this._closeDropdown();
        } else {
            panel.classList.remove('hidden');
            chevron?.classList.add('rotate-180');
            // Focus search
            setTimeout(() => {
                document.getElementById('user-search-input')?.focus();
            }, 50);
        }
    },

    _closeDropdown() {
        const panel = document.getElementById('user-dropdown-panel');
        const chevron = document.getElementById('dropdown-chevron');
        panel?.classList.add('hidden');
        chevron?.classList.remove('rotate-180');
    },

    filterUserDropdown(query) {
        const q = query.toLowerCase().trim();
        const options = document.querySelectorAll('.user-option');
        options.forEach(opt => {
            const name = opt.getAttribute('data-name') || '';
            opt.style.display = name.includes(q) ? '' : 'none';
        });
    },

    selectUser(userId, userName, initials) {
        document.getElementById('login-user').value = userId;
        document.getElementById('selected-user-name').textContent = userName;
        document.getElementById('selected-user-name').classList.remove('text-slate-500');
        document.getElementById('selected-user-name').classList.add('text-white');

        const avatar = document.getElementById('selected-user-avatar');
        avatar.textContent = initials;
        avatar.classList.remove('bg-slate-800', 'border-slate-600', 'text-slate-500');
        avatar.classList.add('bg-brand-gold/15', 'border-brand-gold/30', 'text-brand-gold');

        this._closeDropdown();

        // Focus password field
        setTimeout(() => document.getElementById('login-password')?.focus(), 100);
    },

    // --- Biometric Methods ---
    async biometricLogin() {
        try {
            Loading.show('Verificando biometria...');
            const result = await BiometricAuth.authenticate();

            if (!result?.userId) {
                throw new Error('Falha na autenticação');
            }

            // Fetch user data from Supabase
            const { data: users, error } = await window.supabaseClient
                .from('app_users')
                .select('*')
                .eq('id', result.userId);

            if (error || !users || users.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const user = users[0];
            Store.setCurrentUser(user);
            DevStorage.set('cd_auth', true);
            this.isAuthenticated = true;

            // Fetch RBAC
            try {
                await RBAC.fetchUserData(user.name);
            } catch (e) {
                console.error('RBAC error:', e);
            }

            Loading.hide();
            Toast.show(`Bem-vindo, ${user.name}! 👋`, 'success');
            this.startSessionTimeout();
            this.setupActivityListeners();
            this.navigate('dashboard');

        } catch (error) {
            Loading.hide();
            console.error('Biometric login error:', error);
            if (error.message !== 'Autenticação cancelada') {
                Toast.show('Biometria falhou. Use sua senha.', 'error');
            }
        }
    },

    async promptBiometricSetup(user) {
        // Only prompt if WebAuthn is available and no credential yet
        if (!BiometricAuth.isAvailable() || BiometricAuth.hasCredential()) {
            return;
        }

        // Use ConfirmDialog
        ConfirmDialog.show(
            'Deseja ativar o login por biometria (impressão digital / FaceID) neste dispositivo? Isso permitirá acesso rápido sem digitar senha.',
            async () => {
                try {
                    Loading.show('Registrando biometria...');
                    await BiometricAuth.register(user.id, user.name);
                    Loading.hide();
                    Toast.show('Biometria ativada! No próximo login, use o botão verde. ✅', 'success');
                } catch (error) {
                    Loading.hide();
                    console.error('Biometric setup error:', error);
                    if (error.message !== 'Registro cancelado pelo usuário') {
                        Toast.show('Não foi possível ativar a biometria', 'error');
                    }
                }
            },
            'Ativar Biometria',
            'Agora Não'
        );
    },

    removeBiometric() {
        ConfirmDialog.show(
            'Remover login biométrico deste dispositivo? Você precisará usar sua senha novamente.',
            () => {
                BiometricAuth.removeCredential();
                Toast.show('Biometria removida', 'success');
                this.renderLogin();
            }
        );
    },

    // --- Login (PIN) ---
    async login() {
        const userSelect = document.getElementById('login-user');
        const passwordInput = document.getElementById('login-password');

        if (!userSelect || !passwordInput) return;

        const selectedUserId = userSelect.value;
        const password = passwordInput.value.trim().toLowerCase();

        // Validações
        if (!selectedUserId) {
            Toast.show('Selecione seu usuário!', 'error');
            return;
        }

        if (!password) {
            Toast.show('Digite sua senha!', 'error');
            passwordInput.focus();
            return;
        }

        try {
            // Buscar usuário no banco de dados
            const { data: users, error } = await window.supabaseClient
                .from('app_users')
                .select('*')
                .eq('id', selectedUserId);

            if (error) {
                console.error('Erro ao buscar usuário:', error);
                Toast.show('Erro ao fazer login. Tente novamente.', 'error');
                return;
            }

            if (!users || users.length === 0) {
                Toast.show('Usuário não encontrado!', 'error');
                return;
            }

            const user = users[0];

            // Validar senha - Support both hashed and plaintext PINs
            let isValidPIN = false;

            // Check if user has hashed PIN (new system)
            if (user.hashed_pin) {
                try {
                    if (window.SimplePINHasher) {
                        isValidPIN = await window.SimplePINHasher.verifyPIN(password, user.hashed_pin);
                    } else {
                        console.warn('SimplePINHasher not loaded, falling back to plaintext comparison');
                        isValidPIN = (user.pin.toLowerCase() === password);
                    }
                } catch (error) {
                    console.error('Error verifying hashed PIN:', error);
                    isValidPIN = (user.pin.toLowerCase() === password);
                }
            } else {
                isValidPIN = (user.pin.toLowerCase() === password);

                if (isValidPIN && !user.must_change_password) {
                    console.log('⚠️ User has plaintext PIN, should change it');
                }
            }

            if (!isValidPIN) {
                Toast.show('Senha incorreta! Tente novamente.', 'error');
                passwordInput.value = '';
                passwordInput.focus();
                return;
            }

            // Login bem-sucedido
            Store.setCurrentUser(user);
            DevStorage.set('cd_auth', true);
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

            // Verificar se precisa trocar senha
            if (user.must_change_password) {
                console.log('🔐 Usuário precisa trocar senha');
                this.navigate('password-change');
                return;
            }

            // Prompt biometric setup (deactivated)
            // setTimeout(() => this.promptBiometricSetup(user), 1500);

            // Navegar para dashboard
            this.navigate('dashboard');

        } catch (error) {
            console.error('Erro no login:', error);
            Toast.show('Ocorreu um erro ao fazer login.', 'error');
        }
    },

    logout() {
        this.isAuthenticated = false;
        Store.clearSession();
        DevStorage.remove('cd_auth');

        // Clear timeouts
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);

        Toast.show('Logout realizado com sucesso', 'success');
        this.navigate('login');
    },

    // --- Session Management ---
    startSessionTimeout() {
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);

        // 30 minutes timeout
        this.sessionTimeout = setTimeout(() => {
            console.log('⏰ Session timed out');
            Toast.show('Sessão expirada por inatividade', 'warning');
            this.logout();
        }, 30 * 60 * 1000);
    },

    resetSessionTimeout() {
        if (this.isAuthenticated) {
            this.startSessionTimeout();
        }
    },

    setupActivityListeners() {
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];

        // Throttle to avoid excessive calls
        let lastReset = 0;
        const throttleTime = 5000; // 5 seconds

        const reset = () => {
            const now = Date.now();
            if (now - lastReset > throttleTime) {
                this.resetSessionTimeout();
                lastReset = now;
            }
        };

        events.forEach(event => {
            document.addEventListener(event, reset, { passive: true });
        });
    },

    // --- Password Change ---
    renderPasswordChange() {
        const user = Store.getCurrentUser();
        if (!user) {
            this.navigate('login');
            return;
        }

        const html = `
            <div class="min-h-screen flex items-center justify-center p-4 bg-slate-900">
                <div class="w-full max-w-md bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 animate-slide-in">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="key" class="w-8 h-8 text-brand-gold"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">Trocar Senha</h2>
                        <p class="text-slate-400 text-sm">Por segurança, você precisa definir uma nova senha.</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Nova Senha</label>
                            <input type="password" id="new-password" 
                                   class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-brand-gold focus:outline-none transition-colors"
                                   placeholder="Mínimo 4 caracteres (números ou letras)">
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">Confirmar Nova Senha</label>
                            <input type="password" id="confirm-password" 
                                   class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-brand-gold focus:outline-none transition-colors"
                                   placeholder="Digite novamente">
                        </div>

                        <button onclick="App.changePassword()" 
                                class="w-full py-3 bg-brand-gold hover:bg-yellow-500 text-slate-900 font-bold rounded-xl mt-4 transition-colors">
                            Salvar Nova Senha
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(false);
    },

    async changePassword() {
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const user = Store.getCurrentUser();

        // Use hasher validation for strength
        const validation = window.SimplePINHasher.validatePINStrength(newPass);
        if (!validation.valid) {
            Toast.show(validation.errors[0], 'error');
            return;
        }

        if (newPass !== confirmPass) {
            Toast.show('As senhas não coincidem!', 'error');
            return;
        }

        Loading.show('Atualizando senha...');

        try {
            let hashedPIN = null;

            try {
                if (window.SimplePINHasher) {
                    hashedPIN = await window.SimplePINHasher.hashPIN(newPass);
                    console.log('✅ PIN hashed successfully (SHA-256)');
                } else {
                    console.warn('⚠️ SimplePINHasher not loaded, storing plaintext PIN only');
                }
            } catch (error) {
                console.error('Error hashing PIN:', error);
            }

            const updateData = {
                pin: newPass.toLowerCase(),
                must_change_password: false
            };

            if (hashedPIN) {
                updateData.hashed_pin = hashedPIN;
            }

            const { error } = await window.supabaseClient
                .from('app_users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            user.pin = newPass.toLowerCase();
            user.must_change_password = false;
            if (hashedPIN) {
                user.hashed_pin = hashedPIN;
            }
            Store.setCurrentUser(user);

            Loading.hide();
            Toast.show('Senha alterada com sucesso!', 'success');

            setTimeout(() => {
                console.log('🔄 Navigating to dashboard...');
                this.navigate('dashboard');
            }, 1000);

        } catch (error) {
            Loading.hide();
            console.error('💥 Error changing password:', error);
            Toast.show(`Erro ao alterar senha: ${error.message || 'Tente novamente.'}`, 'error');
        }
    }
};
