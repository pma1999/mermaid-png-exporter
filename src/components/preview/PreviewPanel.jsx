import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { ErrorDisplay } from '../error';
import { VisibilityControls } from './VisibilityControls';

/**
 * Panel de vista previa del diagrama (Responsive)
 * @param {Object} props
 * @param {React.RefObject} props.previewRef - Ref del contenedor de preview
 * @param {boolean} props.isRendering - Estado de renderizado
 * @param {Object} props.errorInfo - Información del error
 * @param {string} props.code - Código actual
 * @param {Function} props.onCodeChange - Handler para cambiar código
 * @param {Function} props.onAutoFix - Handler de auto-fix
 * @param {boolean} props.isMobile - Is mobile viewport
 * @param {boolean} props.isTablet - Is tablet viewport
 */
export function PreviewPanel({
    previewRef,
    isRendering,
    errorInfo,
    code,
    onCodeChange,
    onAutoFix,
    isMobile = false,
    isTablet = false,
}) {
    const { colors } = useTheme();
    const { t } = useLanguage();

    const styles = {
        section: {
            background: colors.bgTertiary,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'background 0.3s ease',
            flex: 1,
            // Critical: allows flex item to shrink below content size
            minHeight: 0,
        },
        header: {
            padding: isMobile ? '10px 16px' : isTablet ? '12px 18px' : '14px 20px',
            borderBottom: `1px solid ${colors.borderPrimary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: colors.bgHover,
            transition: 'background 0.3s ease, border-color 0.3s ease',
        },
        title: {
            fontSize: isMobile ? '11px' : '13px',
            fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        renderingDot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#6366f1',
            animation: 'pulse 1s ease-in-out infinite',
        },
        container: {
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
            backgroundImage: `
                linear-gradient(45deg, ${colors.previewPattern} 25%, transparent 25%),
                linear-gradient(-45deg, ${colors.previewPattern} 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, ${colors.previewPattern} 75%),
                linear-gradient(-45deg, transparent 75%, ${colors.previewPattern} 75%)
            `,
            // Slightly larger pattern on mobile for visibility
            backgroundSize: isMobile ? '16px 16px' : '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            transition: 'background-image 0.3s ease',
            // Enable touch scrolling
            WebkitOverflowScrolling: 'touch',
            // Enable pinch-to-zoom on touch devices
            touchAction: 'pan-x pan-y pinch-zoom',
            // Critical: allows flex item to shrink below content size
            minHeight: 0,
        },
        preview: {
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
    };

    return (
        <section style={styles.section}>
            <div style={styles.header}>
                <span style={styles.title}>
                    {t('preview.title')}
                    {isRendering && <span style={styles.renderingDot} />}
                </span>

                {/* Visibility Controls */}
                <VisibilityControls code={code} onCodeChange={onCodeChange} />
            </div>

            <div style={styles.container}>
                {errorInfo && (
                    <ErrorDisplay
                        errorInfo={errorInfo}
                        code={code}
                        onAutoFix={onAutoFix}
                        isMobile={isMobile}
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

