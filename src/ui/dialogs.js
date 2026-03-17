export const ConfirmDialog = {
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
