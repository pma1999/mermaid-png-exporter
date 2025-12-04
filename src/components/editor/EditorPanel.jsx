import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from '../ui';
import { EXAMPLE_DIAGRAMS, DIAGRAM_TYPES } from '../../config/examples';

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
 * Panel de editor con textarea y ejemplos
 * @param {Object} props
 * @param {string} props.code - Código actual
 * @param {Function} props.onCodeChange - Handler de cambio de código
 */
export function EditorPanel({ code, onCodeChange }) {
    const [copied, setCopied] = useState(false);
    const { theme, colors } = useTheme();

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadExample = (type) => {
        onCodeChange(EXAMPLE_DIAGRAMS[type]);
    };

    const styles = {
        section: {
            background: colors.bgSecondary,
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
        examplesBar: {
            padding: "12px 20px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            borderBottom: `1px solid ${colors.borderPrimary}`,
            background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)",
            transition: "background 0.3s ease",
        },
        exampleButton: {
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            fontFamily: "'JetBrains Mono', monospace",
            background: colors.bgButton,
            border: `1px solid ${colors.borderSecondary}`,
            borderRadius: "6px",
            color: colors.textSecondary,
            cursor: "pointer",
            transition: "all 0.2s ease",
        },
        textarea: {
            flex: 1,
            background: colors.bgInput,
            border: "none",
            padding: "20px",
            fontSize: "14px",
            fontFamily: "'JetBrains Mono', monospace",
            color: colors.textPrimary,
            resize: "none",
            lineHeight: "1.7",
            letterSpacing: "0.01em",
            transition: "background 0.3s ease, color 0.3s ease",
        },
    };

    return (
        <section style={styles.section}>
            <div style={styles.header}>
                <span style={styles.title}>Código Mermaid</span>
                <IconButton
                    onClick={copyCode}
                    icon={copied ? <CheckIcon /> : <CopyIcon />}
                    title="Copiar código"
                />
            </div>

            {/* Examples Bar */}
            <div style={styles.examplesBar}>
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
                placeholder="Pega tu código Mermaid aquí..."
                spellCheck={false}
            />
        </section>
    );
}
