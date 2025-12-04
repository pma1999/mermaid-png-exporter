/**
 * Botón de exportación con estados de carga y éxito
 * @param {Object} props
 * @param {Function} props.onClick - Handler de click
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {boolean} props.isExporting - Estado de exportación
 * @param {boolean} props.success - Estado de éxito
 */
export function ExportButton({ onClick, disabled, isExporting, success }) {
    const styles = {
        button: {
            padding: "14px 28px",
            fontSize: "14px",
            fontWeight: "600",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease",
            boxShadow: disabled ? "none" : "0 4px 20px rgba(99, 102, 241, 0.3)",
            opacity: disabled ? 0.4 : 1,
        },
        buttonSuccess: {
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
        },
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isExporting}
            style={{
                ...styles.button,
                ...(success ? styles.buttonSuccess : {}),
            }}
        >
            {success ? (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Descargado
                </>
            ) : (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Exportar PNG
                </>
            )}
        </button>
    );
}
