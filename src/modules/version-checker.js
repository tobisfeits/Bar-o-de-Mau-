export const VersionChecker = {
    // NOTE: This version string is INTENTIONALLY left empty.
    // Comparison is done against a 'last_seen_version' stored in localStorage,
    // which prevents false-positive loops when the JS bundle hasn't refreshed yet.
    checkInterval: 120000, // check every 2 minutes
    intervalId: null,
    _bannerShown: false,

    async init() {
        // Store the current server version on first load, use it as baseline
        await this._seedVersion();
        this.startChecking();
    },

    async _seedVersion() {
        try {
            const response = await fetch(`/version.json?t=${Date.now()}`);
            if (!response.ok) return;
            const data = await response.json();
            // On fresh load, record what the server says RIGHT NOW as the known version.
            // This prevents the first-load false positive.
            if (!localStorage.getItem('vc_known_version')) {
                localStorage.setItem('vc_known_version', data.version);
                console.log('📌 Version Checker baseline set:', data.version);
            }
        } catch (e) { /* silent */ }
    },

    startChecking() {
        this.intervalId = setInterval(() => this.checkVersion(), this.checkInterval);
    },

    async checkVersion() {
        if (this._bannerShown) return;
        try {
            const response = await fetch(`/version.json?t=${Date.now()}`);
            if (!response.ok) return;
            const data = await response.json();
            const knownVersion = localStorage.getItem('vc_known_version');

            if (knownVersion && data.version !== knownVersion) {
                console.log('🆕 Nova versão no servidor:', data.version, '| Conhecido:', knownVersion);
                this.showUpdateBanner();
            }
        } catch (e) { /* silent */ }
    },

    showUpdateBanner() {
        if (this._bannerShown) return;
        this._bannerShown = true;
        clearInterval(this.intervalId);

        const div = document.createElement('div');
        div.id = 'update-banner';
        div.style.cssText = [
            'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
            'background:linear-gradient(135deg,#10b981,#059669)', 'color:#fff',
            'padding:12px 20px', 'border-radius:12px',
            'box-shadow:0 8px 24px rgba(0,0,0,.35)', 'z-index:99999',
            'display:flex', 'align-items:center', 'gap:12px',
            'font-family:system-ui,sans-serif', 'font-size:14px',
            'animation:vcSlide .3s ease-out'
        ].join(';');

        div.innerHTML = `
            <style>@keyframes vcSlide{from{transform:translateX(-50%) translateY(-120%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}</style>
            <span style="font-size:20px">🔄</span>
            <div>
                <strong style="display:block;font-size:15px">Nova versão disponível!</strong>
                <span style="opacity:.85">Clique para atualizar agora</span>
            </div>
            <button onclick="window.__vcUpdate()" style="
                margin-left:8px;padding:8px 16px;background:#fff;color:#059669;
                border:none;border-radius:8px;font-weight:800;font-size:13px;
                cursor:pointer;white-space:nowrap">
                Atualizar
            </button>
            <button onclick="document.getElementById('update-banner').remove()" style="
                background:transparent;border:none;color:#fff;font-size:18px;
                cursor:pointer;line-height:1;padding:4px">✕</button>
        `;

        document.body.appendChild(div);

        // Global handler — clears cache then reloads once
        window.__vcUpdate = () => {
            // Update the known version before reloading to prevent re-triggering
            fetch(`/version.json?t=${Date.now()}`)
                .then(r => r.json())
                .then(d => localStorage.setItem('vc_known_version', d.version))
                .catch(() => { })
                .finally(() => {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations()
                            .then(regs => { regs.forEach(r => r.unregister()); })
                            .finally(() => location.reload(true));
                    } else {
                        location.reload(true);
                    }
                });
        };
    }
};
