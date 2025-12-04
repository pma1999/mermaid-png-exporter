import { useTheme } from '../../hooks/useTheme';
import { ThemeToggle } from '../ui';

// Logo SVG como componente
function Logo() {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
            <rect width="32" height="32" rx="8" fill="url(#mermaidLogoGrad)" />
            <path
                d="M8 12L16 8L24 12L16 16L8 12Z"
                fill="white"
                fillOpacity="0.9"
            />
            <path
                d="M8 16L16 20L24 16"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M8 20L16 24L24 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <defs>
                <linearGradient id="mermaidLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
            </defs>
        </svg>
    );
}

/**
 * Componente de cabecera de la aplicación
 */
export function Header() {
    const { theme, colors } = useTheme();

    const styles = {
        header: {
            padding: "20px 32px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            background: colors.bgElevated,
            backdropFilter: "blur(20px)",
            transition: "background 0.3s ease, border-color 0.3s ease",
        },
        content: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1800px",
            margin: "0 auto",
        },
        logo: {
            display: "flex",
            alignItems: "center",
            gap: "14px",
        },
        title: {
            fontSize: "22px",
            fontWeight: "600",
            color: theme === 'dark' ? '#ffffff' : '#6366f1',
            letterSpacing: "-0.02em",
        },
        rightSection: {
            display: "flex",
            alignItems: "center",
            gap: "16px",
        },
        subtitle: {
            fontSize: "13px",
            color: colors.textMuted,
            fontWeight: "500",
        },
    };

    return (
        <header style={styles.header}>
            <div style={styles.content}>
                <div style={styles.logo}>
                    <Logo />
                    <h1 style={styles.title}>Mermaid → PNG</h1>
                </div>

                <div style={styles.rightSection}>
                    <ThemeToggle />
                    <p style={styles.subtitle}>Exportador de alta calidad</p>
                </div>
            </div>
        </header>
    );
}
