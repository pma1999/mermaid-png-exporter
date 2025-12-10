import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

const SCALES = [1, 2, 3, 4];

/**
 * Selector de escala para exportación PNG (Responsive)
 * @param {Object} props
 * @param {number} props.value - Escala actual
 * @param {Function} props.onChange - Handler de cambio
 * @param {boolean} props.isMobile - Is mobile viewport
 */
export function ScaleSelector({ value, onChange, isMobile = false }) {
    const { colors } = useTheme();
    const { t } = useLanguage();

    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
        },
        label: {
            fontSize: isMobile ? '12px' : '13px',
            color: colors.textMuted,
            fontWeight: '500',
            // Shorter label on mobile
            display: isMobile ? 'none' : 'block',
        },
        buttons: {
            display: 'flex',
            gap: '2px',
            background: colors.bgButton,
            padding: isMobile ? '3px' : '4px',
            borderRadius: isMobile ? '8px' : '10px',
        },
        button: {
            padding: isMobile ? '6px 10px' : '8px 14px',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '600',
            fontFamily: "'JetBrains Mono', monospace",
            background: 'transparent',
            border: 'none',
            borderRadius: isMobile ? '5px' : '6px',
            color: colors.textMuted,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            // Ensure touch-friendly size
            minWidth: isMobile ? '36px' : 'auto',
            minHeight: isMobile ? '36px' : 'auto',
        },
        buttonActive: {
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
        },
    };

    return (
        <div style={styles.container}>
            <label style={styles.label}>{t('footer.scale')}</label>
            <div style={styles.buttons}>
                {SCALES.map((scale) => (
                    <button
                        key={scale}
                        onClick={() => onChange(scale)}
                        style={{
                            ...styles.button,
                            ...(value === scale ? styles.buttonActive : {}),
                        }}
                    >
                        {scale}x
                    </button>
                ))}
            </div>
        </div>
    );
}

