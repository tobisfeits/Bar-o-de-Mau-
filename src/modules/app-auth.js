import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { Loading } from '../ui/loading.js';
import { Toast } from '../ui/toast.js';
import { CONFIG } from '../config/constants.js';
import { DevStorage } from '../data/dev-storage.js';

export const AuthMethods = {
    sessionTimeout: null,
    activityTimeout: null,

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
                        <div class="space-y-2">
                            <label class="block text-sm font-bold text-slate-400 uppercase">Selecione seu Usuário</label>
                            <div class="relative">
                                <select id="login-user" class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white appearance-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all">
                                    <option value="">Selecione...</option>
                                    ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                                </select>
                                <i data-lucide="user" class="absolute left-3 top-3.5 w-5 h-5 text-slate-500"></i>
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
                    
                    <div class="mt-6 text-center">
                         <a href="#" onclick="alert('Procure o diretor do clube para redefinir sua senha.')" class="text-sm text-slate-500 hover:text-brand-gold transition-colors">
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

        try {
            // Buscar usuário no banco de dados
            const { data: users, error } = await window.supabaseClient
                .from('app_users')
                .select('*')
                .eq('id', selectedUserId);

            if (error) {
                console.error('Erro ao buscar usuário:', error);
                alert('Erro ao fazer login. Tente novamente.');
                return;
            }

            if (!users || users.length === 0) {
                alert('Usuário não encontrado!');
                return;
            }

            const user = users[0];

            // Validar senha - Support both hashed and plaintext PINs
            let isValidPIN = false;

            // Check if user has hashed PIN (new system)
            if (user.hashed_pin) {
                try {
                    // Use SimplePINHasher (Web Crypto API - no CSP issues)
                    if (window.SimplePINHasher) {
                        isValidPIN = await window.SimplePINHasher.verifyPIN(password, user.hashed_pin);
                    } else {
                        console.warn('SimplePINHasher not loaded, falling back to plaintext comparison');
                        isValidPIN = (user.pin.toLowerCase() === password);
                    }
                } catch (error) {
                    console.error('Error verifying hashed PIN:', error);
                    // Fallback to plaintext
                    isValidPIN = (user.pin.toLowerCase() === password);
                }
            } else {
                // Old system: plaintext PIN comparison
                isValidPIN = (user.pin.toLowerCase() === password);

                // Flag user to change PIN on next login
                if (isValidPIN && !user.must_change_password) {
                    console.log('⚠️ User has plaintext PIN, should change it');
                    // Optionally set must_change_password flag
                }
            }

            if (!isValidPIN) {
                alert('Senha incorreta! Tente novamente ou clique em "Esqueci minha senha".');
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

            // ✨ NOVO: Verificar se precisa trocar senha
            if (user.must_change_password) {
                console.log('🔐 Usuário precisa trocar senha');
                this.navigate('password-change');
                return;
            }

            // Navegar para dashboard
            this.navigate('dashboard');

        } catch (error) {
            console.error('Erro no login:', error);
            alert('Ocorreu um erro ao fazer login.');
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
                                   placeholder="Mínimo 4 caracteres">
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

        if (newPass.length < 4) {
            alert('A senha deve ter pelo menos 4 caracteres.');
            return;
        }

        if (newPass !== confirmPass) {
            alert('As senhas não coincidem!');
            return;
        }

        Loading.show('Atualizando senha...');

        try {
            let hashedPIN = null;

            // Try to hash the PIN
            try {
                if (window.SimplePINHasher) {
                    // Use SimplePINHasher (Web Crypto API - SHA-256)
                    hashedPIN = await window.SimplePINHasher.hashPIN(newPass);
                    console.log('✅ PIN hashed successfully (SHA-256)');
                } else {
                    console.warn('⚠️ SimplePINHasher not loaded, storing plaintext PIN only');
                }
            } catch (error) {
                console.error('Error hashing PIN:', error);
                // Continue without hash
            }

            // Update database with both hashed and plaintext PIN (migration phase)
            const updateData = {
                pin: newPass.toLowerCase(),  // Keep for backward compatibility
                must_change_password: false
            };

            // Add hashed PIN if available
            if (hashedPIN) {
                updateData.hashed_pin = hashedPIN;
            }

            const { error } = await window.supabaseClient
                .from('app_users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            // Update local user
            user.pin = newPass.toLowerCase();
            user.must_change_password = false;
            if (hashedPIN) {
                user.hashed_pin = hashedPIN;
            }
            Store.setCurrentUser(user);

            // Also update DevStorage cache if exists
            // This is a bit hacky but consistent with app.js logic
            console.log('📦 DevStorage check:', DevStorage.get('cd_current_user'));

            Loading.hide();
            Toast.show('Senha alterada com sucesso!', 'success');

            // Wait 1 second and redirect
            setTimeout(() => {
                console.log('🔄 Navigating to dashboard...');
                this.navigate('dashboard');
            }, 1000);

        } catch (error) {
            Loading.hide();
            console.error('💥 Error changing password:', error);
            alert(`Erro ao alterar senha: ${error.message || 'Tente novamente.'}`);
        }
    }
};
