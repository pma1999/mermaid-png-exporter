import { useState, useCallback } from 'react';
import { DEFAULT_DIAGRAM } from './config/mermaid.config';
import { useTheme } from './hooks/useTheme';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useMermaidRenderer } from './hooks/useMermaidRenderer';
import { useExportPNG } from './hooks/useExportPNG';
import { autoFixMermaidCode } from './utils/mermaidAutoFix';

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
function MobileTabBar({ activePanel, onPanelChange, colors }) {
  const tabs = [
    { id: 'editor', label: 'Código', icon: <CodeIcon /> },
    { id: 'preview', label: 'Vista previa', icon: <EyeIcon /> },
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
  // Estado principal
  const [code, setCode] = useState(DEFAULT_DIAGRAM);
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
    // Mobile: Single panel (tab-based)
    if (isMobile) {
      return {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.5s ease-out',
      };
    }

    // Tablet: Stacked vertical
    if (isTablet) {
      return {
        flex: 1,
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gap: '1px',
        background: colors.borderPrimary,
        overflow: 'hidden',
        animation: 'fadeIn 0.5s ease-out',
      };
    }

    // Desktop: Side by side
    return {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1px',
      background: colors.borderPrimary,
      overflow: 'hidden',
      animation: 'fadeIn 0.5s ease-out',
    };
  };

  // Container styles
  const styles = {
    container: {
      minHeight: '100vh',
      height: '100vh',
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
  const renderMobileLayout = () => (
    <>
      <MobileTabBar
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        colors={colors}
      />
      <div style={styles.panelContainer}>
        {activePanel === 'editor' ? (
          <EditorPanel
            code={code}
            onCodeChange={setCode}
            isMobile={isMobile}
          />
        ) : (
          <PreviewPanel
            previewRef={previewRef}
            isRendering={isRendering}
            errorInfo={errorInfo}
            code={code}
            onAutoFix={handleAutoFix}
            isMobile={isMobile}
          />
        )}
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
    <div style={styles.container}>
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