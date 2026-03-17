export const Theme = {
    current: null,

    init() {
        // ALWAYS use dark mode (fixed)
        this.current = 'dark';
        localStorage.setItem('theme', 'dark');
        this.apply('dark');
    },

    toggle() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        this.apply(this.current);
        localStorage.setItem('theme', this.current);

        import('./toast.js').then(({ Toast }) => {
            Toast.show(`Modo ${this.current === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
        });
    },

    apply(theme) {
        // Force dark mode always
        document.documentElement.setAttribute('data-theme', 'dark');
        this.current = 'dark';

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#0f172a');
        }
    },

    isDark() {
        return this.current === 'dark';
    },

    getIcon() {
        return this.isDark() ? 'sun' : 'moon';
    }
};
