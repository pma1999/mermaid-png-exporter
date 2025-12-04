import { autoFixMermaidCode, analyzeCode } from './mermaidAutoFix';

/**
 * Patrones comunes de errores en Mermaid y sus soluciones
 */
export const ERROR_PATTERNS = [
    {
        // Error principal: Paréntesis dentro de nodos o comillas internas
        pattern: /Expecting.*('SQE'|'PE'|'PS'|'DOUBLECIRCLEEND'|'STADIUMEND'|'STR')|got '(PS|STR)'/i,
        detect: (code) => {
            const nodeRegex = /\w+\s*(?:\[([^\]]+)\]|\{([^\}]+)\}|\(([^\(\)\[\]]+)\))/g;
            let match;
            while ((match = nodeRegex.exec(code)) !== null) {
                const content = match[1] || match[2] || match[3];
                if (!content) continue;

                const trimmedContent = content.trim();
                const isSpecialShape = /^[\(\[\{\/\\]/.test(trimmedContent);
                const alreadyQuoted = /^["'].*["']$/.test(trimmedContent);
                const hasInternalQuotes = /["']/.test(content) && !alreadyQuoted;
                const hasProblematicParens = content.includes('(') && content.includes(')');

                if (hasInternalQuotes) return true;
                if (hasProblematicParens && !alreadyQuoted && !isSpecialShape && !match[3]) {
                    return true;
                }
            }
            return false;
        },
        title: "Caracteres especiales en nodos",
        explanation: "Los paréntesis () o comillas (\") dentro de nodos causan conflicto porque Mermaid los interpreta como sintaxis especial.",
        suggestion: 'Haz clic en "Auto-Fix" para envolver automáticamente el contenido problemático entre comillas y escapar caracteres.',
        canAutoFix: true
    },
    {
        pattern: /Expecting.*'ALPHA'|Expecting.*'COLON'/i,
        detect: (code) => /"[^"]*"[^"]*"/.test(code) || /'[^']*'[^']*'/.test(code),
        title: "Comillas mal balanceadas",
        explanation: "Hay comillas sin cerrar o anidadas incorrectamente en el código.",
        suggestion: "Revisa manualmente que todas las comillas estén correctamente balanceadas.",
        canAutoFix: false
    },
    {
        pattern: /subgraph|Expecting.*'end'/i,
        detect: (code) => {
            const opens = (code.match(/\bsubgraph\b/gi) || []).length;
            const closes = (code.match(/\bend\b/gi) || []).length;
            return opens > closes;
        },
        title: "Subgraph sin cerrar",
        explanation: `Hay más declaraciones 'subgraph' que cierres 'end'. Cada subgraph necesita su correspondiente 'end'.`,
        suggestion: "Añade 'end' para cerrar cada subgraph abierto.",
        canAutoFix: false
    }
];

/**
 * Extrae la línea real del error buscando el fragmento en el código
 */
const findActualErrorLine = (errorMessage, code) => {
    const lines = code.split('\n');

    // Método 1: Buscar el fragmento de código que aparece en el error
    const fragmentMatch = errorMessage.match(/\.\.\.([^\n]{5,60})/);
    if (fragmentMatch) {
        const fragment = fragmentMatch[1].trim();
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(fragment.substring(0, Math.min(15, fragment.length)))) {
                return {
                    lineNumber: i + 1,
                    lineContent: lines[i]
                };
            }
        }
    }

    // Método 2: Buscar líneas que tengan el patrón problemático
    if (/Expecting.*('SQE'|'PE'|'PS'|'STR')|got '(PS|STR)'/.test(errorMessage)) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nodeRegex = /\w+\s*(?:\[([^\]]+)\]|\{([^\}]+)\}|\(([^\(\)\[\]]+)\))/g;
            let match;
            while ((match = nodeRegex.exec(line)) !== null) {
                const content = match[1] || match[2] || match[3];
                if (!content) continue;

                const hasInternalQuotes = /["']/.test(content) && !/^["'].*["']$/.test(content.trim());
                const hasProblematicParens = content.includes('(') && content.includes(')') && !content.startsWith('"');

                if (hasInternalQuotes || hasProblematicParens) {
                    return {
                        lineNumber: i + 1,
                        lineContent: line
                    };
                }
            }
        }
    }

    // Método 3: Usar el número de línea reportado como fallback
    const lineNumMatch = errorMessage.match(/line (\d+)/i);
    if (lineNumMatch) {
        const reportedLine = parseInt(lineNumMatch[1], 10);
        const searchRange = 10;
        for (let offset = 0; offset <= searchRange; offset++) {
            for (const dir of [0, 1, -1]) {
                const checkLine = reportedLine + (offset * dir) - 1;
                if (checkLine >= 0 && checkLine < lines.length) {
                    const line = lines[checkLine];
                    if (/\w+\s*(?:\[[^\]]*\([^\]]*\)[^\]]*\]|\{[^\}]*\([^\}]*\)[^\}]*\})/.test(line)) {
                        return {
                            lineNumber: checkLine + 1,
                            lineContent: line
                        };
                    }
                }
            }
        }

        if (reportedLine > 0 && reportedLine <= lines.length) {
            return {
                lineNumber: reportedLine,
                lineContent: lines[reportedLine - 1]
            };
        }
    }

    return null;
};

/**
 * Analiza un error de Mermaid y devuelve información estructurada
 */
export const parseError = (error, code) => {
    const errorMessage = error?.message || error?.toString() || "Error desconocido";

    // Limpiar IDs de render del mensaje
    const cleanMessage = errorMessage
        .replace(/mermaid-\d+-\d+/g, "diagrama")
        .replace(/\n{2,}/g, '\n');

    // Encontrar la línea real del error
    const actualError = findActualErrorLine(errorMessage, code);

    // Analizar problemas en el código
    const issues = analyzeCode(code);

    // Buscar patrón de error coincidente
    let matchedPattern = null;
    for (const pattern of ERROR_PATTERNS) {
        if (pattern.pattern.test(errorMessage) && pattern.detect(code, actualError?.lineContent || '')) {
            matchedPattern = pattern;
            break;
        }
    }

    // Verificar si el autofix puede ayudar
    const autoFixResult = autoFixMermaidCode(code);

    return {
        message: cleanMessage,
        lineNumber: actualError?.lineNumber || null,
        errorLine: actualError?.lineContent || null,
        pattern: matchedPattern,
        issues,
        canAutoFix: autoFixResult.hasChanges,
        autoFixPreview: autoFixResult.fixes,
        summary: matchedPattern?.title || "Error de sintaxis Mermaid"
    };
};
