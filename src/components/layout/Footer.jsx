import { useTheme } from '../../hooks/useTheme';
import { ScaleSelector, TransparentToggle, ExportButton } from '../ui';

/**
 * Componente de pie de página con controles de exportación (Responsive)
 * @param {Object} props
 * @param {number} props.exportScale - Escala de exportación
 * @param {Function} props.onScaleChange - Handler de cambio de escala
 * @param {boolean} props.bgTransparent - Estado de fondo transparente
 * @param {Function} props.onTransparentChange - Handler de cambio de transparencia
 * @param {Function} props.onExport - Handler de exportación
 * @param {boolean} props.isExporting - Estado de exportación
 * @param {boolean} props.exportSuccess - Estado de éxito
 * @param {boolean} props.canExport - Si se puede exportar
 * @param {boolean} props.isMobile - Is mobile viewport
 * @param {boolean} props.isTablet - Is tablet viewport
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
    isMobile = false,
    isTablet = false,
}) {
    const { colors } = useTheme();

    // Mobile layout: stacked with full-width export button
    // Calculate safe padding for devices with gesture navigation (notch, home indicator)
    const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';

    const styles = {
        footer: {
            // Base padding + safe area for gesture navigation devices
            padding: isMobile
                ? `12px 16px calc(12px + ${safeAreaBottom})`
                : isTablet
                    ? `14px 24px calc(14px + ${safeAreaBottom})`
                    : `16px 32px calc(16px + ${safeAreaBottom})`,
            borderTop: `1px solid ${colors.borderPrimary}`,
            background: colors.bgFooter,
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '12px' : '24px',
            transition: 'background 0.3s ease, border-color 0.3s ease',
            // Ensure footer doesn't shrink
            flexShrink: 0,
        },
        options: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : 'flex-start',
            gap: isMobile ? '16px' : isTablet ? '24px' : '32px',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
        },
        optionGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
        },
    };

    return (
        <footer className="app-footer" style={styles.footer}>
            <div style={styles.options}>
                <div style={styles.optionGroup}>
                    <ScaleSelector
                        value={exportScale}
                        onChange={onScaleChange}
                        isMobile={isMobile}
                    />
                </div>

                <div style={styles.optionGroup}>
                    <TransparentToggle
                        value={bgTransparent}
                        onChange={onTransparentChange}
                        isMobile={isMobile}
                    />
                </div>
            </div>

            <ExportButton
                onClick={onExport}
                disabled={!canExport}
                isExporting={isExporting}
                success={exportSuccess}
                fullWidth={isMobile}
            />
        </footer>
    );
}
