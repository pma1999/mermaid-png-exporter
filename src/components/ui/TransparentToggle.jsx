import { useTheme } from '../../hooks/useTheme';

/**
 * Toggle de fondo transparente
 * @param {Object} props
 * @param {boolean} props.value - Estado actual
 * @param {Function} props.onChange - Handler de cambio
 */
export function TransparentToggle({ value, onChange }) {
    const { colors, isDark } = useTheme();

    const styles = {
        label: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            color: colors.textSecondary,
            cursor: "pointer",
            fontWeight: "500",
        },
        checkbox: {
            display: "none",
        },
        customCheckbox: {
            width: "20px",
            height: "20px",
            borderRadius: "6px",
            border: `2px solid ${colors.borderInput}`,
            background: colors.bgButton,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
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
            Fondo transparente
        </label>
    );
}
