import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import {
    analyzeAllStyles,
    getContrastRatio,
    smartContrastFix,
    updateStyle,
    autoFixAllStyles,
    improveAllStyles,
    COLOR_PALETTES,
    updateSubgraphStyle,
    injectSubgraphTitleCSS,
} from '../../utils/styleParser';

/**
 * StyleEditorDrawer - Interactive style editor for Mermaid styles
 * Supports both classDef and inline style statements
 * Sliding drawer with contrast analysis and color palette
 */
export function StyleEditorDrawer({ isOpen, onClose, code, onCodeChange }) {
    const { colors, theme } = useTheme();
    const { t } = useLanguage();
    const [allStyles, setAllStyles] = useState([]);
    const [pendingChanges, setPendingChanges] = useState({});
    const drawerRef = useRef(null);

    // Parse all styles (classDef + inline) when code changes
    useEffect(() => {
        if (code) {
            setAllStyles(analyzeAllStyles(code));
        }
    }, [code]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Calculate issues count (FAIL) and improvable count (AA)
    const issueCount = allStyles.filter(s => s.needsFix).length;
    const improvableCount = allStyles.filter(s => {
        const contrast = getContrastRatio(s.color, s.fill);
        return contrast.level === 'AA';
    }).length;

    // Handle auto-fix single style using SMART algorithm
    const handleFixStyle = (styleItem) => {
        const key = `${styleItem.type}:${styleItem.id}`;

        // Special handling for edgeLabel to force fix
        if (styleItem.type === 'edgeLabel') {
            const updateProps = {
                color: '#000000',
                fill: 'transparent',
                _type: styleItem.type,
                _id: styleItem.id
            };
            // Note: The actual mapping to themeVariables happens in styleParser.js updateStyle
            setPendingChanges(prev => ({
                ...prev,
                [key]: { ...prev[key], ...updateProps }
            }));
            return;
        }

        // Special handling for subgraph titles
        // Mermaid doesn't support per-subgraph title colors via style statements
        // We need to use global CSS injection for title colors
        if (styleItem.type === 'subgraph') {
            const suggestedColor = styleItem.suggestedColor || '#000000';
            
            // Apply fill for background and inject global CSS for title color
            let updatedCode = code;
            
            // Add fill style for the subgraph background
            if (!styleItem.hasExplicitStyle || !styleItem.fill) {
                updatedCode = updateSubgraphStyle(updatedCode, styleItem.id, { fill: '#f5f5f5' });
            }
            
            // Inject global CSS for subgraph title colors
            updatedCode = injectSubgraphTitleCSS(updatedCode, suggestedColor);
            
            // Apply changes directly since CSS injection requires immediate update
            onCodeChange(updatedCode);
            return;
        }

        // Special handling for unstyled nodes
        // Creates a dedicated classDef and assigns it to the node
        if (styleItem.type === 'unstyledNode') {
            const suggestedColor = styleItem.suggestedColor || '#000000';
            
            // Create classDef with proper colors for this node
            const updatedCode = updateStyle(code, styleItem.id, 'unstyledNode', {
                fill: styleItem.fill,
                stroke: styleItem.stroke,
                color: suggestedColor
            });
            
            // Apply changes directly since this creates classDef + class assignment
            onCodeChange(updatedCode);
            return;
        }

        // Use intelligent smart fix for classDef and inline styles
        const smartFix = smartContrastFix(styleItem.fill, styleItem.color);

        if (smartFix.strategy === 'none') return;

        // Apply the optimal fix (either text or fill)
        const updateProps = smartFix.strategy === 'fill'
            ? { fill: smartFix.newColor, _type: styleItem.type, _id: styleItem.id }
            : { color: smartFix.newColor, _type: styleItem.type, _id: styleItem.id };

        setPendingChanges(prev => ({
            ...prev,
            [key]: { ...prev[key], ...updateProps }
        }));
    };

    // Handle fix all issues
    const handleFixAll = () => {
        const { code: newCode, fixes } = autoFixAllStyles(code);
        if (fixes.length > 0) {
            onCodeChange(newCode);
        }
    };

    // Handle improve all (AA → AAA)
    const handleImproveAll = () => {
        const { code: newCode, improvements } = improveAllStyles(code);
        if (improvements.length > 0) {
            onCodeChange(newCode);
        }
    };

    // Apply pending changes
    const handleApply = () => {
        let newCode = code;
        Object.entries(pendingChanges).forEach(([key, change]) => {
            const { _type, _id, ...props } = change;
            newCode = updateStyle(newCode, _id, _type, props);
        });
        onCodeChange(newCode);
        setPendingChanges({});
        onClose();
    };

    // Color palette accent
    const accentColor = theme === 'dark' ? '#a78bfa' : '#7c3aed';
    const accentGlow = theme === 'dark' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(124, 58, 237, 0.2)';

    const styles = {
        // Overlay
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
        },
        // Drawer
        drawer: {
            position: 'fixed',
            top: 0,
            right: 0,
            width: '400px',
            maxWidth: '100vw',
            height: '100%',
            background: theme === 'dark'
                ? 'linear-gradient(180deg, #0f0f18 0%, #0a0a10 100%)'
                : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            borderLeft: `1px solid ${colors.borderPrimary}`,
            boxShadow: theme === 'dark'
                ? '-8px 0 32px rgba(0, 0, 0, 0.5)'
                : '-8px 0 32px rgba(0, 0, 0, 0.1)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        // Header
        header: {
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.borderPrimary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: colors.bgHover,
        },
        title: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '16px',
            fontWeight: '600',
            color: colors.textPrimary,
        },
        titleIcon: {
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: `0 4px 12px ${accentGlow}`,
        },
        closeButton: {
            background: 'transparent',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
        },
        // Content
        content: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
        },
        classCount: {
            fontSize: '13px',
            color: colors.textMuted,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        issueBadge: {
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
        },
        // Class Card
        classCard: {
            background: colors.bgButton,
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            transition: 'all 0.2s',
        },
        classCardHover: {
            borderColor: accentColor,
            boxShadow: `0 0 0 1px ${accentColor}`,
        },
        classHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
        },
        className: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.textPrimary,
            fontFamily: "'JetBrains Mono', monospace",
        },
        classPreview: {
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: `2px solid ${colors.borderSecondary}`,
        },
        fixButton: {
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
        },
        // Preview Box
        previewBox: {
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '12px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: "'Outfit', sans-serif",
            border: '1px solid rgba(255,255,255,0.1)',
        },
        // Contrast Meter
        contrastMeter: {
            marginBottom: '12px',
        },
        contrastLabel: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '11px',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        contrastValue: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '600',
        },
        meterTrack: {
            height: '6px',
            background: colors.bgHover,
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative',
        },
        meterFill: {
            height: '100%',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
        },
        meterMarkers: {
            position: 'relative',
            height: '12px',
            marginTop: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: colors.textMuted,
        },
        // Color Editor Section
        colorSection: {
            display: 'flex',
            gap: '12px',
        },
        colorField: {
            flex: 1,
        },
        colorLabel: {
            fontSize: '11px',
            color: colors.textMuted,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        colorInputWrapper: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        colorSwatch: {
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: `2px solid ${colors.borderSecondary}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        colorHexInput: {
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${colors.borderPrimary}`,
            background: colors.bgInput || 'transparent',
            color: colors.textPrimary,
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            transition: 'border-color 0.2s',
        },
        // Color Palette
        palettePopover: {
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: theme === 'dark' ? '#1a1a24' : '#ffffff',
            border: `1px solid ${colors.borderSecondary}`,
            borderRadius: '12px',
            padding: '12px',
            boxShadow: theme === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 10,
            width: '240px',
        },
        paletteTitle: {
            fontSize: '10px',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            fontWeight: '600',
        },
        paletteGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '6px',
            marginBottom: '12px',
        },
        paletteColor: {
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
        },
        paletteColorHover: {
            transform: 'scale(1.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        },
        // Footer Actions
        footer: {
            padding: '16px 24px',
            borderTop: `1px solid ${colors.borderPrimary}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            background: colors.bgHover,
        },
        actionButton: {
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
        },
        fixAllButton: {
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
        },
        applyButton: {
            background: `linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%)`,
            border: 'none',
            color: 'white',
            boxShadow: `0 4px 16px ${accentGlow}`,
        },
        // Empty State
        emptyState: {
            textAlign: 'center',
            padding: '40px 20px',
            color: colors.textMuted,
        },
        emptyIcon: {
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            opacity: 0.5,
        },
    };

    // Get contrast color and icon
    const getContrastIndicator = (level, ratio) => {
        if (level === 'AAA') return { color: '#22c55e', icon: '✓', text: 'AAA' };
        if (level === 'AA') return { color: '#fbbf24', icon: '●', text: 'AA' };
        return { color: '#ef4444', icon: '✕', text: 'FAIL' };
    };

    // Calculate meter fill percentage (0-21 ratio mapped to 0-100%)
    const getMeterWidth = (ratio) => Math.min(100, (ratio / 21) * 100);

    // Render style card (works for classDef, inline, subgraph, and edge labels)
    const renderStyleCard = (styleItem) => {
        const key = `${styleItem.type}:${styleItem.id}`;
        const fill = pendingChanges[key]?.fill || styleItem.fill;
        const color = pendingChanges[key]?.color || styleItem.color;

        // Special handling for edge labels (global)
        if (styleItem.type === 'edgeLabel') {
            return renderEdgeLabelCard(styleItem, key, fill, color);
        }

        // Special handling for subgraph titles
        if (styleItem.type === 'subgraph') {
            return renderSubgraphCard(styleItem, key, fill, color);
        }

        // Special handling for unstyled nodes
        if (styleItem.type === 'unstyledNode') {
            return renderUnstyledNodeCard(styleItem, key, fill, color);
        }

        const { ratio, level } = getContrastRatio(color, fill);
        const indicator = getContrastIndicator(level, ratio);

        // Type badge styling
        const typeBadge = styleItem.type === 'inline'
            ? { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', text: 'style' }
            : { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', text: 'classDef' };

        return (
            <div key={key} style={styles.classCard}>
                <div style={styles.classHeader}>
                    <div style={styles.className}>
                        <div style={{ ...styles.classPreview, background: fill }} />
                        <span>{styleItem.id}</span>
                        <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: typeBadge.bg,
                            color: typeBadge.color,
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>{typeBadge.text}</span>
                    </div>
                    {/* Fix button for FAIL, Improve button for AA */}
                    {level === 'FAIL' && (
                        <button
                            style={styles.fixButton}
                            onClick={() => handleFixStyle(styleItem)}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                            {t('styleEditor.autoFix')}
                        </button>
                    )}
                    {level === 'AA' && (
                        <button
                            style={{
                                ...styles.fixButton,
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#6366f1',
                            }}
                            onClick={() => handleFixStyle(styleItem)}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            → AAA
                        </button>
                    )}
                </div>

                {/* Preview Box */}
                <div style={{ ...styles.previewBox, background: fill, color: color }}>
                    {t('styleEditor.sampleText')}
                </div>

                {/* Contrast Meter */}
                <div style={styles.contrastMeter}>
                    <div style={styles.contrastLabel}>
                        <span>{t('styleEditor.contrast')}</span>
                        <span style={{ ...styles.contrastValue, color: indicator.color }}>
                            {ratio}:1 {indicator.icon} {indicator.text}
                        </span>
                    </div>
                    <div style={styles.meterTrack}>
                        <div
                            style={{
                                ...styles.meterFill,
                                width: `${getMeterWidth(ratio)}%`,
                                background: level === 'FAIL'
                                    ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
                                    : level === 'AA'
                                        ? 'linear-gradient(90deg, #fbbf24 0%, #fcd34d 100%)'
                                        : 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                            }}
                        />
                    </div>
                    <div style={styles.meterMarkers}>
                        <span>1</span>
                        <span style={{ position: 'absolute', left: '21%' }}>4.5</span>
                        <span style={{ position: 'absolute', left: '33%' }}>7</span>
                        <span>21+</span>
                    </div>
                </div>

                {/* Color Editors */}
                <div style={styles.colorSection}>
                    <ColorField
                        label={t('styleEditor.fill')}
                        value={fill}
                        onChange={(newFill) => setPendingChanges(prev => ({
                            ...prev,
                            [key]: { ...prev[key], fill: newFill, _type: styleItem.type, _id: styleItem.id }
                        }))}
                        palette={COLOR_PALETTES.lightFills.concat(COLOR_PALETTES.darkFills)}
                        colors={colors}
                        theme={theme}
                    />
                    <ColorField
                        label={t('styleEditor.textColor')}
                        value={color}
                        onChange={(newColor) => setPendingChanges(prev => ({
                            ...prev,
                            [key]: { ...prev[key], color: newColor, _type: styleItem.type, _id: styleItem.id }
                        }))}
                        palette={COLOR_PALETTES.textColors}
                        colors={colors}
                        theme={theme}
                    />
                </div>
            </div>
        );
    };

    // Special card renderer for Edge Labels
    const renderEdgeLabelCard = (styleItem, key, fill, color) => {
        const { ratio, level } = getContrastRatio(color, fill);
        const indicator = getContrastIndicator(level, ratio);
        const isFixed = styleItem.isFixedByCSS || level !== 'FAIL';

        return (
            <div key={key} style={{ 
                ...styles.classCard, 
                borderLeft: `4px solid ${isFixed ? '#22c55e' : '#f59e0b'}` 
            }}>
                <div style={styles.classHeader}>
                    <div style={styles.className}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            background: isFixed ? '#dcfce7' : '#fef3c7',
                            borderRadius: '6px',
                            color: isFixed ? '#16a34a' : '#d97706'
                        }}>
                            {isFixed ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            )}
                        </div>
                        <span>Edge Labels (Global)</span>
                        <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isFixed ? '#dcfce7' : '#fffbeb',
                            color: isFixed ? '#16a34a' : '#b45309',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>{isFixed ? 'FIXED' : `ALL ${styleItem.count} LABELS`}</span>
                    </div>

                    {!isFixed && (
                        <button
                            style={{
                                ...styles.fixButton,
                                background: '#fff7ed',
                                border: '1px solid #fdba74',
                                color: '#ea580c'
                            }}
                            onClick={() => handleFixStyle(styleItem)}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            {t('styleEditor.autoFix')}
                        </button>
                    )}
                </div>

                {/* Success message for fixed edge labels */}
                {styleItem.isFixedByCSS && (
                    <div style={{
                        fontSize: '11px',
                        color: '#4ade80',
                        marginBottom: '12px',
                        padding: '8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {t('styleEditor.fixedViaCSS') || 'Fixed via CSS injection'}
                    </div>
                )}

                <div style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '12px',
                    padding: '8px',
                    background: colors.bgHover,
                    borderRadius: '6px'
                }}>
                    {styleItem.description || 'Fix visibility for all edge labels'}
                </div>

                {/* Preview Box */}
                <div style={{ ...styles.previewBox, background: fill, color: color, marginBottom: '16px' }}>
                    -- {styleItem.description ? styleItem.description.split('"')[1] : 'Label Text'} --&gt;
                </div>

                {/* Contrast Meter */}
                <div style={styles.contrastMeter}>
                    <div style={styles.contrastLabel}>
                        <span>{t('styleEditor.contrast')}</span>
                        <span style={{ ...styles.contrastValue, color: indicator.color }}>
                            {ratio}:1 {indicator.icon} {indicator.text}
                        </span>
                    </div>
                    <div style={styles.meterTrack}>
                        <div
                            style={{
                                ...styles.meterFill,
                                width: `${getMeterWidth(ratio)}%`,
                                background: level === 'FAIL'
                                    ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
                                    : level === 'AA'
                                        ? 'linear-gradient(90deg, #fbbf24 0%, #fcd34d 100%)'
                                        : 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                            }}
                        />
                    </div>
                </div>

            </div>
        );
    };

    // Special card renderer for Subgraph Titles
    const renderSubgraphCard = (styleItem, key, fill, color) => {
        const { ratio, level } = getContrastRatio(color, fill);
        const indicator = getContrastIndicator(level, ratio);
        const hasNoExplicitStyle = !styleItem.hasExplicitStyle && !styleItem.isFixedByCSS;
        const isFixed = styleItem.isFixedByCSS || level !== 'FAIL';

        return (
            <div key={key} style={{ 
                ...styles.classCard, 
                borderLeft: `4px solid ${isFixed ? '#22c55e' : '#8b5cf6'}` 
            }}>
                <div style={styles.classHeader}>
                    <div style={styles.className}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            background: isFixed 
                                ? 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)'
                                : 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
                            borderRadius: '6px',
                            color: isFixed ? '#166534' : '#5b21b6'
                        }}>
                            {isFixed ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                </svg>
                            )}
                        </div>
                        <span>{styleItem.id}</span>
                        <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isFixed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                            color: isFixed ? '#4ade80' : '#a78bfa',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>{isFixed ? 'fixed' : 'subgraph'}</span>
                    </div>

                    {!isFixed && (
                        <button
                            style={{
                                ...styles.fixButton,
                                background: hasNoExplicitStyle ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                border: `1px solid ${hasNoExplicitStyle ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                                color: hasNoExplicitStyle ? '#f87171' : '#a78bfa'
                            }}
                            onClick={() => handleFixStyle(styleItem)}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                            {t('styleEditor.autoFix')}
                        </button>
                    )}
                </div>

                {/* Success message for fixed subgraphs */}
                {styleItem.isFixedByCSS && (
                    <div style={{
                        fontSize: '11px',
                        color: '#4ade80',
                        marginBottom: '12px',
                        padding: '8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {t('styleEditor.fixedViaCSS') || 'Fixed via CSS injection'}
                    </div>
                )}

                {/* Warning for subgraphs without explicit style */}
                {hasNoExplicitStyle && !styleItem.isFixedByCSS && (
                    <div style={{
                        fontSize: '11px',
                        color: '#f87171',
                        marginBottom: '12px',
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        No explicit style defined - title may be invisible on export
                    </div>
                )}

                {/* Title description */}
                <div style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '12px',
                    padding: '8px',
                    background: colors.bgHover,
                    borderRadius: '6px'
                }}>
                    Title: "{styleItem.title}"
                </div>

                {/* Preview Box showing the subgraph title */}
                <div style={{ 
                    ...styles.previewBox, 
                    background: fill, 
                    color: color, 
                    marginBottom: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${styleItem.stroke || '#333'}`,
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '12px',
                        background: fill,
                        padding: '0 8px',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}>
                        {styleItem.title.length > 25 ? styleItem.title.slice(0, 25) + '...' : styleItem.title}
                    </div>
                    <div style={{ marginTop: '8px', opacity: 0.5, fontSize: '11px' }}>
                        (subgraph content)
                    </div>
                </div>

                {/* Contrast Meter */}
                <div style={styles.contrastMeter}>
                    <div style={styles.contrastLabel}>
                        <span>{t('styleEditor.contrast')}</span>
                        <span style={{ ...styles.contrastValue, color: indicator.color }}>
                            {ratio}:1 {indicator.icon} {indicator.text}
                        </span>
                    </div>
                    <div style={styles.meterTrack}>
                        <div
                            style={{
                                ...styles.meterFill,
                                width: `${getMeterWidth(ratio)}%`,
                                background: level === 'FAIL'
                                    ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
                                    : level === 'AA'
                                        ? 'linear-gradient(90deg, #fbbf24 0%, #fcd34d 100%)'
                                        : 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                            }}
                        />
                    </div>
                    <div style={styles.meterMarkers}>
                        <span>1</span>
                        <span style={{ position: 'absolute', left: '21%' }}>4.5</span>
                        <span style={{ position: 'absolute', left: '33%' }}>7</span>
                        <span>21+</span>
                    </div>
                </div>

                {/* Color Editors */}
                <div style={styles.colorSection}>
                    <ColorField
                        label={t('styleEditor.fill')}
                        value={fill}
                        onChange={(newFill) => setPendingChanges(prev => ({
                            ...prev,
                            [key]: { ...prev[key], fill: newFill, _type: styleItem.type, _id: styleItem.id }
                        }))}
                        palette={COLOR_PALETTES.lightFills.concat(COLOR_PALETTES.darkFills)}
                        colors={colors}
                        theme={theme}
                    />
                    <ColorField
                        label={t('styleEditor.textColor')}
                        value={color}
                        onChange={(newColor) => setPendingChanges(prev => ({
                            ...prev,
                            [key]: { ...prev[key], color: newColor, _type: styleItem.type, _id: styleItem.id }
                        }))}
                        palette={COLOR_PALETTES.textColors}
                        colors={colors}
                        theme={theme}
                    />
                </div>
            </div>
        );
    };

    // Special card renderer for Unstyled Nodes
    const renderUnstyledNodeCard = (styleItem, key, fill, color) => {
        const { ratio, level } = getContrastRatio(color, fill);
        const indicator = getContrastIndicator(level, ratio);

        return (
            <div key={key} style={{ 
                ...styles.classCard, 
                borderLeft: `4px solid #f59e0b`,
                background: theme === 'dark' 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)'
            }}>
                <div style={styles.classHeader}>
                    <div style={styles.className}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                            borderRadius: '6px',
                            color: '#78350f'
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                        <span>{styleItem.id}</span>
                        <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>unstyled</span>
                    </div>

                    <button
                        style={{
                            ...styles.fixButton,
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#f59e0b'
                        }}
                        onClick={() => handleFixStyle(styleItem)}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        {t('styleEditor.autoFix')}
                    </button>
                </div>

                {/* Info banner explaining what will happen */}
                <div style={{
                    fontSize: '11px',
                    color: '#d97706',
                    marginBottom: '12px',
                    padding: '10px 12px',
                    background: theme === 'dark' 
                        ? 'rgba(245, 158, 11, 0.1)' 
                        : 'rgba(245, 158, 11, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    lineHeight: '1.4'
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>
                        {t('styleEditor.unstyledNodeInfo') || 'This node has no style. Fixing will create a dedicated class to ensure visibility.'}
                    </span>
                </div>

                {/* Current state info */}
                <div style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: colors.bgHover,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    {styleItem.label ? `"${styleItem.label.substring(0, 35)}${styleItem.label.length > 35 ? '...' : ''}"` : `Node ${styleItem.id}`}
                </div>

                {/* Preview Box */}
                <div style={{ ...styles.previewBox, background: fill, color: color }}>
                    {t('styleEditor.sampleText')}
                </div>

                {/* Contrast Meter */}
                <div style={styles.contrastMeter}>
                    <div style={styles.contrastLabel}>
                        <span>{t('styleEditor.contrast')}</span>
                        <span style={{ ...styles.contrastValue, color: indicator.color }}>
                            {ratio}:1 {indicator.icon} {indicator.text}
                        </span>
                    </div>
                    <div style={styles.meterTrack}>
                        <div
                            style={{
                                ...styles.meterFill,
                                width: `${getMeterWidth(ratio)}%`,
                                background: level === 'FAIL'
                                    ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
                                    : level === 'AA'
                                        ? 'linear-gradient(90deg, #fbbf24 0%, #fcd34d 100%)'
                                        : 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                            }}
                        />
                    </div>
                    <div style={styles.meterMarkers}>
                        <span>1</span>
                        <span style={{ position: 'absolute', left: '21%' }}>4.5</span>
                        <span style={{ position: 'absolute', left: '33%' }}>7</span>
                        <span>21+</span>
                    </div>
                </div>

                {/* Color Editors */}
                <div style={styles.colorSection}>
                    <ColorField
                        label={t('styleEditor.fill')}
                        value={fill}
                        onChange={(newFill) => setPendingChanges(prev => ({
                            ...prev,
                            [key]: { ...prev[key], fill: newFill, _type: styleItem.type, _id: styleItem.id }
                        }))}
                        palette={COLOR_PALETTES.lightFills.concat(COLOR_PALETTES.darkFills)}
                        colors={colors}
                        theme={theme}
                    />
                    <ColorField
                        label={t('styleEditor.textColor')}
                        value={color}
                        onChange={(newColor) => setPendingChanges(prev => ({
                            ...prev,
                            [key]: { ...prev[key], color: newColor, _type: styleItem.type, _id: styleItem.id }
                        }))}
                        palette={COLOR_PALETTES.textColors}
                        colors={colors}
                        theme={theme}
                    />
                </div>
            </div>
        );
    };

    const hasPendingChanges = Object.keys(pendingChanges).length > 0;
    const stylesCount = allStyles.length;

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div style={styles.overlay} onClick={onClose} />

            {/* Drawer */}
            <div ref={drawerRef} style={styles.drawer}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.title}>
                        <div style={styles.titleIcon}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="13.5" cy="6.5" r="2.5" />
                                <circle cx="17.5" cy="10.5" r="2.5" />
                                <circle cx="8.5" cy="7.5" r="2.5" />
                                <circle cx="6.5" cy="12.5" r="2.5" />
                                <path d="M12 22v-6" />
                                <path d="M12 13V7" />
                            </svg>
                        </div>
                        {t('styleEditor.title')}
                    </div>
                    <button
                        style={styles.closeButton}
                        onClick={onClose}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.bgButton}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {stylesCount > 0 ? (
                        <>
                            <div style={styles.classCount}>
                                {stylesCount} {t('styleEditor.classesFound')}
                                {issueCount > 0 && (
                                    <span style={styles.issueBadge}>
                                        ⚠ {issueCount} {t('styleEditor.issues')}
                                    </span>
                                )}
                            </div>

                            {allStyles.map(styleItem => renderStyleCard(styleItem))}
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4m0 4h.01" />
                            </svg>
                            <p>{t('styleEditor.noClasses')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {stylesCount > 0 && (
                    <div style={styles.footer}>
                        {/* Pending Changes Banner */}
                        {hasPendingChanges && (
                            <div style={{
                                width: '100%',
                                padding: '10px 12px',
                                marginBottom: '12px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '8px',
                                color: '#22c55e',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                {Object.keys(pendingChanges).length} changes ready to apply
                            </div>
                        )}

                        {issueCount > 0 && (
                            <button
                                style={{ ...styles.actionButton, ...styles.fixAllButton }}
                                onClick={handleFixAll}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                                {t('styleEditor.fixAll')}
                            </button>
                        )}
                        {improvableCount > 0 && (
                            <button
                                style={{
                                    ...styles.actionButton,
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: '#6366f1',
                                }}
                                onClick={handleImproveAll}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                {t('styleEditor.improveAll')}
                            </button>
                        )}
                        <button
                            style={{
                                ...styles.actionButton,
                                ...styles.applyButton,
                                opacity: hasPendingChanges ? 1 : 0.5,
                                cursor: hasPendingChanges ? 'pointer' : 'not-allowed',
                                animation: hasPendingChanges ? 'pulse 2s ease-in-out infinite' : 'none',
                            }}
                            onClick={handleApply}
                            disabled={!hasPendingChanges}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {t('styleEditor.apply')}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

// =============================================================================
// COLOR UTILITIES FOR PICKER
// =============================================================================

const hexToHsl = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 50, l: 50 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
            default: h = 0;
        }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

// Curated palettes organized by category
const CURATED_PALETTES = {
    diagram: {
        label: 'Diagram',
        colors: [
            '#1a1a2e', '#16213e', '#0f3460', '#2c3e50', '#1e272e',
            '#2d3436', '#353b48', '#1b4332', '#7f1d1d', '#4a0e4e',
        ]
    },
    pastel: {
        label: 'Pastel',
        colors: [
            '#e1f5fe', '#e8f5e9', '#fff3e0', '#f3e5f5', '#ffebee',
            '#fff8e1', '#e0f7fa', '#fce4ec', '#f1f8e9', '#eceff1',
        ]
    },
    vibrant: {
        label: 'Vibrant',
        colors: [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
            '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
        ]
    },
    neutral: {
        label: 'Neutral',
        colors: [
            '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b',
            '#475569', '#334155', '#1e293b', '#0f172a', '#000000',
        ]
    },
};

/**
 * Advanced Color Picker Component
 * Professional color selection with HSL picker, brightness slider, and palettes
 */
function ColorField({ label, value, onChange, palette, colors, theme }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('palette');
    const [hsl, setHsl] = useState(() => hexToHsl(value));
    const [inputValue, setInputValue] = useState(value);
    const containerRef = useRef(null);
    const gradientRef = useRef(null);
    const hueRef = useRef(null);

    // Sync HSL when value prop changes
    useEffect(() => {
        setHsl(hexToHsl(value));
        setInputValue(value);
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Handle gradient click (saturation/lightness)
    const handleGradientClick = (e) => {
        if (!gradientRef.current) return;
        const rect = gradientRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        const newS = Math.round(x * 100);
        const newL = Math.round((1 - y) * 100);

        const newHsl = { ...hsl, s: newS, l: newL };
        setHsl(newHsl);
        onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
    };

    // Handle hue slider
    const handleHueChange = (e) => {
        const newH = parseInt(e.target.value, 10);
        const newHsl = { ...hsl, h: newH };
        setHsl(newHsl);
        onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
    };

    // Handle brightness slider
    const handleBrightnessChange = (delta) => {
        const newL = Math.max(0, Math.min(100, hsl.l + delta));
        const newHsl = { ...hsl, l: newL };
        setHsl(newHsl);
        onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
    };

    // Handle hex input
    const handleHexInput = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (/^#[0-9a-fA-F]{6}$/i.test(val)) {
            onChange(val.toLowerCase());
        }
    };

    // Accent colors
    const accent = '#a78bfa';
    const accentGlow = 'rgba(167, 139, 250, 0.4)';

    const styles = {
        container: {
            flex: 1,
            position: 'relative',
        },
        label: {
            fontSize: '11px',
            color: colors.textMuted,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            fontWeight: '600',
        },
        trigger: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px',
            borderRadius: '10px',
            border: `1px solid ${isOpen ? accent : colors.borderPrimary}`,
            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isOpen ? `0 0 0 2px ${accentGlow}` : 'none',
        },
        swatch: {
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: value,
            border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            flexShrink: 0,
        },
        hexDisplay: {
            flex: 1,
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            color: colors.textPrimary,
            textTransform: 'uppercase',
        },
        chevron: {
            color: colors.textMuted,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        },
        // Picker popup
        picker: {
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            background: theme === 'dark'
                ? 'linear-gradient(180deg, #18181f 0%, #0f0f14 100%)'
                : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: `1px solid ${colors.borderSecondary}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: theme === 'dark'
                ? '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 16px 48px rgba(0,0,0,0.15)',
            zIndex: 1000,
            width: '260px',
            maxWidth: 'calc(100vw - 48px)',
            animation: 'fadeIn 0.2s ease',
        },
        // Tabs
        tabs: {
            display: 'flex',
            gap: '4px',
            marginBottom: '16px',
            padding: '4px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            borderRadius: '10px',
        },
        tab: {
            flex: 1,
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        tabActive: {
            background: theme === 'dark' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(99, 102, 241, 0.1)',
            color: accent,
        },
        tabInactive: {
            background: 'transparent',
            color: colors.textMuted,
        },
        // HSL Gradient picker
        gradientArea: {
            position: 'relative',
            width: '100%',
            height: '140px',
            borderRadius: '12px',
            cursor: 'crosshair',
            marginBottom: '12px',
            overflow: 'hidden',
        },
        gradientBase: {
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
        },
        gradientWhite: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, #fff, transparent)',
            borderRadius: '12px',
        },
        gradientBlack: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #000, transparent)',
            borderRadius: '12px',
        },
        gradientCursor: {
            position: 'absolute',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
        },
        // Hue slider
        hueSlider: {
            width: '100%',
            height: '14px',
            borderRadius: '7px',
            appearance: 'none',
            background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            cursor: 'pointer',
            marginBottom: '16px',
            outline: 'none',
        },
        // Brightness controls
        brightnessRow: {
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
        },
        brightnessBtn: {
            flex: 1,
            padding: '10px',
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: '10px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            color: colors.textSecondary,
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
        },
        // Hex input
        hexInputRow: {
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
        },
        hexInput: {
            flex: 1,
            padding: '10px 12px',
            borderRadius: '10px',
            border: `1px solid ${colors.borderPrimary}`,
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: colors.textPrimary,
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            outline: 'none',
            textAlign: 'center',
        },
        hexPreview: {
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            border: `2px solid ${colors.borderSecondary}`,
            flexShrink: 0,
        },
        // Palette section
        paletteSection: {
            marginBottom: '12px',
        },
        paletteLabel: {
            fontSize: '10px',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            fontWeight: '600',
        },
        paletteGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '4px',
        },
        paletteColor: {
            aspectRatio: '1',
            borderRadius: '4px',
            border: '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
        },
    };

    const renderHslPicker = () => (
        <>
            {/* Gradient area */}
            <div
                ref={gradientRef}
                style={styles.gradientArea}
                onClick={handleGradientClick}
            >
                <div style={{ ...styles.gradientBase, background: `hsl(${hsl.h}, 100%, 50%)` }} />
                <div style={styles.gradientWhite} />
                <div style={styles.gradientBlack} />
                <div
                    style={{
                        ...styles.gradientCursor,
                        left: `${hsl.s}%`,
                        top: `${100 - hsl.l}%`,
                        background: value,
                    }}
                />
            </div>

            {/* Hue slider */}
            <input
                ref={hueRef}
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={handleHueChange}
                style={styles.hueSlider}
            />

            {/* Brightness controls */}
            <div style={styles.brightnessRow}>
                <button
                    style={styles.brightnessBtn}
                    onClick={() => handleBrightnessChange(-10)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = accent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderPrimary}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    Darker
                </button>
                <button
                    style={styles.brightnessBtn}
                    onClick={() => handleBrightnessChange(10)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = accent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderPrimary}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    Lighter
                </button>
            </div>

            {/* Hex input with preview */}
            <div style={styles.hexInputRow}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleHexInput}
                    style={styles.hexInput}
                    placeholder="#000000"
                    maxLength={7}
                />
                <div style={{ ...styles.hexPreview, background: value }} />
            </div>
        </>
    );

    const renderPalettes = () => (
        <>
            {Object.entries(CURATED_PALETTES).map(([key, cat]) => (
                <div key={key} style={styles.paletteSection}>
                    <div style={styles.paletteLabel}>{cat.label}</div>
                    <div style={styles.paletteGrid}>
                        {cat.colors.map((hex) => (
                            <div
                                key={hex}
                                style={{
                                    ...styles.paletteColor,
                                    background: hex,
                                    borderColor: value === hex ? accent : 'transparent',
                                    transform: value === hex ? 'scale(1.1)' : 'scale(1)',
                                }}
                                onClick={() => {
                                    onChange(hex);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== hex) {
                                        e.currentTarget.style.transform = 'scale(1.15)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== hex) {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div style={styles.container} ref={containerRef}>
            <label style={styles.label}>{label}</label>

            {/* Trigger button */}
            <div
                style={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = colors.borderSecondary;
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = colors.borderPrimary;
                }}
            >
                <div style={styles.swatch} />
                <span style={styles.hexDisplay}>{value}</span>
                <svg style={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* Picker popup */}
            {isOpen && (
                <div style={styles.picker}>
                    {/* Tabs */}
                    <div style={styles.tabs}>
                        <button
                            style={{
                                ...styles.tab,
                                ...(activeTab === 'palette' ? styles.tabActive : styles.tabInactive),
                            }}
                            onClick={() => setActiveTab('palette')}
                        >
                            Palettes
                        </button>
                        <button
                            style={{
                                ...styles.tab,
                                ...(activeTab === 'custom' ? styles.tabActive : styles.tabInactive),
                            }}
                            onClick={() => setActiveTab('custom')}
                        >
                            Custom
                        </button>
                    </div>

                    {/* Content based on active tab */}
                    {activeTab === 'palette' ? renderPalettes() : renderHslPicker()}
                </div>
            )}
        </div>
    );
}
