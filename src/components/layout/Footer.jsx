import { useTheme } from '../../hooks/useTheme';
import { ScaleSelector, TransparentToggle, ExportButton } from '../ui';

/**
 * Componente de pie de página con controles de exportación
 * @param {Object} props
 * @param {number} props.exportScale - Escala de exportación
 * @param {Function} props.onScaleChange - Handler de cambio de escala
 * @param {boolean} props.bgTransparent - Estado de fondo transparente
 * @param {Function} props.onTransparentChange - Handler de cambio de transparencia
 * @param {Function} props.onExport - Handler de exportación
 * @param {boolean} props.isExporting - Estado de exportación
 * @param {boolean} props.exportSuccess - Estado de éxito
 * @param {boolean} props.canExport - Si se puede exportar
 */
export function Footer({
    exportScale,
    onScaleChange,
    bgTransparent,
    onTransparentChange,
    onExport,
    isExporting,
    exportSuccess,
    canExport,
}) {
    const { colors } = useTheme();

    const styles = {
        footer: {
            padding: "16px 32px",
            borderTop: `1px solid ${colors.borderPrimary}`,
            background: colors.bgFooter,
            backdropFilter: "blur(20px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            transition: "background 0.3s ease, border-color 0.3s ease",
        },
        options: {
            display: "flex",
            alignItems: "center",
            gap: "32px",
        },
        optionGroup: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
        },
    };

    return (
        <footer style={styles.footer}>
            <div style={styles.options}>
                <div style={styles.optionGroup}>
                    <ScaleSelector value={exportScale} onChange={onScaleChange} />
                </div>

                <div style={styles.optionGroup}>
                    <TransparentToggle value={bgTransparent} onChange={onTransparentChange} />
                </div>
            </div>

            <ExportButton
                onClick={onExport}
                disabled={!canExport}
                isExporting={isExporting}
                success={exportSuccess}
            />
        </footer>
    );
}
