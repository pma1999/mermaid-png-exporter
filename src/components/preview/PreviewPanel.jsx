import { useTheme } from '../../hooks/useTheme';
import { ErrorDisplay } from '../error';

/**
 * Panel de vista previa del diagrama
 * @param {Object} props
 * @param {React.RefObject} props.previewRef - Ref del contenedor de preview
 * @param {boolean} props.isRendering - Estado de renderizado
 * @param {Object} props.errorInfo - Información del error
 * @param {string} props.code - Código actual
 * @param {Function} props.onAutoFix - Handler de auto-fix
 */
export function PreviewPanel({ previewRef, isRendering, errorInfo, code, onAutoFix }) {
    const { colors } = useTheme();

    const styles = {
        section: {
            background: colors.bgTertiary,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "background 0.3s ease",
        },
        header: {
            padding: "14px 20px",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: colors.bgHover,
            transition: "background 0.3s ease, border-color 0.3s ease",
        },
        title: {
            fontSize: "13px",
            fontWeight: "600",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "flex",
            alignItems: "center",
            gap: "10px",
        },
        renderingDot: {
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#6366f1",
            animation: "pulse 1s ease-in-out infinite",
        },
        container: {
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundImage: `
        linear-gradient(45deg, ${colors.previewPattern} 25%, transparent 25%),
        linear-gradient(-45deg, ${colors.previewPattern} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, ${colors.previewPattern} 75%),
        linear-gradient(-45deg, transparent 75%, ${colors.previewPattern} 75%)
      `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            transition: "background-image 0.3s ease",
        },
        preview: {
            maxWidth: "100%",
            maxHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
    };

    return (
        <section style={styles.section}>
            <div style={styles.header}>
                <span style={styles.title}>
                    Vista previa
                    {isRendering && <span style={styles.renderingDot} />}
                </span>
            </div>

            <div style={styles.container}>
                {errorInfo && (
                    <ErrorDisplay
                        errorInfo={errorInfo}
                        code={code}
                        onAutoFix={onAutoFix}
                    />
                )}
                <div
                    ref={previewRef}
                    style={{
                        ...styles.preview,
                        display: errorInfo ? 'none' : undefined
                    }}
                />
            </div>
        </section>
    );
}
