import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { applyHighContrast, resetVisibility } from '../../utils/visibilityFixer';

/**
 * Visibility Controls - Premium Visual Enhancer
 * A single, high-impact toggle to fix visibility issues using High Contrast Mode.
 */
export function VisibilityControls({ code, onCodeChange }) {
    const { t } = useLanguage();
    const { colors, theme } = useTheme();
    const [isActive, setIsActive] = useState(false);

    // Cyber-Noir Palette (Amber/Gold Accent)
    const accentColor = '#fbbf24'; // Amber-400
    const glowColor = 'rgba(251, 191, 36, 0.4)';

    const handleToggle = () => {
        if (!isActive) {
            onCodeChange(applyHighContrast(code));
            setIsActive(true);
        } else {
            onCodeChange(resetVisibility(code));
            setIsActive(false);
        }
    };

    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
        },
        button: {
            background: isActive
                ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.15)' : '#fffbeb')
                : 'transparent',
            border: `1px solid ${isActive ? accentColor : colors.borderPrimary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isActive ? (theme === 'dark' ? accentColor : '#b45309') : colors.textSecondary,
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            boxShadow: isActive ? `0 0 12px ${glowColor}` : 'none',
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.02em',
        },
        icon: {
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isActive ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        }
    };

    return (
        <div style={styles.container}>
            <button
                style={styles.button}
                onClick={handleToggle}
                onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
                        e.currentTarget.style.color = colors.textPrimary;
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.borderColor = colors.borderPrimary;
                        e.currentTarget.style.color = colors.textSecondary;
                    }
                }}
                title={t('visibility.tooltip')}
            >
                <div style={styles.icon}>
                    {isActive ? (
                        /* Sparkle Icon for Active State */
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    ) : (
                        /* Eye Icon for Inactive State */
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </div>
                <span>
                    {isActive ? t('visibility.reset') : t('visibility.enhance')}
                </span>
            </button>
        </div>
    );
}
