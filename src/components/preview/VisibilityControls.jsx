import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { StyleEditorDrawer } from './StyleEditorDrawer';

/**
 * Style Controls - Interactive Style Editor for Mermaid Diagrams
 * Provides fine-grained control over classDef styles with WCAG contrast analysis.
 */
export function VisibilityControls({ code, onCodeChange }) {
    const { t } = useLanguage();
    const { colors, theme } = useTheme();
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Violet accent for the Style Editor
    const violetAccent = '#a78bfa';
    const violetGlow = 'rgba(167, 139, 250, 0.4)';

    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
        },
        editorButton: {
            background: 'transparent',
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: colors.textSecondary,
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.02em',
        },
    };

    return (
        <div style={styles.container}>
            {/* Style Editor Button */}
            <button
                style={styles.editorButton}
                onClick={() => setIsEditorOpen(true)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = violetAccent;
                    e.currentTarget.style.color = violetAccent;
                    e.currentTarget.style.boxShadow = `0 0 12px ${violetGlow}`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.boxShadow = 'none';
                }}
                title={t('styleEditor.tooltip')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r="2.5" />
                    <circle cx="17.5" cy="10.5" r="2.5" />
                    <circle cx="8.5" cy="7.5" r="2.5" />
                    <circle cx="6.5" cy="12.5" r="2.5" />
                    <path d="M12 22v-6" />
                    <path d="M12 13V7" />
                </svg>
                <span>{t('styleEditor.editStyles')}</span>
            </button>

            {/* Style Editor Drawer */}
            <StyleEditorDrawer
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                code={code}
                onCodeChange={onCodeChange}
            />
        </div>
    );
}
