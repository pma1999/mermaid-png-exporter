/**
 * Sistema de Auto-corrección de código Mermaid
 * Analiza y corrige patrones problemáticos conocidos
 */

/**
 * Corrige nodos con corchetes [] que contienen paréntesis ()
 * Este es el error más común en Mermaid
 * 
 * Ejemplo:
 *   INPUT:  RES1[Texto (con paréntesis)]:::process
 *   OUTPUT: RES1["Texto (con paréntesis)"]:::process
 */
const fixBracketNodesWithParentheses = (line) => {
    const result = [];
    let lastIndex = 0;

    // Regex para encontrar nodos: captura ID + [contenido] o {contenido} o (contenido) + opcional :::clase
    const nodeRegex = /(\w+)\s*(?:\[([^\]]+)\]|\{([^\}]+)\}|\(([^\(\)\[\]]+)\))(:::?\w+)?/g;
    let match;

    while ((match = nodeRegex.exec(line)) !== null) {
        const [fullMatch, id, contentBrackets, contentBraces, contentParens, modifier] = match;
        const matchStart = match.index;

        // Determinar qué tipo de nodo es y cuál es el contenido
        let content, openChar, closeChar;
        if (contentBrackets) {
            content = contentBrackets;
            openChar = '[';
            closeChar = ']';
        } else if (contentBraces) {
            content = contentBraces;
            openChar = '{';
            closeChar = '}';
        } else if (contentParens) {
            content = contentParens;
            openChar = '(';
            closeChar = ')';
        } else {
            result.push(fullMatch);
            lastIndex = matchStart + fullMatch.length;
            continue;
        }

        // Añadir el texto antes del match
        result.push(line.slice(lastIndex, matchStart));

        const trimmedContent = content.trim();

        // Detectar formas especiales que NO debemos modificar
        const isSpecialShape = /^[\(\[\{\/\\]/.test(trimmedContent);

        // Verificar si el contenido ya está correctamente entre comillas
        const alreadyQuoted = /^["'].*["']$/.test(trimmedContent);

        // Detectar si hay comillas internas SIN que el contenido esté completamente entrecomillado
        const hasInternalQuotes = /["']/.test(content) && !alreadyQuoted;

        // Detectar si contiene paréntesis problemáticos (solo para [] y {})
        const hasProblematicParens = (openChar !== '(') && content.includes('(') && content.includes(')');

        // Necesita corrección si NO es forma especial Y tiene problemas
        const needsFix = !isSpecialShape && (
            (!alreadyQuoted && hasProblematicParens) ||
            (!alreadyQuoted && hasInternalQuotes)
        );

        if (needsFix) {
            // Escapar comillas internas si las hay
            let fixedContent = content;
            if (hasInternalQuotes) {
                fixedContent = content.replace(/"/g, '&quot;');
            }
            // Envolver contenido en comillas
            result.push(`${id}${openChar}"${fixedContent}"${closeChar}${modifier || ''}`);
        } else {
            // Mantener original
            result.push(fullMatch);
        }

        lastIndex = matchStart + fullMatch.length;
    }

    // Añadir el resto de la línea
    result.push(line.slice(lastIndex));

    return result.join('');
};

/**
 * Sistema de Auto-corrección global de código Mermaid
 * Analiza todo el código y corrige patrones problemáticos conocidos
 */
export const autoFixMermaidCode = (code) => {
    let fixes = [];

    // Procesar línea por línea para mayor control
    const lines = code.split('\n');
    const fixedLines = lines.map((line, index) => {
        const originalLine = line;
        let fixedLine = line;

        // Ignorar líneas que no necesitan procesamiento
        if (
            /^\s*%%/.test(line) ||           // Comentarios
            /^\s*classDef\s/.test(line) ||   // Definiciones de clase
            /^\s*class\s/.test(line) ||      // Asignaciones de clase
            /^\s*style\s/.test(line) ||      // Estilos inline
            /^\s*linkStyle\s/.test(line) ||  // Estilos de enlace
            /^\s*graph\s/.test(line) ||      // Declaración de grafo
            /^\s*flowchart\s/.test(line) ||  // Declaración de flowchart
            /^\s*sequenceDiagram/.test(line) || // Diagrama de secuencia
            /^\s*end\s*$/.test(line) ||      // Cierre de subgraph
            /^\s*direction\s/.test(line) ||  // Dirección
            /^\s*$/.test(line)               // Líneas vacías
        ) {
            return fixedLine;
        }

        // FIX PRINCIPAL: Nodos con corchetes [] que contienen paréntesis ()
        fixedLine = fixBracketNodesWithParentheses(fixedLine);

        if (fixedLine !== originalLine) {
            fixes.push({
                line: index + 1,
                original: originalLine.trim(),
                fixed: fixedLine.trim()
            });
        }

        return fixedLine;
    });

    return {
        code: fixedLines.join('\n'),
        fixes,
        hasChanges: fixes.length > 0
    };
};

/**
 * Analiza el código y devuelve problemas detectados sin corregir
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
            /^\s*$/.test(line)
        ) {
            return;
        }

        // Detectar nodos con corchetes, llaves o paréntesis que contienen problemas
        const nodeRegex = /(\w+)\s*(?:\[([^\]]+)\]|\{([^\}]+)\}|\(([^\(\)\[\]]+)\))/g;
        let match;

        while ((match = nodeRegex.exec(line)) !== null) {
            const content = match[2] || match[3] || match[4];
            if (!content) continue;

            const trimmedContent = content.trim();
            const isSpecialShape = /^[\(\[\{\/\\]/.test(trimmedContent);
            const alreadyQuoted = /^["'].*["']$/.test(trimmedContent);
            const hasInternalQuotes = /["']/.test(content) && !alreadyQuoted;
            const hasParentheses = content.includes('(') && content.includes(')');

            // Reportar si hay comillas internas problemáticas
            if (hasInternalQuotes && !alreadyQuoted) {
                issues.push({
                    line: index + 1,
                    type: 'internal_quotes',
                    content: line.trim(),
                    description: 'Comillas internas en nodo sin escapar'
                });
                break;
            }

            // Reportar si hay paréntesis problemáticos (en [] o {})
            if (hasParentheses && !alreadyQuoted && !isSpecialShape && !match[4]) {
                issues.push({
                    line: index + 1,
                    type: 'parentheses_in_brackets',
                    content: line.trim(),
                    description: 'Paréntesis dentro de nodo con corchetes o llaves'
                });
                break;
            }
        }
    });

    return issues;
};
