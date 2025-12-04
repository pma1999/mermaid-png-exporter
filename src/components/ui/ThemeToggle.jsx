import { useTheme } from '../../hooks/useTheme';

/**
 * Botón de toggle para cambiar entre tema oscuro y claro
 */
export function ThemeToggle() {
    const { theme, toggleTheme, colors } = useTheme();

    const styles = {
        button: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: colors.bgButton,
            border: `1px solid ${colors.borderSecondary}`,
            borderRadius: "12px",
            padding: "8px 14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            color: colors.textSecondary,
        },
        label: {
            fontSize: "13px",
            fontWeight: "500",
        },
    };

    return (
        <button
            onClick={toggleTheme}
            style={styles.button}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            {theme === 'dark' ? (
                <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span style={styles.label}>Claro</span>
                </>
            ) : (
                <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span style={styles.label}>Oscuro</span>
                </>
            )}
        </button>
    );
}
