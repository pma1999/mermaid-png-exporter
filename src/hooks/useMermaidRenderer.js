import { useState, useRef, useCallback, useEffect } from 'react';
import { mermaid } from '../config/mermaid.config';
import { parseError } from '../utils/errorParser';

/**
 * Hook para renderizar diagramas Mermaid
 * @param {string} code - Código Mermaid a renderizar
 * @param {number} debounceMs - Tiempo de debounce en ms (default: 400)
 */
export function useMermaidRenderer(code, debounceMs = 400) {
    const [error, setError] = useState(null);
    const [errorInfo, setErrorInfo] = useState(null);
    const [isRendering, setIsRendering] = useState(false);
    const previewRef = useRef(null);
    const renderIdRef = useRef(0);

    const renderDiagram = useCallback(async () => {
        if (!previewRef.current || !code.trim()) {
            if (previewRef.current) previewRef.current.innerHTML = "";
            setError(null);
            setErrorInfo(null);
            return;
        }

        setIsRendering(true);
        setError(null);
        setErrorInfo(null);
        renderIdRef.current += 1;
        const currentRenderId = `mermaid-${renderIdRef.current}-${Date.now()}`;

        try {
            const isValid = await mermaid.parse(code);
            if (!isValid && isValid !== undefined) {
                throw new Error("Sintaxis Mermaid inválida");
            }

            const { svg } = await mermaid.render(currentRenderId, code);
            if (previewRef.current) {
                previewRef.current.innerHTML = svg;
                const svgElement = previewRef.current.querySelector("svg");
                if (svgElement) {
                    svgElement.style.maxWidth = "100%";
                    svgElement.style.height = "auto";
                    svgElement.style.display = "block";
                    svgElement.style.margin = "0 auto";
                }
            }
        } catch (err) {
            const parsedError = parseError(err, code);
            setErrorInfo(parsedError);
            setError(parsedError.summary);
            if (previewRef.current) {
                previewRef.current.innerHTML = "";
            }
        } finally {
            setIsRendering(false);
        }
    }, [code]);

    // Renderizar con debounce
    useEffect(() => {
        const timeout = setTimeout(renderDiagram, debounceMs);
        return () => clearTimeout(timeout);
    }, [renderDiagram, debounceMs]);

    // Limpiar errores inmediatamente (para auto-fix)
    const clearErrors = useCallback(() => {
        setError(null);
        setErrorInfo(null);
    }, []);

    return {
        previewRef,
        error,
        errorInfo,
        isRendering,
        clearErrors,
        renderDiagram,
    };
}
