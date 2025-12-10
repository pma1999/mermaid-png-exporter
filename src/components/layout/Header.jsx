import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { ThemeToggle, LanguageSelector } from '../ui';

// Logo SVG como componente
function Logo({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
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
 * Componente de cabecera de la aplicación (Responsive)
 * @param {Object} props
 * @param {boolean} props.isMobile - Is mobile viewport
 * @param {boolean} props.isTablet - Is tablet viewport
 */
export function Header({ isMobile = false, isTablet = false }) {
    const { theme, colors } = useTheme();
    const { t } = useLanguage();

    // Responsive styles
    const styles = {
        header: {
            padding: isMobile ? '12px 16px' : isTablet ? '16px 24px' : '20px 32px',
            borderBottom: `1px solid ${colors.borderPrimary}`,
            background: colors.bgElevated,
            backdropFilter: 'blur(20px)',
            transition: 'background 0.3s ease, border-color 0.3s ease',
        },
        content: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1800px',
            margin: '0 auto',
            gap: isMobile ? '8px' : '16px',
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '14px',
        },
        title: {
            fontSize: isMobile ? '18px' : isTablet ? '20px' : '22px',
            fontWeight: '600',
            color: theme === 'dark' ? '#ffffff' : '#6366f1',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
        },
        rightSection: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
        },
        subtitle: {
            fontSize: '13px',
            color: colors.textMuted,
            fontWeight: '500',
            // Hide on mobile to save space
            display: isMobile ? 'none' : 'block',
        },
    };

    return (
        <header style={styles.header}>
            <div style={styles.content}>
                <div style={styles.logo}>
                    <Logo size={isMobile ? 28 : 32} />
                    <h1 style={styles.title}>Mermaid → PNG</h1>
                </div>

                <div style={styles.rightSection}>
                    <LanguageSelector isMobile={isMobile} />
                    <ThemeToggle isMobile={isMobile} />
                    <p style={styles.subtitle}>{t('header.subtitle')}</p>
                </div>
            </div>
        </header>
    );
}

