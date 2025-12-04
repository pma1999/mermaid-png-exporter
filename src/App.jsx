import { useState, useCallback } from 'react';
import { DEFAULT_DIAGRAM } from './config/mermaid.config';
import { useTheme } from './hooks/useTheme';
import { useMermaidRenderer } from './hooks/useMermaidRenderer';
import { useExportPNG } from './hooks/useExportPNG';
import { autoFixMermaidCode } from './utils/mermaidAutoFix';

import { Header, Footer } from './components/layout';
import { EditorPanel } from './components/editor';
import { PreviewPanel } from './components/preview';

/**
 * Componente principal de la aplicación
 * Mermaid → PNG Exporter
 */
export default function App() {
  // Estado principal
  const [code, setCode] = useState(DEFAULT_DIAGRAM);
  const [exportScale, setExportScale] = useState(3);
  const [bgTransparent, setBgTransparent] = useState(false);

  // Hooks
  const { theme, colors } = useTheme();
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

  // Estilos dinámicos
  const styles = {
    container: {
      minHeight: "100vh",
      background: theme === 'dark'
        ? `linear-gradient(135deg, ${colors.bgPrimary} 0%, #13131a 50%, ${colors.bgPrimary} 100%)`
        : `linear-gradient(135deg, ${colors.bgPrimary} 0%, #e2e8f0 50%, ${colors.bgPrimary} 100%)`,
      fontFamily: "'Outfit', -apple-system, sans-serif",
      color: colors.textPrimary,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    main: {
      flex: 1,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1px",
      background: colors.borderPrimary,
      overflow: "hidden",
      animation: "fadeIn 0.5s ease-out",
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
  `;

  return (
    <div style={styles.container}>
      <style>{dynamicCSS}</style>

      <Header />

      <main style={styles.main}>
        <EditorPanel
          code={code}
          onCodeChange={setCode}
        />

        <PreviewPanel
          previewRef={previewRef}
          isRendering={isRendering}
          errorInfo={errorInfo}
          code={code}
          onAutoFix={handleAutoFix}
        />
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
      />
    </div>
  );
}