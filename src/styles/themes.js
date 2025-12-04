// Paletas de colores para cada tema
export const themes = {
    dark: {
        // Backgrounds
        bgPrimary: '#0a0a0f',
        bgSecondary: '#0d0d12',
        bgTertiary: '#0f0f14',
        bgElevated: 'rgba(10,10,15,0.8)',
        bgFooter: 'rgba(10,10,15,0.9)',
        bgHover: 'rgba(255,255,255,0.05)',
        bgInput: 'transparent',
        bgButton: 'rgba(255,255,255,0.04)',
        bgButtonHover: 'rgba(255,255,255,0.08)',

        // Text
        textPrimary: '#e4e4e7',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
        textInverse: '#18181b',

        // Borders
        borderPrimary: 'rgba(255,255,255,0.06)',
        borderSecondary: 'rgba(255,255,255,0.08)',
        borderInput: 'rgba(255,255,255,0.1)',

        // Accents
        gradientStart: '#6366f1',
        gradientEnd: '#8b5cf6',

        // Preview area
        previewPattern: 'rgba(255,255,255,0.02)',

        // Scrollbar
        scrollTrack: 'rgba(255,255,255,0.05)',
        scrollThumb: 'rgba(255,255,255,0.15)',
        scrollThumbHover: 'rgba(255,255,255,0.25)',
    },
    light: {
        // Backgrounds
        bgPrimary: '#f8fafc',
        bgSecondary: '#ffffff',
        bgTertiary: '#f1f5f9',
        bgElevated: 'rgba(255,255,255,0.95)',
        bgFooter: 'rgba(248,250,252,0.95)',
        bgHover: 'rgba(0,0,0,0.04)',
        bgInput: '#ffffff',
        bgButton: 'rgba(0,0,0,0.04)',
        bgButtonHover: 'rgba(0,0,0,0.08)',

        // Text
        textPrimary: '#18181b',
        textSecondary: '#52525b',
        textMuted: '#71717a',
        textInverse: '#fafafa',

        // Borders
        borderPrimary: 'rgba(0,0,0,0.08)',
        borderSecondary: 'rgba(0,0,0,0.12)',
        borderInput: 'rgba(0,0,0,0.15)',

        // Accents
        gradientStart: '#6366f1',
        gradientEnd: '#8b5cf6',

        // Preview area  
        previewPattern: 'rgba(0,0,0,0.03)',

        // Scrollbar
        scrollTrack: 'rgba(0,0,0,0.05)',
        scrollThumb: 'rgba(0,0,0,0.15)',
        scrollThumbHover: 'rgba(0,0,0,0.25)',
    }
};

// Obtener tema inicial basado en preferencias
export const getInitialTheme = () => {
    // Verificar localStorage primero
    const savedTheme = localStorage.getItem('mermaid-exporter-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
    }
    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
};
