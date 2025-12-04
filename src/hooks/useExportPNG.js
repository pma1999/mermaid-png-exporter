import { useState, useCallback } from 'react';
import { exportSvgToPng, downloadDataUrl, generateFilename } from '../utils/exportUtils';

/**
 * Hook para exportar diagramas a PNG
 * @param {React.RefObject} previewRef - Ref del contenedor de preview
 */
export function useExportPNG(previewRef) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [exportError, setExportError] = useState(null);

    const exportToPNG = useCallback(async (options = {}) => {
        const { scale = 3, transparent = false } = options;

        const svgElement = previewRef.current?.querySelector("svg");
        if (!svgElement) {
            setExportError("No hay diagrama para exportar");
            return false;
        }

        try {
            setIsExporting(true);
            setExportError(null);

            const pngDataUrl = await exportSvgToPng(svgElement, { scale, transparent });
            downloadDataUrl(pngDataUrl, generateFilename());

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 2500);
            return true;
        } catch (err) {
            console.error("Export error:", err);
            setExportError(err.message);
            return false;
        } finally {
            setIsExporting(false);
        }
    }, [previewRef]);

    const clearExportError = useCallback(() => {
        setExportError(null);
    }, []);

    return {
        exportToPNG,
        isExporting,
        exportSuccess,
        exportError,
        clearExportError,
    };
}
