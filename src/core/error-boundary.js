import { Toast } from '../ui/toast.js';

export const ErrorBoundary = {
    isInitialized: false,

    init() {
        if (this.isInitialized) return;

        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('❌ [GLOBAL ERROR]', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });

            // Show user-friendly message
            if (window.Toast) {
                Toast.show('Ocorreu um erro inesperado. Recarregando...', 'error');
            } else {
                // Fallback if Toast is not available yet
                console.log('Ocorreu um erro inesperado. Recarregando...');
            }

            // Reload after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);

            // Prevent default error handling
            event.preventDefault();
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ [UNHANDLED PROMISE]', {
                reason: event.reason,
                promise: event.promise
            });

            // Show user-friendly message
            if (window.Toast) {
                Toast.show('Erro de conexão. Tentando novamente...', 'error');
            }

            // Prevent default handling
            event.preventDefault();
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            console.log('✅ [NETWORK] Connection restored');
            if (window.Toast) {
                Toast.show('Conexão restaurada!', 'success');
            }
        });

        window.addEventListener('offline', () => {
            console.warn('⚠️ [NETWORK] Connection lost');
            if (window.Toast) {
                Toast.show('Modo offline ativado', 'warning');
            }
        });

        this.isInitialized = true;
        console.log('✅ [ERROR BOUNDARY] Initialized');
    },

    // Manual error reporting
    report(error, context = {}) {
        console.error('❌ [MANUAL ERROR]', {
            error: error,
            context: context,
            timestamp: new Date().toISOString()
        });
    }
};
