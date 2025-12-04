import { useTheme } from '../../hooks/useTheme';

/**
 * Botón con icono reutilizable
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icono SVG
 * @param {Function} props.onClick - Handler de click
 * @param {string} props.title - Tooltip
 * @param {boolean} props.active - Estado activo
 */
export function IconButton({ icon, onClick, title, active = false, style = {} }) {
    const { colors } = useTheme();

    const baseStyles = {
        background: "transparent",
        border: "none",
        padding: "8px",
        borderRadius: "8px",
        cursor: "pointer",
        color: active ? colors.textPrimary : colors.textMuted,
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
    };

    return (
        <button
            onClick={onClick}
            style={baseStyles}
            title={title}
        >
            {icon}
        </button>
    );
}
