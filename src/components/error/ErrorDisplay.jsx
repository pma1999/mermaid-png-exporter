import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Componente para mostrar errores de forma detallada con auto-fix (Responsive)
 * @param {Object} props
 * @param {Object} props.errorInfo - Información del error parseada
 * @param {string} props.code - Código actual
 * @param {Function} props.onAutoFix - Handler de auto-fix
 * @param {boolean} props.isMobile - Is mobile viewport
 */
export function ErrorDisplay({ errorInfo, code, onAutoFix, isMobile = false }) {
    const [expanded, setExpanded] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const { colors } = useTheme();

    if (!errorInfo) return null;

    const hasDetails = errorInfo.lineNumber || errorInfo.pattern || errorInfo.issues?.length > 0;

    const styles = {
        container: {
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: isMobile ? '10px' : '12px',
            padding: isMobile ? '12px' : '16px',
            maxWidth: isMobile ? '100%' : '650px',
            width: '100%',
            animation: 'fadeIn 0.3s ease-out',
        },
        header: {
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'flex-start',
            gap: isMobile ? '10px' : '12px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
        },
        iconContainer: {
            flexShrink: 0,
            marginTop: '2px',
        },
        titleSection: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: 0, // Allow text truncation
        },
        title: {
            color: '#fca5a5',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '600',
            lineHeight: '1.3',
            wordBreak: 'break-word',
        },
        lineIndicator: {
            display: 'inline-block',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            fontSize: isMobile ? '10px' : '11px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            width: 'fit-content',
        },
        buttonsRow: {
            display: 'flex',
            gap: '8px',
            width: isMobile ? '100%' : 'auto',
            marginTop: isMobile ? '8px' : '0',
        },
        autoFixButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '10px 14px' : '8px 16px',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '600',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            flexShrink: 0,
            flex: isMobile ? 1 : 'none',
            justifyContent: 'center',
            minHeight: '44px',
        },
        expandButton: {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: isMobile ? '10px' : '6px',
            cursor: 'pointer',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            minWidth: '44px',
            minHeight: '44px',
        },
        details: {
            marginTop: isMobile ? '12px' : '16px',
            paddingTop: isMobile ? '12px' : '16px',
            borderTop: '1px solid rgba(239, 68, 68, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '10px' : '14px',
        },
        section: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        sectionLabel: {
            color: '#a1a1aa',
            fontSize: isMobile ? '10px' : '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        codeBlock: {
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: isMobile ? '8px 10px' : '10px 12px',
            fontSize: isMobile ? '11px' : '12px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#fca5a5',
            overflowX: 'auto',
            whiteSpace: 'pre',
            WebkitOverflowScrolling: 'touch',
        },
        explanation: {
            color: '#d4d4d8',
            fontSize: isMobile ? '12px' : '13px',
            lineHeight: '1.5',
            margin: 0,
        },
        suggestion: {
            color: '#a3e635',
            fontSize: isMobile ? '12px' : '13px',
            lineHeight: '1.5',
            margin: 0,
            background: 'rgba(163, 230, 53, 0.1)',
            padding: isMobile ? '8px 10px' : '10px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(163, 230, 53, 0.2)',
        },
        issuesList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        issueItem: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '10px',
            fontSize: isMobile ? '11px' : '12px',
        },
        issueLine: {
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isMobile ? '10px' : '11px',
            fontWeight: '600',
        },
        issueDesc: {
            color: '#d4d4d8',
        },
        issueMore: {
            color: '#71717a',
            fontSize: isMobile ? '10px' : '11px',
            fontStyle: 'italic',
        },
        previewToggle: {
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            fontSize: isMobile ? '11px' : '12px',
            cursor: 'pointer',
            padding: '4px 0',
            textAlign: 'left',
            fontFamily: 'inherit',
        },
        previewContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '8px',
            maxHeight: isMobile ? '150px' : '200px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
        },
        previewItem: {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            padding: isMobile ? '8px' : '10px',
            fontSize: isMobile ? '10px' : '11px',
            fontFamily: "'JetBrains Mono', monospace",
        },
        previewHeader: {
            color: '#71717a',
            marginBottom: '6px',
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: '600',
        },
        previewOld: {
            display: 'flex',
            gap: '8px',
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '6px 8px',
            borderRadius: '4px',
            marginBottom: '4px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
        },
        previewNew: {
            display: 'flex',
            gap: '8px',
            color: '#86efac',
            background: 'rgba(34, 197, 94, 0.1)',
            padding: '6px 8px',
            borderRadius: '4px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
        },
        previewLabel: {
            fontWeight: 'bold',
            flexShrink: 0,
        },
        technicalDetails: {
            marginTop: '8px',
        },
        technicalSummary: {
            color: '#71717a',
            fontSize: isMobile ? '10px' : '11px',
            cursor: 'pointer',
            userSelect: 'none',
        },
        technicalMessage: {
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '6px',
            padding: isMobile ? '10px' : '12px',
            fontSize: isMobile ? '10px' : '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#a1a1aa',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginTop: '8px',
            maxHeight: isMobile ? '100px' : '150px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
        },
        compactHint: {
            color: '#a1a1aa',
            fontSize: isMobile ? '11px' : '12px',
            marginTop: '8px',
            marginBottom: 0,
            marginLeft: isMobile ? '0' : '34px',
            lineHeight: '1.4',
        },
    };

    return (
        <div style={styles.container}>
            {/* Header del error */}
            <div style={styles.header}>
                <div style={styles.iconContainer}>
                    <svg width={isMobile ? '20' : '22'} height={isMobile ? '20' : '22'} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <div style={styles.titleSection}>
                    <span style={styles.title}>{errorInfo.summary}</span>
                    {errorInfo.lineNumber && (
                        <span style={styles.lineIndicator}>Línea {errorInfo.lineNumber}</span>
                    )}
                </div>

                {/* Buttons row - wraps on mobile */}
                <div style={styles.buttonsRow}>
                    {/* Botón de Auto-Fix prominente */}
                    {errorInfo.canAutoFix && (
                        <button
                            onClick={onAutoFix}
                            style={styles.autoFixButton}
                            title="Corregir automáticamente todos los problemas detectados"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                            {isMobile ? 'Fix' : 'Auto-Fix'}
                        </button>
                    )}

                    {hasDetails && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={styles.expandButton}
                            title={expanded ? 'Ocultar detalles' : 'Ver detalles'}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Detalles expandibles */}
            {expanded && hasDetails && (
                <div style={styles.details}>
                    {/* Línea problemática */}
                    {errorInfo.errorLine && (
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>Código problemático:</span>
                            <code style={styles.codeBlock}>{errorInfo.errorLine.trim()}</code>
                        </div>
                    )}

                    {/* Explicación */}
                    {errorInfo.pattern && (
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>¿Qué ocurre?</span>
                            <p style={styles.explanation}>{errorInfo.pattern.explanation}</p>
                        </div>
                    )}

                    {/* Problemas detectados */}
                    {errorInfo.issues?.length > 0 && (
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>
                                Problemas detectados ({errorInfo.issues.length}):
                            </span>
                            <div style={styles.issuesList}>
                                {errorInfo.issues.slice(0, isMobile ? 3 : 5).map((issue, idx) => (
                                    <div key={idx} style={styles.issueItem}>
                                        <span style={styles.issueLine}>L{issue.line}</span>
                                        <span style={styles.issueDesc}>{issue.description}</span>
                                    </div>
                                ))}
                                {errorInfo.issues.length > (isMobile ? 3 : 5) && (
                                    <span style={styles.issueMore}>
                                        +{errorInfo.issues.length - (isMobile ? 3 : 5)} más...
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview de cambios */}
                    {errorInfo.canAutoFix && errorInfo.autoFixPreview?.length > 0 && (
                        <div style={styles.section}>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                style={styles.previewToggle}
                            >
                                {showPreview ? '▼' : '▶'} Ver cambios que se aplicarán ({errorInfo.autoFixPreview.length})
                            </button>

                            {showPreview && (
                                <div style={styles.previewContainer}>
                                    {errorInfo.autoFixPreview.map((fix, idx) => (
                                        <div key={idx} style={styles.previewItem}>
                                            <div style={styles.previewHeader}>Línea {fix.line}</div>
                                            <div style={styles.previewOld}>
                                                <span style={styles.previewLabel}>−</span>
                                                <code>{fix.original}</code>
                                            </div>
                                            <div style={styles.previewNew}>
                                                <span style={styles.previewLabel}>+</span>
                                                <code>{fix.fixed}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sugerencia */}
                    {errorInfo.pattern?.suggestion && (
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>💡 Sugerencia:</span>
                            <p style={styles.suggestion}>{errorInfo.pattern.suggestion}</p>
                        </div>
                    )}

                    {/* Mensaje técnico original */}
                    <details style={styles.technicalDetails}>
                        <summary style={styles.technicalSummary}>Ver mensaje técnico completo</summary>
                        <pre style={styles.technicalMessage}>{errorInfo.message}</pre>
                    </details>
                </div>
            )}

            {/* Mensaje compacto cuando no está expandido */}
            {!expanded && errorInfo.pattern?.explanation && (
                <p style={styles.compactHint}>{errorInfo.pattern.explanation}</p>
            )}
        </div>
    );
}
