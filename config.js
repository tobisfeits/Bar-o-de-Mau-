// Environment Configuration
// This file reads environment variables for Supabase configuration
// For Vercel deployment, set these in the Vercel dashboard

const ENV_CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL
        ? process.env.VITE_SUPABASE_URL
        : (typeof window !== 'undefined' && window.ENV?.VITE_SUPABASE_URL) || '',

    SUPABASE_ANON_KEY: typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY
        ? process.env.VITE_SUPABASE_ANON_KEY
        : (typeof window !== 'undefined' && window.ENV?.VITE_SUPABASE_ANON_KEY) || '',

    // Enable Supabase only if credentials are provided
    get SUPABASE_ENABLED() {
        return !!(this.SUPABASE_URL && this.SUPABASE_ANON_KEY);
    }
};

// Log configuration status (without exposing keys)
if (ENV_CONFIG.SUPABASE_ENABLED) {
    console.log('✅ Supabase configurado via variáveis de ambiente');
} else {
    console.log('⚠️ Variáveis de ambiente não encontradas - usando modo offline (localStorage)');
}
