export const ENV_CONFIG = {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',

    // Enable Supabase only if credentials are provided
    get SUPABASE_ENABLED() {
        return !!(this.SUPABASE_URL && this.SUPABASE_ANON_KEY);
    },

    // Initialize configuration by fetching from API
    async init() {
        try {
            const response = await fetch('/api/env');
            if (response.ok) {
                const env = await response.json();
                this.SUPABASE_URL = env.VITE_SUPABASE_URL || '';
                this.SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

                if (this.SUPABASE_ENABLED) {
                    console.log('✅ Supabase configurado via API');
                } else {
                    console.log('⚠️ Variáveis de ambiente vazias - usando modo offline (localStorage)');
                }
            } else {
                console.log('⚠️ Não foi possível carregar variáveis de ambiente - usando modo offline (localStorage)');
            }
        } catch (error) {
            console.log('⚠️ Erro ao carregar variáveis de ambiente - usando modo offline (localStorage)');
        }
    }
};

export const SUPABASE_CONFIG = {
    url: '',
    key: '',
    enabled: false,

    async initialize() {
        await ENV_CONFIG.init();
        this.url = ENV_CONFIG.SUPABASE_URL;
        this.key = ENV_CONFIG.SUPABASE_ANON_KEY;
        this.enabled = ENV_CONFIG.SUPABASE_ENABLED;

        // Initialize Global Client
        if (this.enabled && typeof supabase !== 'undefined') {
            window.supabaseClient = supabase.createClient(this.url, this.key);
            console.log('✅ Supabase conectado!', this.url);
        } else {
            console.log('⚠️ Usando localStorage (modo offline)');
        }
    }
};

export function getStorageUrl(bucket, file) {
    if (SUPABASE_CONFIG.enabled && file) {
        return `${SUPABASE_CONFIG.url}/storage/v1/object/public/${bucket}/${file}`;
    }
    return file; // Caminho local
}
