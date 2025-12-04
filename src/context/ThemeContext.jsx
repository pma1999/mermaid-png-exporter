import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { themes, getInitialTheme } from '../styles/themes';

// Crear contexto
export const ThemeContext = createContext(null);

/**
 * Provider de tema que gestiona dark/light mode
 * - Persiste preferencia en localStorage
 * - Detecta preferencia del sistema
 * - Provee colores del tema actual
 */
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    // Guardar tema en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('mermaid-exporter-theme', theme);
    }, [theme]);

    // Escuchar cambios en preferencia del sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handleChange = (e) => {
            // Solo cambiar automáticamente si no hay preferencia guardada
            if (!localStorage.getItem('mermaid-exporter-theme')) {
                setTheme(e.matches ? 'light' : 'dark');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Toggle de tema
    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    // Colores del tema actual
    const colors = useMemo(() => themes[theme], [theme]);

    // Valor del contexto
    const value = useMemo(() => ({
        theme,
        colors,
        toggleTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
    }), [theme, colors, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
