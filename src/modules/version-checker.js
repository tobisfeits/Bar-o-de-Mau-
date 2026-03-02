export const VersionChecker = {
    currentVersion: '2026.03.02.001',
    checkInterval: 30000, // 30 segundos
    intervalId: null,

    async init() {
        console.log('🔄 Version Checker iniciado - v' + this.currentVersion);
        this.startChecking();
    },

    startChecking() {
        // Verificar imediatamente
        this.checkVersion();

        // Verificar a cada 30 segundos
        this.intervalId = setInterval(() => {
            this.checkVersion();
        }, this.checkInterval);
    },

    async checkVersion() {
        try {
            // Buscar versão do servidor (com cache busting)
            const response = await fetch(`/version.json?t=${Date.now()}`);
            if (!response.ok) return;

            const serverVersion = await response.json();

            // Comparar versões
            if (serverVersion.version !== this.currentVersion) {
                console.log('🆕 Nova versão disponível!', serverVersion.version);
                this.notifyUpdate(serverVersion);
            }
        } catch (error) {
            // Silenciar erro se version.json não existir ainda
            if (!error.message.includes('404')) {
                console.error('Erro ao verificar versão:', error);
            }
        }
    },

    notifyUpdate(serverVersion) {
        // Parar verificações
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Mostrar notificação
        const updateNotification = `
            <div id="update-notification" style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 99999;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideDown 0.3s ease-out;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <i data-lucide="refresh-cw" style="width: 24px; height: 24px; animation: spin 2s linear infinite;"></i>
                <div>
                    <strong style="display: block; font-size: 16px;">Nova versão disponível!</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">
                        Atualizando automaticamente em <span id="countdown">5</span>s...
                    </p>
                </div>
            </div>
            <style>
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', updateNotification);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Countdown de 5 segundos
        let countdown = 5;
        const countdownEl = document.getElementById('countdown');

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.forceUpdate();
            }
        }, 1000);
    },

    forceUpdate() {
        console.log('🔄 Forçando atualização...');

        // Limpar cache do Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }

        // Limpar localStorage (exceto dados importantes)
        const authData = localStorage.getItem('cd_auth');
        const currentUser = localStorage.getItem('cd_current_user');
        const rbacUser = localStorage.getItem('rbac_user');

        // Limpar tudo
        localStorage.clear();

        // Restaurar dados importantes
        if (authData) localStorage.setItem('cd_auth', authData);
        if (currentUser) localStorage.setItem('cd_current_user', currentUser);
        if (rbacUser) localStorage.setItem('rbac_user', rbacUser);

        // Forçar reload com cache busting
        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
    }
};
