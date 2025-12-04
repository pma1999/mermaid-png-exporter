import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Hook para acceder al contexto de tema
 * @returns {Object} theme, colors, toggleTheme, isDark, isLight
 */
export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}
