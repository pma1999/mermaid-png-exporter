import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { fixEdgeVisibility, fixNodeVisibility } from '../../utils/visibilityFixer';

/**
 * Visibility Controls Component
 * Provides a menu to quickly fix visibility issues (contrast) in diagrams.
 * 
 * @param {Object} props
 * @param {string} props.code - Current Mermaid code
 * @param {Function} props.onCodeChange - Function to update code
 */
export function VisibilityControls({ code, onCodeChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const { t } = useLanguage();
    const { colors, theme } = useTheme();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action) => {
        let newCode = code;

        switch (action) {
            case 'edges-dark':
                newCode = fixEdgeVisibility(code, 'dark');
                break;
            case 'edges-light':
                newCode = fixEdgeVisibility(code, 'light');
                break;
            case 'nodes-dark':
                newCode = fixNodeVisibility(code, 'dark');
                break;
            case 'reset':
                // Primitive reset: remove lines starting with linkStyle default or classDef default
                newCode = code.split('\n')
                    .filter(line => !/^\s*(linkStyle|classDef)\s+default/.test(line))
                    .join('\n');
                break;
            default:
                break;
        }

        if (newCode !== code) {
            onCodeChange(newCode);
        }
        setIsOpen(false);
    };

    const styles = {
        container: {
            position: 'relative',
        },
        button: {
            background: 'transparent',
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: colors.textSecondary,
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s',
            outline: 'none',
        },
        buttonIcon: {
            width: '16px',
            height: '16px',
        },
        menu: {
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: theme === 'dark' ? '#1e1e24' : '#ffffff',
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '4px',
            minWidth: '200px',
            zIndex: 50,
            display: isOpen ? 'block' : 'none',
        },
        menuItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            color: colors.textPrimary,
            fontSize: '13px',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.2s', // hover handled by CSS or generic styles
        },
        menuDivider: {
            height: '1px',
            background: colors.borderPrimary,
            margin: '4px 0',
        }
    };

    // Hover styles would ideally be handled by CSS-in-JS or CSS classes, 
    // but for inline simplicity we rely on the clean look.

    return (
        <div style={styles.container} ref={menuRef}>
            <button
                style={styles.button}
                onClick={() => setIsOpen(!isOpen)}
                title={t('visibility.tooltip')}
            >
                {/* Eye/Contrast Icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <path d="M12 17C12 17 8 17 4 17C4 17 4 7 12 7" />
                    <path d="M12 17C12 17 16 17 20 17C20 17 20 7 12 7" strokeOpacity="0.5" />
                    <path d="M4 12H20" strokeOpacity="0.2" />
                </svg>
                {t('visibility.title')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div style={styles.menu}>
                    <button
                        style={styles.menuItem}
                        onClick={() => handleAction('edges-dark')}
                        onMouseEnter={(e) => e.target.style.background = colors.bgHover}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        <span style={{ width: 12, height: 12, background: '#333', borderRadius: '50%', border: '1px solid #fff' }}></span>
                        {t('visibility.fixEdgesDark')}
                    </button>
                    <button
                        style={styles.menuItem}
                        onClick={() => handleAction('edges-light')}
                        onMouseEnter={(e) => e.target.style.background = colors.bgHover}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        <span style={{ width: 12, height: 12, background: '#fff', borderRadius: '50%', border: '1px solid #333' }}></span>
                        {t('visibility.fixEdgesLight')}
                    </button>
                    <div style={styles.menuDivider} />
                    <button
                        style={styles.menuItem}
                        onClick={() => handleAction('reset')}
                        onMouseEnter={(e) => e.target.style.background = colors.bgHover}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        {t('visibility.reset')}
                    </button>
                </div>
            )}
        </div>
    );
}
