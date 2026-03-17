/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './src/**/*.js',
        './upload-fotos.html',
        './reset.html',
        './admin-deleted-members.html'
    ],
    theme: {
        extend: {
            colors: {
                'brand-navy': '#1a2332',
                'brand-gold': '#d4af37',
                'brand-red': '#8b0000'
            }
        }
    },
    plugins: []
};
