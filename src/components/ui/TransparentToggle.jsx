import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * Toggle de fondo transparente (Responsive)
 * @param {Object} props
 * @param {boolean} props.value - Estado actual
 * @param {Function} props.onChange - Handler de cambio
 * @param {boolean} props.isMobile - Is mobile viewport
 */
export function TransparentToggle({ value, onChange, isMobile = false }) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();

    const styles = {
        label: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '10px',
            fontSize: isMobile ? '12px' : '13px',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontWeight: '500',
            // Ensure touch-friendly size
            minHeight: '44px',
            padding: '0 4px',
        },
        checkbox: {
            display: 'none',
        },
        customCheckbox: {
            width: isMobile ? '22px' : '20px',
            height: isMobile ? '22px' : '20px',
            borderRadius: '6px',
            border: `2px solid ${colors.borderInput}`,
            background: colors.bgButton,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
        },
        text: {
            // Shorter text on mobile
            whiteSpace: 'nowrap',
        },
    };

    return (
        <label style={styles.label}>
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                style={styles.checkbox}
            />
            <span style={styles.customCheckbox}>
                {value && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? 'white' : '#6366f1'} strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </span>
            <span style={styles.text}>{isMobile ? t('footer.transparentShort') : t('footer.transparent')}</span>
        </label>
    );
}

