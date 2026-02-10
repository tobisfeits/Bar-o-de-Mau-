export const Loading = {
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
