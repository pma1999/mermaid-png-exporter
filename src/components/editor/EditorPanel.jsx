import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { IconButton } from '../ui';

// Diagram types (labels are not translated as they are Mermaid syntax names)
const DIAGRAM_TYPES = ['flowchart', 'sequence', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap'];

// Icono de copiar
const CopyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

// Icono de check
const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * Panel de editor con textarea y ejemplos (Responsive)
 * @param {Object} props
 * @param {string} props.code - Código actual
 * @param {Function} props.onCodeChange - Handler de cambio de código
 * @param {boolean} props.isMobile - Is mobile viewport
 * @param {boolean} props.isTablet - Is tablet viewport
 */
export function EditorPanel({ code, onCodeChange, isMobile = false, isTablet = false }) {
    const [copied, setCopied] = useState(false);
    const { theme, colors } = useTheme();
    const { t, getTranslations } = useLanguage();

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadExample = (type) => {
        const translations = getTranslations();
        const exampleCode = translations.examples?.[type];
        if (exampleCode) {
            onCodeChange(exampleCode);
        }
    };

    const styles = {
        section: {
            background: colors.bgSecondary,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'background 0.3s ease',
            flex: 1,
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
        examplesBar: {
            padding: isMobile ? '8px 16px' : '12px 20px',
            display: 'flex',
            gap: '8px',
            // Mobile: horizontal scroll instead of wrap
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            overflowY: 'hidden',
            borderBottom: `1px solid ${colors.borderPrimary}`,
            background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            transition: 'background 0.3s ease',
            // Hide scrollbar on mobile for cleaner look
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
        },
        exampleButton: {
            padding: isMobile ? '8px 12px' : '6px 12px',
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '500',
            fontFamily: "'JetBrains Mono', monospace",
            background: colors.bgButton,
            border: `1px solid ${colors.borderSecondary}`,
            borderRadius: '6px',
            color: colors.textSecondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            // Ensure touch target size
            minHeight: isMobile ? '36px' : 'auto',
        },
        textarea: {
            flex: 1,
            background: colors.bgInput,
            border: 'none',
            padding: isMobile ? '16px' : '20px',
            fontSize: isMobile ? '13px' : '14px',
            fontFamily: "'JetBrains Mono', monospace",
            color: colors.textPrimary,
            resize: 'none',
            lineHeight: '1.7',
            letterSpacing: '0.01em',
            transition: 'background 0.3s ease, color 0.3s ease',
        },
    };

    // Hide scrollbar style for examples bar
    const hideScrollbarCSS = isMobile ? `
        .examples-bar::-webkit-scrollbar {
            display: none;
        }
    ` : '';

    return (
        <section style={styles.section}>
            {hideScrollbarCSS && <style>{hideScrollbarCSS}</style>}

            <div style={styles.header}>
                <span style={styles.title}>{t('editor.title')}</span>
                <IconButton
                    onClick={copyCode}
                    icon={copied ? <CheckIcon /> : <CopyIcon />}
                    title={t('editor.copy')}
                />
            </div>

            {/* Examples Bar */}
            <div style={styles.examplesBar} className="examples-bar">
                {DIAGRAM_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => loadExample(type)}
                        style={styles.exampleButton}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                style={styles.textarea}
                placeholder={t('editor.placeholder')}
                spellCheck={false}
            />
        </section>
    );
}

