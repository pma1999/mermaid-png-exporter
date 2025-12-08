/**
 * Sistema de Auto-corrección de código Mermaid v2
 * 
 * PRINCIPIO FUNDAMENTAL: "First, do no harm"
 * - Solo modificar nodos que CLARAMENTE tienen problemas
 * - NUNCA modificar contenido que ya está correctamente entrecomillado
 * - Usar parsing más estricto para evitar falsos positivos
 * 
 * Soporta todas las formas de nodos de Mermaid:
 * - Básicas: [], {}, ()
 * - Especiales: [/  /], [\  \], ([  ]), [[  ]], [(  )], ((  )), (((  ))), {{  }}
 */

// =============================================================================
// UTILIDADES DE DETECCIÓN
// =============================================================================

/**
 * Verifica si una cadena está completamente entrecomillada (inicio Y fin)
 * @param {string} str - Cadena a verificar
 * @returns {boolean}
 */
const isFullyQuoted = (str) => {
    const trimmed = str.trim();
    // Verificar comillas dobles
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
        // Contar comillas para asegurar que no hay comillas extra mal balanceadas
        const quotes = trimmed.match(/"/g);
        return quotes && quotes.length === 2;
    }
    // Verificar comillas simples
    if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
        const quotes = trimmed.match(/'/g);
        return quotes && quotes.length === 2;
    }
    return false;
};

/**
 * Cuenta cuántas comillas hay y si están balanceadas
 * @param {string} str 
 * @returns {{double: number, single: number, balanced: boolean}}
 */
