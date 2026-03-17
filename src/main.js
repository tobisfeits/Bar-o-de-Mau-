import { App } from './modules/app.js';
import { Logger } from './core/logger.js';
import { PhotoManager } from './ui/photo-manager.js';
import { Sanitizer } from './utils/sanitizer.js';
import { Utils } from './modules/ui-utils.js';
import { Toast } from './ui/toast.js';
import { Loading } from './ui/loading.js';

// Expose App globally for inline event handlers (onclick="App.method()")
window.App = App;

// Expose other utilities used in HTML strings
window.Logger = Logger;
window.PhotoManager = PhotoManager;
window.Sanitizer = Sanitizer;
window.Utils = Utils;
window.Toast = Toast;
window.Loading = Loading;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await App.init();
    } catch (error) {
        console.error('CRITICAL: App initialization failed', error);
        // Basic error UI
        document.body.innerHTML = `
            <div style="color: white; text-align: center; padding: 40px; font-family: sans-serif;">
                <h1 style="color: #ef4444;">Erro Fatal</h1>
                <p>Não foi possível iniciar o aplicativo.</p>
                <code style="display:block; background:#1e293b; padding:10px; border-radius:8px; margin-top:20px; text-align:left; overflow:auto;">
                    ${error.message}
                </code>
                <button onclick="window.location.reload()" style="margin-top:20px; padding:10px 20px; cursor:pointer;">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
});
