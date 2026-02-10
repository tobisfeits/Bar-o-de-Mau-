// Environment Configuration
// This file reads environment variables for Supabase configuration
// For Vercel deployment, variables are fetched from /api/env

const ENV_CONFIG = {
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
