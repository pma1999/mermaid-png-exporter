import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

// SVG Flag icons for reliable cross-platform display
const SpainFlag = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: '2px', flexShrink: 0 }}>
        <rect width="32" height="32" fill="#C60B1E" />
        <rect y="8" width="32" height="16" fill="#FFC400" />
    </svg>
);

const UKFlag = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: '2px', flexShrink: 0 }}>
        <rect width="32" height="32" fill="#012169" />
        <path d="M0 0L32 32M32 0L0 32" stroke="#fff" strokeWidth="5" />
        <path d="M0 0L32 32M32 0L0 32" stroke="#C8102E" strokeWidth="3" />
        <path d="M16 0V32M0 16H32" stroke="#fff" strokeWidth="9" />
        <path d="M16 0V32M0 16H32" stroke="#C8102E" strokeWidth="5" />
    </svg>
);

const FLAGS = {
    en: UKFlag,
    es: SpainFlag
};

/**
 * Language Selector Component (Responsive)
 * Compact toggle with SVG flag and language code
 * @param {Object} props
 * @param {boolean} props.isMobile - Is mobile viewport
 */
export function LanguageSelector({ isMobile = false }) {
    const { colors } = useTheme();
    const { language, setLanguage } = useLanguage();

    const otherLang = language === 'es' ? 'en' : 'es';
    const FlagIcon = FLAGS[language];
    const langLabels = { en: 'EN', es: 'ES' };
    const langNames = { en: 'English', es: 'Español' };

    const handleToggle = () => {
        setLanguage(otherLang);
    };

    const styles = {
        button: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '8px',
            padding: isMobile ? '8px 10px' : '8px 12px',
            background: colors.bgButton,
            border: `1px solid ${colors.borderSecondary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '600',
            color: colors.textSecondary,
            minHeight: '36px',
        },
        code: {
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
        },
    };

    return (
        <button
            onClick={handleToggle}
            style={styles.button}
            title={`Switch to ${langNames[otherLang]}`}
            aria-label={`Current language: ${langNames[language]}. Click to switch to ${langNames[otherLang]}`}
        >
            <FlagIcon size={isMobile ? 14 : 16} />
            <span style={styles.code}>{langLabels[language]}</span>
        </button>
    );
}

