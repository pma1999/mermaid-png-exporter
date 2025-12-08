import { autoFixMermaidCode, analyzeCode, detectSpecialShapes } from './mermaidAutoFix';

/**
 * Tokens de error relacionados con formas especiales de Mermaid
 */
const SPECIAL_SHAPE_TOKENS = [
    'SQE', 'PE', 'PS', 'STR',
    'DOUBLECIRCLEEND', 'STADIUMEND', 'SUBROUTINEEND',
    'PIPE', 'CYLINDEREND', 'DIAMOND_STOP',
    'TAGEND', 'TRAPEND', 'INVTRAPEND'
];

/**
 * Definición de formas especiales para detección
 */
const SPECIAL_SHAPES_DETECT = [
    { openEsc: '\\[\\/', closeEsc: '\\/\\]' },   // trapezoid
    { openEsc: '\\[\\\\', closeEsc: '\\\\\\]' }, // trapezoid_alt
    { openEsc: '\\[\\/', closeEsc: '\\\\\\]' },  // parallelogram
    { openEsc: '\\[\\\\', closeEsc: '\\/\\]' },  // parallelogram_alt
    { openEsc: '\\(\\[', closeEsc: '\\]\\)' },   // stadium
    { openEsc: '\\[\\[', closeEsc: '\\]\\]' },   // subroutine
    { openEsc: '\\[\\(', closeEsc: '\\)\\]' },   // cylindrical
    { openEsc: '\\(\\(\\(', closeEsc: '\\)\\)\\)' }, // double_circle
    { openEsc: '\\(\\(', closeEsc: '\\)\\)' },   // circle
    { openEsc: '\\{\\{', closeEsc: '\\}\\}' },   // hexagon
];

/**
 * Verifica si el contenido tiene paréntesis problemáticos fuera de comillas
 */
const hasProblematicContent = (content) => {
    const trimmed = content.trim();
    if (/^"[^]*"$/.test(trimmed)) return false;

    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (!inQuotes && (char === '(' || char === ')')) {
            return true;
        }
    }
    return false;
};

/**
 * Patrones comunes de errores en Mermaid y sus soluciones
 */
export const ERROR_PATTERNS = [
    {
        // Error principal: Paréntesis/comillas en nodos básicos y formas especiales
        pattern: new RegExp(`Expecting.*(${SPECIAL_SHAPE_TOKENS.map(t => `'${t}'`).join('|')})|got '(PS|STR)'`, 'i'),
        detect: (code) => {
            // Detectar problemas en formas especiales (trapezoides, stadiums, etc.)
            for (const shape of SPECIAL_SHAPES_DETECT) {
                const pattern = new RegExp(`\\w+\\s*${shape.openEsc}([^]*?)${shape.closeEsc}`, 'g');
                let match;
                while ((match = pattern.exec(code)) !== null) {
                    if (hasProblematicContent(match[1])) return true;
                }
            }

            // Detectar problemas en nodos básicos
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
        explanation: "Los paréntesis () o comillas (\") dentro de nodos (incluyendo trapezoides, stadiums, etc.) causan conflicto porque Mermaid los interpreta como sintaxis especial.",
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

    // Método 2: Buscar líneas que tengan el patrón problemático (incluyendo formas especiales)
    const tokenPattern = new RegExp(`Expecting.*(${SPECIAL_SHAPE_TOKENS.map(t => `'${t}'`).join('|')})|got '(PS|STR)'`, 'i');
    if (tokenPattern.test(errorMessage)) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Primero verificar formas especiales
            for (const shape of SPECIAL_SHAPES_DETECT) {
                const pattern = new RegExp(`\\w+\\s*${shape.openEsc}([^]*?)${shape.closeEsc}`, 'g');
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    if (hasProblematicContent(match[1])) {
                        return {
                            lineNumber: i + 1,
                            lineContent: line
                        };
                    }
                }
            }

            // Luego verificar nodos básicos
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