const analyzeQuotes = (str) => {
    const doubleQuotes = (str.match(/"/g) || []).length;
    const singleQuotes = (str.match(/'/g) || []).length;
    return {
        double: doubleQuotes,
        single: singleQuotes,
        balanced: doubleQuotes % 2 === 0 && singleQuotes % 2 === 0
    };
};

/**
 * Verifica si el contenido tiene paréntesis problemáticos FUERA de comillas
 * Usa un análisis carácter por carácter para ser preciso
 * 
 * @param {string} content - El contenido a analizar
 * @returns {boolean}
 */
const hasUnquotedParentheses = (content) => {
    if (!content || content.trim() === '') return false;

    const trimmed = content.trim();

    // Si está completamente entrecomillado, NO hay problema
    if (isFullyQuoted(trimmed)) {
        return false;
    }

    // Análisis carácter por carácter
    let inDoubleQuotes = false;
    let inSingleQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const prevChar = i > 0 ? content[i - 1] : '';

        // Toggle de comillas dobles (ignorar escapadas con \)
        if (char === '"' && prevChar !== '\\') {
            if (!inSingleQuotes) {
                inDoubleQuotes = !inDoubleQuotes;
            }
            continue;
        }

        // Toggle de comillas simples
        if (char === "'" && prevChar !== '\\') {
            if (!inDoubleQuotes) {
                inSingleQuotes = !inSingleQuotes;
            }
            continue;
        }

        // Detectar paréntesis fuera de comillas
        if (!inDoubleQuotes && !inSingleQuotes) {
            if (char === '(' || char === ')') {
                return true;
            }
        }
    }

    return false;
};

// =============================================================================
// FUNCIONES DE CORRECCIÓN
// =============================================================================

/**
 * Envuelve el contenido en comillas de forma segura
 * NO modifica si ya está correctamente entrecomillado
 * 
 * @param {string} content - Contenido a entrecomillar
 * @returns {string}
 */
const safeQuote = (content) => {
    const trimmed = content.trim();

    // Si ya está completamente entrecomillado, devolver tal cual
    if (isFullyQuoted(trimmed)) {
        return content;
    }

    // Analizar comillas existentes
    const quoteAnalysis = analyzeQuotes(content);

    // Si tiene comillas dobles internas, escaparlas con entidad HTML
    let cleanContent = content;
    if (quoteAnalysis.double > 0) {
        cleanContent = content.replace(/"/g, '&quot;');
    }

    return `"${cleanContent}"`;
};

/**
 * Procesa un nodo con forma especial (trapezoide, stadium, etc.)
 * Solo corrige si realmente tiene problemas
 * 
 * @param {string} nodeId - ID del nodo
 * @param {string} content - Contenido del nodo
 * @param {string} openDelim - Delimitador de apertura
 * @param {string} closeDelim - Delimitador de cierre
 * @param {string} modifier - Modificador CSS (:::clase)
 * @returns {string} - Nodo corregido o original
 */
const fixSpecialNode = (nodeId, content, openDelim, closeDelim, modifier = '') => {
    // Si el contenido ya está bien entrecomillado, no tocar
    if (isFullyQuoted(content.trim())) {
        return `${nodeId}${openDelim}${content}${closeDelim}${modifier}`;
    }

    // Si tiene paréntesis fuera de comillas, corregir
    if (hasUnquotedParentheses(content)) {
        const quoted = safeQuote(content);
        return `${nodeId}${openDelim}${quoted}${closeDelim}${modifier}`;
    }

    // No necesita corrección
    return `${nodeId}${openDelim}${content}${closeDelim}${modifier}`;
};

// =============================================================================
// PARSER DE NODOS MEJORADO
// =============================================================================

/**
 * Extrae nodos de una línea usando parsing manual (no solo regex)
 * Esto es más robusto para casos complejos
 * 
 * @param {string} line - Línea a procesar
 * @returns {Array<{original: string, fixed: string, start: number, end: number}>}
 */
const parseAndFixNodes = (line) => {
    const fixes = [];

    // Patrones de formas especiales ordenados por longitud de delimitador (más largo primero)
    const shapePatterns = [
        // Triple parens (double circle): ((( ... )))
        { open: '(((', close: ')))', name: 'double_circle' },
        // Stadium: ([ ... ])
        { open: '([', close: '])', name: 'stadium' },
        // Subroutine: [[ ... ]]
        { open: '[[', close: ']]', name: 'subroutine' },
        // Cylindrical: [( ... )]
        { open: '[(', close: ')]', name: 'cylindrical' },
        // Circle: (( ... ))
        { open: '((', close: '))', name: 'circle' },
        // Hexagon: {{ ... }}
        { open: '{{', close: '}}', name: 'hexagon' },
        // Trapezoid: [/ ... /]
        { open: '[/', close: '/]', name: 'trapezoid' },
        // Trapezoid alt: [\ ... \]
        { open: '[\\', close: '\\]', name: 'trapezoid_alt' },
        // Parallelogram: [/ ... \]
        { open: '[/', close: '\\]', name: 'parallelogram' },
        // Parallelogram alt: [\ ... /]
        { open: '[\\', close: '/]', name: 'parallelogram_alt' },
    ];

    // Procesar formas especiales primero
    for (const shape of shapePatterns) {
        // Crear regex para esta forma específica
        // Captura: ID + delimitador apertura + contenido + delimitador cierre + opcional :::clase
        const openEsc = shape.open.replace(/([\/\\()\[\]{}])/g, '\\$1');
        const closeEsc = shape.close.replace(/([\/\\()\[\]{}])/g, '\\$1');

        // Usar regex non-greedy pero con restricción de no capturar el cierre
        const regex = new RegExp(
            `(\\w+)\\s*(${openEsc})([\\s\\S]*?)(${closeEsc})(:::?\\w+)?`,
            'g'
        );

        let match;
        while ((match = regex.exec(line)) !== null) {
            const [fullMatch, nodeId, openDelim, content, closeDelim, modifier] = match;
            const start = match.index;
            const end = start + fullMatch.length;

            // Verificar que no estamos dentro de otro match ya procesado
            const alreadyProcessed = fixes.some(f =>
                (start >= f.start && start < f.end) ||
                (end > f.start && end <= f.end)
            );
            if (alreadyProcessed) continue;

            // Validación especial: para circle, verificar que no es parte de double_circle
            if (shape.name === 'circle') {
                // Verificar si hay ( antes o ) después
                if (start > 0 && line[start + nodeId.length] === '(' &&
                    line[start + nodeId.length + 1] === '(' &&
                    line[start + nodeId.length + 2] === '(') {
                    continue; // Es double_circle, saltar
                }
            }

            // Solo procesar si tiene paréntesis problemáticos Y no está entrecomillado
            if (hasUnquotedParentheses(content)) {
                const fixed = fixSpecialNode(nodeId, content, openDelim, closeDelim, modifier || '');
                if (fixed !== fullMatch) {
                    fixes.push({
                        original: fullMatch,
                        fixed: fixed,
                        start: start,
                        end: end
                    });
                }
            }
        }
    }

    // Procesar nodos básicos con corchetes []
    // IMPORTANTE: Excluir formas especiales que ya fueron procesadas
    const bracketRegex = /(\w+)\s*\[([^\]]+)\](:::?\w+)?/g;
    let match;

    while ((match = bracketRegex.exec(line)) !== null) {
        const [fullMatch, nodeId, content, modifier] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Verificar que no estamos dentro de otro match ya procesado
        const alreadyProcessed = fixes.some(f =>
            (start >= f.start && start < f.end) ||
            (end > f.start && end <= f.end)
        );
        if (alreadyProcessed) continue;

        // Verificar que no es una forma especial (contenido empieza con /, \, [, ()
        const firstChar = content.trim()[0];
        if (firstChar === '/' || firstChar === '\\' || firstChar === '[' || firstChar === '(') {
            continue; // Es forma especial, ya debería estar procesada
        }

        // Verificar si ya está entrecomillado
        if (isFullyQuoted(content.trim())) {
            continue; // Ya está bien
        }

        // Solo corregir si tiene paréntesis problemáticos
        if (hasUnquotedParentheses(content)) {
            const quoted = safeQuote(content);
            const fixed = `${nodeId}[${quoted}]${modifier || ''}`;

            if (fixed !== fullMatch) {
                fixes.push({
                    original: fullMatch,
                    fixed: fixed,
                    start: start,
                    end: end
                });
            }
        }
    }

    // Procesar nodos con llaves {} (rhombus)
    // IMPORTANTE: Excluir hexágonos {{ }}
    const braceRegex = /(\w+)\s*\{([^{}]+)\}(:::?\w+)?/g;

    while ((match = braceRegex.exec(line)) !== null) {
        const [fullMatch, nodeId, content, modifier] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Verificar que no es un hexágono (no hay { antes)
        if (start > 0 && line[start - 1] === '{') continue;
        // Verificar que no hay } después
        if (end < line.length && line[end] === '}') continue;

        // Verificar que no estamos dentro de otro match
        const alreadyProcessed = fixes.some(f =>
            (start >= f.start && start < f.end) ||
            (end > f.start && end <= f.end)
        );
        if (alreadyProcessed) continue;

        // Verificar si ya está entrecomillado
        if (isFullyQuoted(content.trim())) continue;

        // Solo corregir si tiene paréntesis problemáticos
        if (hasUnquotedParentheses(content)) {
            const quoted = safeQuote(content);
            const fixed = `${nodeId}{${quoted}}${modifier || ''}`;

            if (fixed !== fullMatch) {
                fixes.push({
                    original: fullMatch,
                    fixed: fixed,
                    start: start,
                    end: end
                });
            }
        }
    }

    return fixes;
};

/**
 * Aplica los fixes a una línea de forma segura
 * Procesa de derecha a izquierda para no afectar los índices
 * 
 * @param {string} line - Línea original
 * @param {Array} fixes - Fixes a aplicar
 * @returns {string} - Línea corregida
 */
const applyFixes = (line, fixes) => {
    if (fixes.length === 0) return line;

    // Ordenar de derecha a izquierda
    const sortedFixes = [...fixes].sort((a, b) => b.start - a.start);

    let result = line;
    for (const fix of sortedFixes) {
        result = result.slice(0, fix.start) + fix.fixed + result.slice(fix.end);
    }

    return result;
};

// =============================================================================
// API PÚBLICA
// =============================================================================

/**
 * Sistema de Auto-corrección global de código Mermaid
 * 
 * @param {string} code - Código Mermaid a corregir
 * @returns {{code: string, fixes: Array, hasChanges: boolean}}
 */
export const autoFixMermaidCode = (code) => {
    const allFixes = [];

    const lines = code.split('\n');
    const fixedLines = lines.map((line, index) => {
        // Ignorar líneas que no necesitan procesamiento
        if (
            /^\s*%%/.test(line) ||           // Comentarios
            /^\s*classDef\s/.test(line) ||   // Definiciones de clase
            /^\s*class\s/.test(line) ||      // Asignaciones de clase
            /^\s*style\s/.test(line) ||      // Estilos inline
            /^\s*graph\s/.test(line) ||      // Declaración de grafo
            /^\s*flowchart\s/.test(line) ||  // Declaración de flowchart
            /^\s*sequenceDiagram/.test(line) || // Diagrama de secuencia
            /^\s*end\s*$/.test(line) ||      // Cierre de subgraph
            /^\s*direction\s/.test(line) ||  // Dirección
            /^\s*subgraph\s/.test(line) ||   // Inicio de subgraph
            /^\s*$/.test(line)               // Líneas vacías
        ) {
            return line;
        }

        // FIX ESPECIAL: Bug conocido de Mermaid con linkStyle y colores hex
        // El parser de Mermaid malinterpreta #XXX cuando es el último atributo
        // Workaround: añadir un atributo dummy después del color hex
        // Ref: https://github.com/mermaid-js/mermaid/issues/
        if (/^\s*linkStyle\s/.test(line)) {
            // Detectar si termina con un color hex (ej: stroke:#666 o stroke:#abc123;)
            // El bug ocurre cuando el hex es el ÚLTIMO atributo, incluso con ;
            const hexAtEndPattern = /(#[0-9a-fA-F]{3,6})\s*;?\s*$/;
            const match = line.match(hexAtEndPattern);
            if (match) {
                // Añadir un atributo dummy después del color hex
                // Usamos stroke-opacity:1 que es invisible pero válido
                let fixedLine = line.trimEnd();
                // Quitar punto y coma si existe
                fixedLine = fixedLine.replace(/;\s*$/, '');
                // Añadir atributo dummy
                fixedLine = fixedLine + ',stroke-opacity:1;';

                allFixes.push({
                    line: index + 1,
                    original: line.trim(),
                    fixed: fixedLine.trim()
                });
                return fixedLine;
            }
            return line; // linkStyle sin problemas, no procesar más
        }

        // Parsear y corregir nodos en esta línea
        const lineFixes = parseAndFixNodes(line);

        if (lineFixes.length > 0) {
            const fixedLine = applyFixes(line, lineFixes);

            // Registrar los cambios
            lineFixes.forEach(fix => {
                allFixes.push({
                    line: index + 1,
                    original: fix.original,
                    fixed: fix.fixed
                });
            });

            return fixedLine;
        }

        return line;
    });

    return {
        code: fixedLines.join('\n'),
        fixes: allFixes,
        hasChanges: allFixes.length > 0
    };
};

/**
 * Analiza el código y devuelve problemas detectados sin corregir
 * 
 * @param {string} code - Código a analizar
 * @returns {Array<{line: number, type: string, content: string, description: string}>}
 */
export const analyzeCode = (code) => {
    const issues = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
        // Ignorar líneas especiales
        if (
            /^\s*%%/.test(line) ||
            /^\s*classDef\s/.test(line) ||
            /^\s*class\s/.test(line) ||
            /^\s*style\s/.test(line) ||
            /^\s*subgraph\s/.test(line) ||
            /^\s*$/.test(line)
        ) {
            return;
        }

        // Usar el mismo parser para detectar problemas
        const lineFixes = parseAndFixNodes(line);

        if (lineFixes.length > 0) {
            lineFixes.forEach(fix => {
                issues.push({
                    line: index + 1,
                    type: 'unquoted_special_chars',
                    content: fix.original,
                    description: 'Paréntesis o caracteres especiales sin entrecomillar'
                });
            });
        }
    });

    return issues;
};

/**
 * Detecta si un código tiene formas especiales
 * 
 * @param {string} code - Código a analizar
 * @returns {string[]} - Lista de formas encontradas
 */
export const detectSpecialShapes = (code) => {
    const found = [];
    const patterns = [
        { name: 'double_circle', pattern: /\(\(\(/ },
        { name: 'circle', pattern: /\(\(/ },
        { name: 'stadium', pattern: /\(\[/ },
        { name: 'subroutine', pattern: /\[\[/ },
        { name: 'cylindrical', pattern: /\[\(/ },
        { name: 'hexagon', pattern: /\{\{/ },
        { name: 'trapezoid', pattern: /\[\// },
        { name: 'trapezoid_alt', pattern: /\[\\/ },
    ];

    for (const { name, pattern } of patterns) {
        if (pattern.test(code)) {
            found.push(name);
        }
    }

    return found;
};
