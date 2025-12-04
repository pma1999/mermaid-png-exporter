import { useTheme } from '../../hooks/useTheme';

const SCALES = [1, 2, 3, 4];

/**
 * Selector de escala para exportación PNG
 * @param {Object} props
 * @param {number} props.value - Escala actual
 * @param {Function} props.onChange - Handler de cambio
 */
export function ScaleSelector({ value, onChange }) {
    const { colors } = useTheme();

    const styles = {
        container: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
        },
        label: {
            fontSize: "13px",
            color: colors.textMuted,
            fontWeight: "500",
        },
        buttons: {
            display: "flex",
            gap: "4px",
            background: colors.bgButton,
            padding: "4px",
            borderRadius: "10px",
        },
        button: {
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: "'JetBrains Mono', monospace",
            background: "transparent",
            border: "none",
            borderRadius: "6px",
            color: colors.textMuted,
            cursor: "pointer",
            transition: "all 0.2s ease",
        },
        buttonActive: {
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
        },
    };

    return (
        <div style={styles.container}>
            <label style={styles.label}>Escala</label>
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
