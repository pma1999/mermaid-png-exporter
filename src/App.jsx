import { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useMermaidRenderer } from './hooks/useMermaidRenderer';
import { useExportPNG } from './hooks/useExportPNG';
import { autoFixMermaidCode } from './utils/mermaidAutoFix';
import { DEFAULT_DIAGRAMS } from './config/mermaid.config';
import { translations } from './i18n';

import { Header, Footer } from './components/layout';
import { EditorPanel } from './components/editor';
import { PreviewPanel } from './components/preview';

// Icons for mobile tab bar
const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Mobile Tab Bar Component
 */
function MobileTabBar({ activePanel, onPanelChange, colors, t }) {
  const tabs = [
    { id: 'editor', label: t('tabs.code'), icon: <CodeIcon /> },
    { id: 'preview', label: t('tabs.preview'), icon: <EyeIcon /> },
  ];

  const styles = {
    container: {
      display: 'flex',
      background: colors.bgHover,
      borderBottom: `1px solid ${colors.borderPrimary}`,
      padding: 0,
      gap: 0,
    },
    tab: {
      flex: 1,
      padding: '14px 16px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minHeight: '48px',
      color: colors.textMuted,
    },
    tabActive: {
      borderBottomColor: '#6366f1',
      color: '#6366f1',
    },
  };

  return (
    <div style={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onPanelChange(tab.id)}
          style={{
            ...styles.tab,
            ...(activePanel === tab.id ? styles.tabActive : {}),
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Componente principal de la aplicación
 * Mermaid → PNG Exporter
 */
export default function App() {
  // Language hook first to get initial language for default code
  const { t, language } = useLanguage();

  // Estado principal - use localized default diagram
  const [code, setCode] = useState(() => {
    // Get initial language from localStorage or browser detection  
    const storedLang = localStorage.getItem('mermaid-exporter-language');
    const browserLang = navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
    const initialLang = storedLang || browserLang;
    return DEFAULT_DIAGRAMS[initialLang] || DEFAULT_DIAGRAMS.en;
  });
  const [exportScale, setExportScale] = useState(3);
  const [bgTransparent, setBgTransparent] = useState(false);
  const [activePanel, setActivePanel] = useState('preview'); // Default to preview on mobile

  // Hooks
  const { theme, colors } = useTheme();
  const { isMobile, isTablet } = useMediaQuery();
  const {
    previewRef,
    error,
    errorInfo,
    isRendering,
    clearErrors
  } = useMermaidRenderer(code);

  const {
    exportToPNG,
    isExporting,
    exportSuccess
  } = useExportPNG(previewRef);

  // Track previous language to detect changes
  const prevLanguageRef = useRef(language);

  // Smart example sync: when language changes, update code if it's an unmodified example
  useEffect(() => {
    // Skip on initial render
    if (prevLanguageRef.current === language) return;

    const prevLang = prevLanguageRef.current;
    const newLang = language;
    prevLanguageRef.current = language;

    // Normalize code for comparison (trim whitespace)
    const normalizedCode = code.trim();

    // Check if current code matches any example from the PREVIOUS language
    const prevTranslations = translations[prevLang];
    const newTranslations = translations[newLang];

    if (!prevTranslations?.examples || !newTranslations?.examples) return;

    // Also check default diagrams
    if (normalizedCode === DEFAULT_DIAGRAMS[prevLang]?.trim()) {
      setCode(DEFAULT_DIAGRAMS[newLang]);
      return;
    }

    // Check each example type
    for (const [exampleType, exampleCode] of Object.entries(prevTranslations.examples)) {
      if (normalizedCode === exampleCode.trim()) {
        // Found a match! Replace with the same example in the new language
        const newExampleCode = newTranslations.examples[exampleType];
        if (newExampleCode) {
          setCode(newExampleCode);
        }
        return;
      }
    }
    // If no match found, keep current code (user has modified it)
  }, [language, code]);

  // Handlers
  const handleAutoFix = useCallback(() => {
    const result = autoFixMermaidCode(code);
    if (result.hasChanges) {
      clearErrors();
      setCode(result.code);
    }
  }, [code, clearErrors]);

  const handleExport = useCallback(() => {
    exportToPNG({ scale: exportScale, transparent: bgTransparent });
  }, [exportToPNG, exportScale, bgTransparent]);

  // Determinar si se puede exportar
  const canExport = !isRendering && !errorInfo && code.trim().length > 0;

  // Responsive styles
  const getMainStyles = () => {
    // Base styles for all layouts - minHeight: 0 is critical for flex shrinking
    const baseStyles = {
      flex: 1,
      overflow: 'hidden',
      animation: 'fadeIn 0.5s ease-out',
      // Critical: allows flex item to shrink below content size
      minHeight: 0,
    };

    // Mobile: Single panel (tab-based)
    if (isMobile) {
      return {
        ...baseStyles,
        display: 'flex',
        flexDirection: 'column',
      };
    }

    // Tablet: Stacked vertical
    if (isTablet) {
      return {
        ...baseStyles,
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gap: '1px',
        background: colors.borderPrimary,
      };
    }

    // Desktop: Side by side
    return {
      ...baseStyles,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1px',
      background: colors.borderPrimary,
    };
  };

  // Container styles
  const styles = {
    container: {
      // Use dvh (dynamic viewport height) with fallbacks for maximum compatibility
      // This handles mobile browser chrome (address bar) correctly
      minHeight: '100vh',
      height: '100vh',
      // Modern browsers: use dynamic viewport height
      ...(typeof CSS !== 'undefined' && CSS.supports && CSS.supports('height', '100dvh')
        ? { height: '100dvh', minHeight: '100dvh' }
        : {}),
      maxHeight: '-webkit-fill-available', // iOS Safari fix
      background: theme === 'dark'
        ? `linear-gradient(135deg, ${colors.bgPrimary} 0%, #13131a 50%, ${colors.bgPrimary} 100%)`
        : `linear-gradient(135deg, ${colors.bgPrimary} 0%, #e2e8f0 50%, ${colors.bgPrimary} 100%)`,
      fontFamily: "'Outfit', -apple-system, sans-serif",
      color: colors.textPrimary,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.3s ease, color 0.3s ease',
    },
    panelContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      // Ensure content can shrink to make room for footer
      minHeight: 0,
    },
  };

  // CSS dinámico para scrollbars y theme
  const dynamicCSS = `
    body {
      background: ${colors.bgPrimary};
    }
    ::-webkit-scrollbar-track {
      background: ${colors.scrollTrack};
    }
    ::-webkit-scrollbar-thumb {
      background: ${colors.scrollThumb};
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${colors.scrollThumbHover};
    }
    
    /* Mobile tab bar colors (CSS custom properties for theming) */
    .mobile-tab-bar button.active {
      border-bottom-color: #6366f1;
      color: #6366f1;
    }
  `;

  // Render mobile layout with tabs
  // IMPORTANT: Both panels stay mounted to preserve previewRef and rendered SVG
  // Visibility is controlled via CSS to avoid re-rendering Mermaid when switching tabs
  const renderMobileLayout = () => (
    <>
      <MobileTabBar
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        colors={colors}
        t={t}
      />
      <div style={styles.panelContainer}>
        {/* Editor Panel - always mounted, visibility controlled by CSS */}
        <div
          style={{
            display: activePanel === 'editor' ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            // Critical: allows flex item to shrink below content size
            minHeight: 0,
          }}
        >
          <EditorPanel
            code={code}
            onCodeChange={setCode}
            isMobile={isMobile}
          />
        </div>
        {/* Preview Panel - always mounted to preserve rendered SVG */}
        <div
          style={{
            display: activePanel === 'preview' ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            // Critical: allows flex item to shrink below content size
            minHeight: 0,
          }}
        >
          <PreviewPanel
            previewRef={previewRef}
            isRendering={isRendering}
            errorInfo={errorInfo}
            code={code}
            onAutoFix={handleAutoFix}
            isMobile={isMobile}
          />
        </div>
      </div>
    </>
  );

  // Render tablet/desktop layout
  const renderDesktopLayout = () => (
    <>
      <EditorPanel
        code={code}
        onCodeChange={setCode}
        isMobile={false}
        isTablet={isTablet}
      />
      <PreviewPanel
        previewRef={previewRef}
        isRendering={isRendering}
        errorInfo={errorInfo}
        code={code}
        onAutoFix={handleAutoFix}
        isMobile={false}
        isTablet={isTablet}
      />
    </>
  );

  return (
    <div className="app-container" style={styles.container}>
      <style>{dynamicCSS}</style>

      <Header isMobile={isMobile} isTablet={isTablet} />

      <main style={getMainStyles()}>
        {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      </main>

      <Footer
        exportScale={exportScale}
        onScaleChange={setExportScale}
        bgTransparent={bgTransparent}
        onTransparentChange={setBgTransparent}
        onExport={handleExport}
        isExporting={isExporting}
        exportSuccess={exportSuccess}
        canExport={canExport}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  );
}