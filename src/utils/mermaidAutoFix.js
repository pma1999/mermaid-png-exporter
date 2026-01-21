/**
 * Sistema de Auto-corrección de código Mermaid v2.7
 * 
 * PRINCIPIO FUNDAMENTAL: "First, do no harm"
 * - Solo modificar nodos que CLARAMENTE tienen problemas
 * - NUNCA modificar contenido que ya está correctamente entrecomillado
 * - Usar parsing más estricto para evitar falsos positivos
 * 
 * Soporta todas las formas de nodos de Mermaid:
 * - Básicas: [], {}, ()
 * - Especiales: [/  /], [\  \], ([  ]), [[  ]], [(  )], ((  )), (((  ))), {{  }}
 * 
 * v2.1 - Fix para subgraph titles con paréntesis
 * v2.2 - Fix para comillas internas que causan error STR (string literal)
 * v2.3 - Fix para sintaxis inválida después de nodos: ]:(text), }:(text), etc.
 * v2.4 - Fix para edge labels con paréntesis: -->|texto (problemático)| 
 * v2.5 - Fix para directivas 'style' en mindmaps (no soportadas, se renderizan como texto)
 * v2.6 - Fix para edge labels con delimitadores incorrectos: -->|texto] → -->|texto|
 *        Detecta y corrige cuando se usa ], }, ) en lugar de | para cerrar edge labels
 * v2.7 - Fix para clases CSS mal ubicadas dentro del contenido del nodo:
 *        [":::className texto"] → ["texto"]:::className
 *        Detecta :::clase al inicio del contenido y la mueve fuera del nodo
 */

// =============================================================================
// DETECCIÓN DE TIPO DE DIAGRAMA Y SOPORTE DE ESTILOS
// =============================================================================

/**
 * Configuración de qué directivas de estilo soporta cada tipo de diagrama
 * 
 * - style: Directiva inline (style nodeId fill:#color)
 * - classDef: Definición de clase (classDef className fill:#color)
 * - classAssign: Asignación de clase con keyword 'class' (class node1 className)
 * - inlineClass: Aplicación de clase con ::: (nodeId:::className)
 */
const DIAGRAM_STYLE_SUPPORT = {
    flowchart: { style: true, classDef: true, classAssign: true, inlineClass: true },
    graph: { style: true, classDef: true, classAssign: true, inlineClass: true },
    mindmap: { style: false, classDef: true, classAssign: false, inlineClass: true },
    sequence: { style: false, classDef: false, classAssign: false, inlineClass: false },
    class: { style: true, classDef: true, classAssign: true, inlineClass: true },
    state: { style: true, classDef: true, classAssign: true, inlineClass: true },
    er: { style: false, classDef: false, classAssign: false, inlineClass: false },
    gantt: { style: false, classDef: false, classAssign: false, inlineClass: false },
    pie: { style: false, classDef: false, classAssign: false, inlineClass: false },
    journey: { style: false, classDef: false, classAssign: false, inlineClass: false },
    gitgraph: { style: false, classDef: false, classAssign: false, inlineClass: false },
    unknown: { style: true, classDef: true, classAssign: true, inlineClass: true } // Permisivo por defecto
};

/**
 * Detecta el tipo de diagrama Mermaid a partir del código
 * 
 * @param {string} code - Código Mermaid completo
 * @returns {string} - Tipo de diagrama: 'flowchart', 'mindmap', 'sequence', etc.
 */
export const getDiagramType = (code) => {
    if (!code || typeof code !== 'string') return 'unknown';

    // Buscar la primera línea significativa (ignorar comentarios y espacios)
    const lines = code.split('\n');
    for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        // Ignorar líneas vacías y comentarios
        if (!trimmed || trimmed.startsWith('%%')) continue;

        // Ignorar directivas de configuración %%{init...}%%
        if (trimmed.startsWith('%%{')) continue;

        // Detectar tipo de diagrama
        if (trimmed.startsWith('mindmap')) return 'mindmap';
        if (trimmed.startsWith('flowchart')) return 'flowchart';
        if (trimmed.startsWith('graph ') || trimmed.startsWith('graph\t') || trimmed === 'graph') return 'graph';
        if (trimmed.startsWith('sequencediagram')) return 'sequence';
        if (trimmed.startsWith('classdiagram')) return 'class';
        if (trimmed.startsWith('statediagram')) return 'state';
        if (trimmed.startsWith('erdiagram')) return 'er';
        if (trimmed.startsWith('gantt')) return 'gantt';
        if (trimmed.startsWith('pie')) return 'pie';
        if (trimmed.startsWith('journey')) return 'journey';
        if (trimmed.startsWith('gitgraph')) return 'gitgraph';

        // Si llegamos a una línea no reconocida, asumimos desconocido
        break;
    }

    return 'unknown';
};

/**
 * Verifica si un tipo de diagrama soporta una directiva de estilo específica
 * 
 * @param {string} diagramType - Tipo de diagrama
 * @param {'style' | 'classDef' | 'classAssign' | 'inlineClass'} directive - Directiva a verificar
 * @returns {boolean}
 */
export const supportsStyleDirective = (diagramType, directive) => {
    const support = DIAGRAM_STYLE_SUPPORT[diagramType] || DIAGRAM_STYLE_SUPPORT.unknown;
    return support[directive] === true;
};

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

/**
 * Verifica si el contenido tiene comillas internas problemáticas
 * Las comillas " dentro de nodos (que no forman un entrecomillado completo)
 * causan que Mermaid las interprete como inicio de string literal (token STR)
 * 
 * @param {string} content - El contenido a analizar
 * @returns {boolean}
 */
const hasProblematicQuotes = (content) => {
    if (!content || content.trim() === '') return false;

    const trimmed = content.trim();

    // Si está completamente entrecomillado con comillas al inicio Y fin, NO hay problema
    // porque Mermaid lo interpretará correctamente como texto entrecomillado
    if (isFullyQuoted(trimmed)) {
        return false;
    }

    // Buscar comillas dobles en el contenido
    // Si hay comillas pero no envuelven completamente el contenido, son problemáticas
    const quoteAnalysis = analyzeQuotes(content);

    // Si tiene comillas dobles que no forman un entrecomillado completo, es problemático
    if (quoteAnalysis.double > 0) {
        return true;
    }

    return false;
};

/**
 * Función unificada que detecta cualquier contenido problemático
 * Combina detección de paréntesis y comillas internas
 * 
 * @param {string} content - El contenido a analizar
 * @returns {boolean}
 */
const hasProblematicContent = (content) => {
    if (!content || content.trim() === '') return false;

    const trimmed = content.trim();

    // Si está completamente entrecomillado, no hay problema
    if (isFullyQuoted(trimmed)) {
        return false;
    }

    // Verificar paréntesis problemáticos
    if (hasUnquotedParentheses(content)) {
        return true;
    }

    // Verificar comillas internas problemáticas
    if (hasProblematicQuotes(content)) {
        return true;
    }

    // Verificar guion al inicio (rompe nodos redondos como ((-75%)) )
    if (trimmed.startsWith('-')) {
        return true;
    }

    // Verificar caracteres especiales que pueden romper el parser
    // % : Problemático en algunos contextos (ej: porcentajes)
    // # : Puede interpretarse como ID o estilo
    if (/[%#]/.test(content)) {
        return true;
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
        cleanContent = cleanContent.replace(/"/g, '&quot;');
    }

    return `"${cleanContent}"`;
};

/**
 * Detecta y extrae clases CSS mal ubicadas dentro del contenido de un nodo.
 * 
 * Problema: El usuario escribe :::className DENTRO del texto del nodo:
 *   LAW1[":::res1 🛑 NORMAS DE ABSTENCIÓN"]
 * 
 * Correcto: :::className debe estar FUERA del nodo:
 *   LAW1["🛑 NORMAS DE ABSTENCIÓN"]:::res1
 * 
 * Esta función detecta el patrón y devuelve el contenido limpio + las clases extraídas.
 * 
 * Patrones detectados:
 *   - ":::className texto" (con comillas)
 *   - :::className texto (sin comillas)
 *   - ":::class1 :::class2 texto" (múltiples clases)
 * 
 * @param {string} content - Contenido del nodo (puede incluir comillas externas)
 * @returns {{cleanContent: string, extractedClasses: string, wasFixed: boolean}}
 */
const fixMisplacedClassInNodeContent = (content) => {
    if (!content || content.trim() === '') {
        return { cleanContent: content, extractedClasses: '', wasFixed: false };
    }

    let workingContent = content.trim();
    let hadQuotes = false;

    // Si el contenido está entrecomillado, quitar las comillas temporalmente
    if ((workingContent.startsWith('"') && workingContent.endsWith('"')) ||
        (workingContent.startsWith("'") && workingContent.endsWith("'"))) {
        workingContent = workingContent.slice(1, -1);
        hadQuotes = true;
    }

    // Usar enfoque de bucle para extraer clases una por una
    // Esto es más robusto que un regex complejo con grupos no-capturadores
    const singleClassPattern = /^:::([\w-]+)\s*/;
    const extractedClassList = [];
    let remaining = workingContent;

    // Extraer clases del inicio una por una
    let match;
    while ((match = remaining.match(singleClassPattern)) !== null) {
        extractedClassList.push(':::' + match[1]);
        remaining = remaining.slice(match[0].length);
    }

    // Si no se encontraron clases, no hay nada que corregir
    if (extractedClassList.length === 0) {
        return { cleanContent: content, extractedClasses: '', wasFixed: false };
    }

    // Limpiar el contenido restante
    let remainingContent = remaining.trim();

    // Si no queda contenido después de las clases, no es un caso válido
    // (sería solo ":::className" sin texto, lo cual es raro pero posible intención del usuario)
    if (!remainingContent) {
        return { cleanContent: content, extractedClasses: '', wasFixed: false };
    }

    // Unir todas las clases sin espacios: :::res1:::res2
    const extractedClasses = extractedClassList.join('');

    // Determinar si el contenido restante necesita comillas
    // Necesita comillas si:
    // 1. Tenía comillas originalmente
    // 2. Tiene caracteres problemáticos (paréntesis, etc.)
    let cleanContent;
    if (hadQuotes || hasProblematicContent(remainingContent)) {
        // Escapar comillas internas si las hay
        const quoteAnalysis = analyzeQuotes(remainingContent);
        if (quoteAnalysis.double > 0) {
            remainingContent = remainingContent.replace(/"/g, '&quot;');
        }
        cleanContent = `"${remainingContent}"`;
    } else {
        cleanContent = remainingContent;
    }

    return {
        cleanContent,
        extractedClasses,
        wasFixed: true
    };
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

    // Si tiene contenido problemático (paréntesis o comillas internas), corregir
    if (hasProblematicContent(content)) {
        const quoted = safeQuote(content);
        return `${nodeId}${openDelim}${quoted}${closeDelim}${modifier}`;
    }

    // No necesita corrección
    return `${nodeId}${openDelim}${content}${closeDelim}${modifier}`;
};

/**
 * Detecta contenido que se ha "escapado" fuera del nodo (ej: <br/> o paréntesis extra)
 * y que debería ser parte del nodo.
 * 
 * @param {string} line - Línea completa
 * @param {number} afterNodeIndex - Índice justo después del cierre del nodo
 * @returns {{leaked: string, style: string, fullEndIndex: number, originalLeakString: string}|null}
 */
const detectLeakedContent = (line, afterNodeIndex) => {
    const remaining = line.slice(afterNodeIndex);

    // 1. Detección ESTRICTA: Contenido seguido de estilo :::
    // Captura: (espacios + contenido) + (:::style)
    // Excluye si empieza con flecha
    const strictStylePattern = /^(\s*[^%\r\n]+?)(:::[\w\-]+)/;
    const matchStyle = remaining.match(strictStylePattern);

    if (matchStyle) {
        const content = matchStyle[1];
        // Si parece una flecha, no es leak, es una conexión con estilo
        if (/^\s*(--|==|o--|x--|<--|-\.)/.test(content)) return null;

        // Si parece el inicio de otro nodo (ID + apertura), abortar
        // Excluir '>' de la detección para evitar conflictos con tags HTML como <br>
        // Primero eliminamos tags HTML comunes de la verificación de "parece otro nodo"
        let checkContent = content.replace(/<br\s*\/?>/gi, ' ');
        if (/(^|[\s])\w+\s*[\(\[\{]/.test(checkContent)) return null;

        // Si es solo espacios, no hay leak real de contenido, solo estilo separado
        // Retornar solo el estilo para que se junte
        return {
            leaked: content,
            style: matchStyle[2],
            originalLeakString: matchStyle[0],
            fullEndIndex: afterNodeIndex + matchStyle[0].length
        };
    }

    // 2. Detección RELAJADA: Empieza con <br> o (
    // Solo si NO detectamos estilo arriba.
    // Captura hasta el siguiente separador fuerte (flecha, comentario, EOL)
    const loosePattern = /^(\s*(?:<br\s*\/?>|\()[^%\r\n]*?)(?=\s*(?:%%|-->|==>|-\.->|--|$))/;
    const matchLoose = remaining.match(loosePattern);

    if (matchLoose) {
        const content = matchLoose[1];
        // Verificar seguridad: no parece otro nodo
        let checkContent = content.replace(/<br\s*\/?>/gi, ' ');
        if (/(^|[\s])\w+\s*[\(\[\{]/.test(checkContent)) return null;

        return {
            leaked: content,
            style: '', // Sin estilo detectado
            originalLeakString: matchLoose[0],
            fullEndIndex: afterNodeIndex + matchLoose[0].length
        };
    }

    return null;
};

// =============================================================================
// FIX PARA SUBGRAPH TITLES
// =============================================================================

/**
 * Corrige títulos de subgraph que contienen paréntesis
 * 
 * Sintaxis de subgraph:
 *   subgraph ID [título con texto]
 *   subgraph ID ["título ya entrecomillado"]
 * 
 * Si el título contiene paréntesis sin entrecomillar, se deben entrecomillar
 * 
 * @param {string} line - Línea que contiene declaración de subgraph
 * @returns {{fixed: string, wasModified: boolean, original: string, fixedTitle: string}}
 */
const fixSubgraphTitle = (line) => {
    // Regex para capturar subgraph: subgraph ID [título]
    // El título es opcional, puede no existir
    const subgraphWithTitleRegex = /^(\s*subgraph\s+)(\w+)\s*\[([^\]]+)\]/;
    const match = line.match(subgraphWithTitleRegex);

    if (!match) {
        // No hay título entre corchetes, o no es un subgraph válido
        return { fixed: line, wasModified: false, original: '', fixedTitle: '' };
    }

    const [fullMatch, prefix, id, title] = match;

    // Si el título ya está entrecomillado, no hacer nada
    if (isFullyQuoted(title.trim())) {
        return { fixed: line, wasModified: false, original: '', fixedTitle: '' };
    }

    // Si el título tiene contenido problemático (paréntesis o comillas), corregir
    if (hasProblematicContent(title)) {
        const quotedTitle = safeQuote(title);
        const fixedLine = line.replace(fullMatch, `${prefix}${id} [${quotedTitle}]`);
        return {
            fixed: fixedLine,
            wasModified: true,
            original: title,
            fixedTitle: quotedTitle
        };
    }

    return { fixed: line, wasModified: false, original: '', fixedTitle: '' };
};

// =============================================================================
// FIX PARA 'END' HUÉRFANOS (SIN SUBGRAPH CORRESPONDIENTE)
// =============================================================================

/**
 * Detecta y corrige 'end' huérfanos (sin subgraph correspondiente)
 * 
 * Problema: Los usuarios a veces escriben 'end' pensando que cierra 
 * un bloque visual, pero en Mermaid 'end' solo debe cerrar un 'subgraph'.
 * Un 'end' sin subgraph previo causa: "Expecting ... got 'end'"
 * 
 * Estrategia: Usamos un contador de stack para rastrear subgraphs abiertos.
 * Cuando encontramos un 'end' y el stack está en 0, es huérfano.
 * 
 * Principio "First, do no harm": Comentamos la línea en lugar de eliminarla,
 * preservando el código original del usuario.
 * 
 * @param {string[]} lines - Array de líneas del código
 * @returns {{lines: string[], fixes: Array<{line: number, type: string, original: string, fixed: string}>}}
 */
const fixOrphanEnds = (lines) => {
    const fixes = [];
    let subgraphStack = 0; // Contador de subgraphs abiertos

    const result = lines.map((line, index) => {
        const trimmed = line.trim().toLowerCase();

        // Ignorar líneas vacías y comentarios
        if (!trimmed || trimmed.startsWith('%%')) {
            return line;
        }

        // Contar apertura de subgraph
        // Soporta: "subgraph ID", "subgraph ID[title]", "subgraph ID [title]"
        if (/^subgraph\s/.test(trimmed) || trimmed === 'subgraph') {
            subgraphStack++;
            return line;
        }

        // Detectar 'end' (solo la palabra, con posibles espacios)
        if (/^end\s*$/.test(trimmed)) {
            if (subgraphStack > 0) {
                // end válido - cierra un subgraph abierto
                subgraphStack--;
                return line;
            } else {
                // end huérfano - no hay subgraph que cerrar
                const indentation = line.match(/^(\s*)/)[1] || '';
                fixes.push({
                    line: index + 1,
                    type: 'orphan_end',
                    original: line.trim(),
                    fixed: `${indentation}%% ${line.trim()} %% Auto-fix: 'end' sin subgraph correspondiente`
                });
                // Comentar la línea en lugar de eliminarla
                return `${indentation}%% ${line.trim()} %% Auto-fix: 'end' sin subgraph correspondiente`;
            }
        }

        return line;
    });

    return { lines: result, fixes };
};

// =============================================================================
// FIX PARA SINTAXIS INVÁLIDA DESPUÉS DE NODOS
// =============================================================================

/**
 * Detecta y corrige sintaxis inválida después de definiciones de nodos.
 * 
 * Patrones inválidos detectados:
 *   NODE[text]:(annotation):::class  →  NODE[text]:::class
 *   NODE{text}:annotation            →  NODE{text}
 *   NODE(text):(note)                →  NODE(text)
 * 
 * El problema ocurre cuando hay un : seguido de texto/paréntesis DESPUÉS
 * del cierre del nodo (], }, )), pero que NO es el prefijo ::: de clases CSS.
 * 
 * @param {string} line - Línea a procesar
 * @returns {{fixed: string, wasModified: boolean, original: string, removed: string}}
 */
const fixInvalidTrailingSyntax = (line) => {
    // Patrones de cierre de nodo seguidos de sintaxis inválida
    // Captura: delimitador de cierre + :texto_inválido (pero NO :::clase)
    // 
    // Grupos de captura:
    // 1: El delimitador de cierre (], }, ), ]], )), )]], etc.)
    // 2: El texto inválido que debe removerse (incluyendo el : inicial)
    // 3: La clase CSS si existe (:::className)

    // Regex explicación:
    // (\]|\}|\)|(?:\]\])|(?:\)\))|(?:\)\]\]))  - Delimitadores de cierre (simples y dobles)
    // \s*                                       - Espacios opcionales
    // (:(?!::)[^\s]*?)                          - : seguido de texto que NO es ::: (non-greedy)
    // (\s*:::?\w+)?                             - Clase CSS opcional
    // (?=\s|$|-->|-.->|==>|---)                 - Lookahead: debe seguir espacio, fin, o flecha

    // Pattern más robusto que maneja múltiples casos
    const invalidTrailingPattern = /(\]|\}|\)|(?:\]\])|(?:\)\))|(?:\)\]\]))\s*(:(?!::)[^\s:]*(?:\([^)]*\))?[^\s:]*)(\s*:::?\w+)?(?=\s|$|-->|-.->|==>|---|--)/g;

    let result = line;
    let wasModified = false;
    let allRemoved = [];
    let allOriginal = [];

    // Procesar todos los matches
    let match;
    const matches = [];

    // Primero, encontrar todos los matches
    while ((match = invalidTrailingPattern.exec(line)) !== null) {
        matches.push({
            fullMatch: match[0],
            delimiter: match[1],
            invalidPart: match[2],
            cssClass: match[3] || '',
            index: match.index
        });
    }

    // Procesar de derecha a izquierda para no afectar índices
    for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];

        // Construir el reemplazo: delimitador + clase (sin la parte inválida)
        const replacement = m.delimiter + m.cssClass;
        const original = m.fullMatch;

        // Solo modificar si realmente hay algo que quitar
        if (m.invalidPart && m.invalidPart.trim()) {
            result = result.slice(0, m.index) + replacement + result.slice(m.index + original.length);
            wasModified = true;
            allRemoved.push(m.invalidPart);
            allOriginal.push(original);
        }
    }

    return {
        fixed: result,
        wasModified,
        original: allOriginal.join(', '),
        removed: allRemoved.join(', ')
    };
};

// =============================================================================
// FIX PARA EDGE LABELS CON DELIMITADORES INCORRECTOS
// =============================================================================

/**
 * Detecta y corrige edge labels con delimitadores de cierre INCORRECTOS.
 * 
 * Este es un error común de tipeo donde el usuario usa ] } ) en lugar de |
 * para cerrar un edge label.
 * 
 * Casos detectados:
 *   A -->|texto] B[nodo]   →  A -->|texto| B[nodo]   (] debería ser |)
 *   A -->|texto} B{nodo}   →  A -->|texto| B{nodo}   (} debería ser |)
 *   A -->|texto) B(nodo)   →  A -->|texto| B(nodo)   () debería ser |)
 *   A -.->|texto<br/>más] B[x]  →  corrige también con HTML tags
 * 
 * Estrategia de detección SEGURA:
 * Solo corregimos cuando el patrón es inequívoco:
 *   FLECHA | contenido DELIM_INCORRECTO ESPACIO ID DELIM_NODO
 * 
 * Donde:
 *   - FLECHA: -->, -.->, ==>, --, --o, --x, <-->, o--, x--
 *   - DELIM_INCORRECTO: ], }, ) cuando debería ser |
 *   - ID: identificador alfanumérico del siguiente nodo
 *   - DELIM_NODO: [, {, (, ((, ([, [[, [(, etc.
 * 
 * La presencia de un nodo DESPUÉS confirma que era un edge label entre dos nodos,
 * haciendo la corrección 100% segura.
 * 
 * @param {string} line - Línea a procesar
 * @returns {{fixed: string, fixes: Array<{original: string, fixed: string, wrongDelim: string}>}}
 */
const fixMalformedEdgeLabels = (line) => {
    const fixes = [];

    // ==========================================================================
    // PATRÓN PRINCIPAL: Edge label seguido de nodo
    // ==========================================================================
    // Regex explicación:
    // (-->|...|x--)      - Grupo 1: Tipo de flecha
    // \s*                - Espacios opcionales entre flecha y pipe
    // \|                 - Pipe de apertura del label (literal)
    // ([^|\]})]+)        - Grupo 2: Contenido del label (sin |, ], }, ))
    //                      NOTA: Permitimos <, >, /, etc. para HTML tags como <br/>
    // ([\]\})])          - Grupo 3: Delimitador INCORRECTO (], }, ))
    // \s+                - Al menos un espacio (separador obligatorio antes del nodo)
    // (\w+)              - Grupo 4: ID del siguiente nodo
    // \s*                - Espacios opcionales
    // ([\[\(\{]|         - Grupo 5: Delimitador de apertura del nodo O flecha:
    //   \(\(|\(\[|         - Formas especiales: ((, ([
    //   \[\[|\[\(|         - Formas especiales: [[, [(
    //   \{\{|              - Forma especial: {{
    //   \[\/|\[\\|         - Formas especiales: [/, [\
    //   >|                 - Forma flag: >
    //   -->|-.->|==>|      - Flechas (para nodos sin delimitador seguidos de otra conexión)
    //   --o|--x|--|        - Más tipos de flechas
    //   <-->|o--|x--)      - Más tipos de flechas
    // ==========================================================================

    const malformedWithNodePattern = /(-->|--o|--x|-\.->|==>|--|<-->|o--|x--)\s*\|([^|\]})]+)([\]\})])\s+(\w+)\s*([\[\(\{]|\(\(|\(\[|\[\[|\[\(|\{\{|\[\/|\[\\|>|-->|--o|--x|-\.->|==>|--|<-->|o--|x--)/g;

    let match;
    const processedRanges = []; // Para evitar solapamientos

    while ((match = malformedWithNodePattern.exec(line)) !== null) {
        const [fullMatch, arrow, labelContent, wrongDelim, nextNodeId, nodeDelim] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Verificar que no estamos procesando un rango ya corregido
        const overlaps = processedRanges.some(r =>
            (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
        );
        if (overlaps) continue;

        // =======================================================================
        // VALIDACIÓN DE SEGURIDAD: Verificar que el contenido NO está entrecomillado
        // Si el label está entrecomillado como |"texto]"|, el ] es parte del texto
        // y NO debe corregirse.
        // =======================================================================
        const trimmedContent = labelContent.trim();

        // Si el contenido empieza con comilla, verificar si el ] está dentro de las comillas
        if (trimmedContent.startsWith('"') || trimmedContent.startsWith("'")) {
            // Analizar si las comillas están balanceadas
            const quoteChar = trimmedContent[0];
            let quoteCount = 0;
            for (const char of labelContent) {
                if (char === quoteChar) quoteCount++;
            }
            // Si hay número impar de comillas, el delimitador podría estar dentro
            // En ese caso, NO corregir para ser conservadores
            if (quoteCount % 2 !== 0) {
                continue;
            }
        }

        // =======================================================================
        // CONSTRUIR LA CORRECCIÓN
        // =======================================================================
        // Reemplazar el delimitador incorrecto por |
        // Mantener todo lo demás igual
        // 
        // NOTA: Si nodeDelim es una flecha (el nodo siguiente no tiene delimitador
        // explícito, como en "A -->|text] B -->"), debemos preservar el espacio
        // antes de la flecha pero no "pegar" el nodeDelim al ID.
        const isNextArrow = /^(-->|--o|--x|-\.->|==>|--|<-->|o--|x--)/.test(nodeDelim);
        const correctedMatch = isNextArrow
            ? `${arrow}|${labelContent}| ${nextNodeId} ${nodeDelim}`
            : `${arrow}|${labelContent}| ${nextNodeId}${nodeDelim}`;

        fixes.push({
            original: fullMatch,
            fixed: correctedMatch,
            wrongDelim: wrongDelim,
            start: start,
            end: end,
            type: 'malformed_edge_label_delimiter'
        });

        processedRanges.push({ start, end });
    }

    // ==========================================================================
    // PATRÓN SECUNDARIO: Edge label al final de línea (sin nodo después)
    // ==========================================================================
    // Menos común pero también es un error claro.
    // Patrón: flecha|contenido] al final de línea o antes de comentario
    // 
    // IMPORTANTE: Este patrón es más arriesgado, solo lo aplicamos si:
    // 1. La línea NO continúa con más contenido significativo
    // 2. O continúa con un comentario %%
    // ==========================================================================

    const malformedAtEndPattern = /(-->|--o|--x|-\.->|==>|--|<-->|o--|x--)\s*\|([^|\]})]+)([\]\})])(\s*(?:%%.*)?$)/g;

    while ((match = malformedAtEndPattern.exec(line)) !== null) {
        const [fullMatch, arrow, labelContent, wrongDelim, trailing] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Verificar solapamiento con fixes anteriores
        const overlaps = processedRanges.some(r =>
            (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
        );
        if (overlaps) continue;

        // Misma validación de comillas
        const trimmedContent = labelContent.trim();
        if (trimmedContent.startsWith('"') || trimmedContent.startsWith("'")) {
            const quoteChar = trimmedContent[0];
            let quoteCount = 0;
            for (const char of labelContent) {
                if (char === quoteChar) quoteCount++;
            }
            if (quoteCount % 2 !== 0) continue;
        }

        // Para este patrón, necesitamos que el contenido tenga algo sustancial
        // (evitar falsos positivos con líneas parciales o comentarios)
        if (labelContent.trim().length < 1) continue;

        const correctedMatch = `${arrow}|${labelContent}|${trailing}`;

        fixes.push({
            original: fullMatch,
            fixed: correctedMatch,
            wrongDelim: wrongDelim,
            start: start,
            end: end,
            type: 'malformed_edge_label_at_end'
        });

        processedRanges.push({ start, end });
    }

    // ==========================================================================
    // APLICAR FIXES de derecha a izquierda
    // ==========================================================================
    let result = line;
    const sortedFixes = [...fixes].sort((a, b) => b.start - a.start);

    for (const fix of sortedFixes) {
        result = result.slice(0, fix.start) + fix.fixed + result.slice(fix.end);
    }

    // ==========================================================================
    // ITERACIÓN: Si hubo cambios, ejecutar de nuevo para capturar casos
    // que no se detectaron en la primera pasada (cuando un fix consume
    // parte del string que otro fix necesitaba)
    // ==========================================================================
    if (fixes.length > 0) {
        const secondPass = fixMalformedEdgeLabels(result);
        if (secondPass.fixes.length > 0) {
            return {
                fixed: secondPass.fixed,
                fixes: [...fixes, ...secondPass.fixes]
            };
        }
    }

    return {
        fixed: result,
        fixes: fixes
    };
};

// =============================================================================
// FIX PARA EDGE LABELS CON CONTENIDO PROBLEMÁTICO
// =============================================================================

/**
 * Detecta y corrige edge labels con paréntesis o comillas sin entrecomillar.
 * 
 * Sintaxis de edge labels en Mermaid:
 *   A -->|texto| B
 *   A --o|texto| B
 *   A -.->|texto| B
 *   A ==>|texto| B
 *   A -->|"texto entrecomillado"| B
 * 
 * El problema ocurre cuando hay paréntesis () o comillas internas dentro 
 * del texto del label sin entrecomillar, porque Mermaid los interpreta 
 * como sintaxis especial (nodo redondo, string literal, etc.).
 * 
 * @param {string} line - Línea a procesar
 * @returns {{fixed: string, fixes: Array<{original: string, fixed: string, start: number, end: number}>}}
 */
const fixEdgeLabels = (line) => {
    const fixes = [];

    // Regex para encontrar edge labels: |texto|
    // Captura el pipe de apertura, el contenido, y el pipe de cierre
    // Soporta todos los tipos de flechas que preceden al label
    // 
    // Pattern: (?:--|->|=>|-.->|--o|--x|<-->|o--|x--) seguido de un |...|
    // Usamos un approach más simple: buscar todos los |...| que no estén 
    // al inicio de línea (para no confundir con otras sintaxis)

    // Regex explicación:
    // (-->|--o|--x|-.->|==>|--) - Tipos de flecha (capturamos para mantener)
    // \s*                       - Espacios opcionales
    // \|                        - Pipe de apertura
    // ([^|]+)                   - Contenido del label (sin pipes)
    // \|                        - Pipe de cierre
    const edgeLabelPattern = /(-->|--o|--x|-\.->|==>|--|<-->|o--|x--)\s*\|([^|]+)\|/g;

    let match;
    while ((match = edgeLabelPattern.exec(line)) !== null) {
        const [fullMatch, arrow, labelContent] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Si el contenido ya está entrecomillado, no hacer nada
        if (isFullyQuoted(labelContent.trim())) {
            continue;
        }

        // Verificar si tiene contenido problemático
        if (hasProblematicContent(labelContent)) {
            // Entrecomillar el contenido del label
            const quotedContent = safeQuote(labelContent);
            const fixedMatch = `${arrow}|${quotedContent}|`;

            fixes.push({
                original: fullMatch,
                fixed: fixedMatch,
                start: start,
                end: end,
                type: 'edge_label'
            });
        }
    }

    // Aplicar fixes de derecha a izquierda
    let result = line;
    const sortedFixes = [...fixes].sort((a, b) => b.start - a.start);

    for (const fix of sortedFixes) {
        result = result.slice(0, fix.start) + fix.fixed + result.slice(fix.end);
    }

    return {
        fixed: result,
        fixes: fixes
    };
};

// =============================================================================
// PARSER DE NODOS MEJORADO
// =============================================================================

/**
 * Obtiene los rangos de la línea que están entrecomillados.
 * Útil para evitar procesar "falsos nodos" que están dentro de strings.
 * 
 * @param {string} line 
 * @returns {Array<{start: number, end: number}>}
 */
const getQuotedRanges = (line) => {
    const ranges = [];
    let inQuote = false;
    let quoteChar = '';
    let start = -1;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i - 1] : '';

        if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inQuote) {
                inQuote = true;
                quoteChar = char;
                start = i;
            } else if (char === quoteChar) {
                inQuote = false;
                ranges.push({ start, end: i + 1 });
            }
        }
    }
    return ranges;
};

/**
 * Verifica si un índice está dentro de algún rango entrecomillado
 * @param {number} index 
 * @param {Array<{start: number, end: number}>} ranges 
 * @returns {boolean}
 */
const isInsideQuotes = (index, ranges) => {
    return ranges.some(r => index > r.start && index < r.end);
};

/**
 * Extrae nodos de una línea usando parsing manual (no solo regex)
 * Esto es más robusto para casos complejos
 * 
 * @param {string} line - Línea a procesar
 * @returns {Array<{original: string, fixed: string, start: number, end: number}>}
 */
const parseAndFixNodes = (line) => {
    const fixes = [];
    const quotedRanges = getQuotedRanges(line);

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
        // Flag/Asymmetric: > ... ] (nota: sintaxis única id>text])
        { open: '>', close: ']', name: 'flag' },
    ];

    // Procesar formas especiales primero
    for (const shape of shapePatterns) {
        // Crear regex para esta forma específica
        // Captura: ID + delimitador apertura + contenido + delimitador cierre + opcional :::clase
        const openEsc = shape.open.replace(/([\\/\\()[\]{}])/g, '\\$1');
        const closeEsc = shape.close.replace(/([\\/\\()[\]{}])/g, '\\$1');

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

            // Ignorar si el match empieza dentro de comillas (falso positivo)
            if (isInsideQuotes(start, quotedRanges)) continue;

            // Verificar que no estamos dentro de otro match ya procesado
            const alreadyProcessed = fixes.some(f =>
                (start >= f.start && start < f.end) ||
                (end > f.start && end <= f.end)
            );
            if (alreadyProcessed) continue;

            // =====================================================================
            // Validación especial para flag: verificar que NO es un tag HTML
            // IMPORTANTE: Este check debe estar ANTES de cualquier otro procesamiento
            // El patrón flag (id>text]) puede coincidir falsamente con HTML como:
            //   <b>texto] → matchea "b" como nodeId y ">texto]" como flag
            // Debemos verificar que el carácter anterior al nodeId NO es '<'
            // =====================================================================
            if (shape.name === 'flag') {
                // Si hay un '<' justo antes del nodeId, es un tag HTML, no un flag
                if (start > 0 && line[start - 1] === '<') {
                    continue; // Es HTML tag, no un nodo flag
                }
            }

            // =================================================================
            // FIX: Clases CSS mal ubicadas DENTRO del contenido de formas especiales
            // Ejemplo: ((":::res1 texto")) → (("texto")):::res1
            // =================================================================
            const misplacedClassResultSpecial = fixMisplacedClassInNodeContent(content);
            if (misplacedClassResultSpecial.wasFixed) {
                const existingModSpecial = modifier ? modifier.trim() : '';
                const combinedClassesSpecial = misplacedClassResultSpecial.extractedClasses + existingModSpecial;
                const fixedSpecial = `${nodeId}${openDelim}${misplacedClassResultSpecial.cleanContent}${closeDelim}${combinedClassesSpecial}`;

                if (fixedSpecial !== fullMatch) {
                    fixes.push({
                        original: fullMatch,
                        fixed: fixedSpecial,
                        start: start,
                        end: end
                    });
                    continue; // Ya procesado
                }
            }

            // =================================================================
            // CHECK FOR LEAKED CONTENT (content outside brackets)
            // =================================================================
            const leak = detectLeakedContent(line, end);
            if (leak) {
                const mergedContent = content + leak.leaked;
                const finalStyle = leak.style || modifier || '';

                // Siempre aplicar fix si hubo leak
                const quoted = safeQuote(mergedContent); // Handles internal quotes
                const fixed = `${nodeId}${openDelim}${quoted}${closeDelim}${finalStyle}`;

                // Verificar overlap con leak incluido
                const leakProcessed = fixes.some(f =>
                    (leak.fullEndIndex > f.start && leak.fullEndIndex <= f.end)
                );

                if (!leakProcessed && fixed !== fullMatch + leak.originalLeakString) {
                    fixes.push({
                        original: fullMatch + leak.originalLeakString,
                        fixed: fixed,
                        start: start,
                        end: leak.fullEndIndex
                    });
                    continue; // Skip standard processing
                }
            }

            // Validación especial: para circle, verificar que no es parte de double_circle
            if (shape.name === 'circle') {
                // Verificar si hay ( antes o ) después
                if (start > 0 && line[start + nodeId.length] === '(' &&
                    line[start + nodeId.length + 1] === '(' &&
                    line[start + nodeId.length + 2] === '(') {
                    continue; // Es double_circle, saltar
                }
            }

            // =====================================================================
            // FIX ESPECIAL PARA NODOS FLAG: id>["text"] → id>"text"]
            // Los usuarios a menudo escriben >["texto"] cuando la sintaxis correcta
            // es >"texto"]. Detectamos y corregimos este patrón común.
            // 
            // IMPORTANTE: El regex captura:
            //   - content: ["⚠️ ART..."  (el contenido entre > y ])
            //   - closeDelim: ]
            // Por lo tanto, el contenido empieza con [" y termina con "
            // =====================================================================
            if (shape.name === 'flag') {
                const trimmedContent = content.trim();

                // Patrón principal: contenido empieza con [" y termina con "
                // Ejemplo: >["texto ABC"] → contenido es ["texto ABC"
                if (trimmedContent.startsWith('["') && trimmedContent.endsWith('"')) {
                    // Extraer el contenido real: quitar [" del inicio y " del final
                    const innerContent = trimmedContent.slice(2, -1);
                    // Escapar comillas internas si las hay
                    const escapedContent = innerContent.replace(/"/g, '&quot;');
                    const fixed = `${nodeId}>"${escapedContent}"]${modifier || ''}`;

                    fixes.push({
                        original: fullMatch,
                        fixed: fixed,
                        start: start,
                        end: end
                    });
                    continue; // Ya procesado, no seguir con el flujo normal
                }

                // Patrón secundario: solo [ extra al inicio (sin comillas)
                // Ejemplo: >[texto] → contenido es [texto
                if (trimmedContent.startsWith('[') && !trimmedContent.startsWith('["')) {
                    // El usuario puso un [ extra, quitarlo y entrecomillar
                    const cleanContent = trimmedContent.slice(1);
                    const quoted = safeQuote(cleanContent);
                    const fixed = `${nodeId}>${quoted}]${modifier || ''}`;

                    fixes.push({
                        original: fullMatch,
                        fixed: fixed,
                        start: start,
                        end: end
                    });
                    continue;
                }
            }

            // Solo procesar si tiene contenido problemático (paréntesis o comillas) Y no está entrecomillado
            if (hasProblematicContent(content)) {
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

    // =========================================================================
    // MODIFICACIÓN: Procesar [] y {} ANTES que ()
    // Los paréntesis son muy comunes en texto (ej: "Texto (Nota)"), por lo que
    // el parser de nodos redondos () es propenso a falsos positivos "dentro" de otros nodos.
    // Al procesar [] y {} primero, "blindamos" esas áreas y evitamos que
    // el parser de () intente arreglar texto que ya es parte de otro nodo.
    // =========================================================================

    // Regex para encontrar el inicio de un nodo: word + spaces + (

    // IMPORTANTE: Excluir formas especiales que ya fueron procesadas
    // Regex actualizado: captura el modificador :::class incluso con espacios antes
    const bracketRegex = /(\w+)\s*\[([^\]]+)\](\s*:::?\w+)?/g;
    let match;

    while ((match = bracketRegex.exec(line)) !== null) {
        const [fullMatch, nodeId, content, modifierWithSpace] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Ignorar si empieza dentro de comillas
        if (isInsideQuotes(start, quotedRanges)) continue;

        const alreadyProcessed = fixes.some(f =>
            (start >= f.start && start < f.end) ||
            (end > f.start && end <= f.end)
        );
        if (alreadyProcessed) continue;

        // =================================================================
        // FIX: Clases CSS mal ubicadas DENTRO del contenido del nodo []
        // Ejemplo: [":::res1 texto"] → ["texto"]:::res1
        // DEBE ejecutarse ANTES de otros checks para detectar el patrón
        // =================================================================
        const misplacedClassResult = fixMisplacedClassInNodeContent(content);
        if (misplacedClassResult.wasFixed) {
            // Combinar clases extraídas con clases existentes fuera del nodo
            const existingMod = modifierWithSpace ? modifierWithSpace.trim() : '';
            const combinedClasses = misplacedClassResult.extractedClasses + existingMod;
            const fixed = `${nodeId}[${misplacedClassResult.cleanContent}]${combinedClasses}`;

            if (fixed !== fullMatch) {
                fixes.push({
                    original: fullMatch,
                    fixed: fixed,
                    start: start,
                    end: end
                });
                continue; // Ya procesado, pasar al siguiente nodo
            }
        }

        // =================================================================
        // CHECK FOR LEAKED CONTENT (content outside brackets)
        // =================================================================
        const leak = detectLeakedContent(line, end);
        if (leak) {
            const mergedContent = (content + leak.leaked).trim();
            // IMPORTANTE: Eliminar espacios antes del modificador :::
            const existingMod = modifierWithSpace ? modifierWithSpace.trim() : '';
            const finalStyle = leak.style || existingMod || '';

            const quoted = safeQuote(mergedContent);
            const fixed = `${nodeId}[${quoted}]${finalStyle}`;

            // Verificar overlap con leak incluido
            const leakProcessed = fixes.some(f =>
                (leak.fullEndIndex > f.start && leak.fullEndIndex <= f.end)
            );

            if (!leakProcessed && fixed !== fullMatch + leak.originalLeakString) {
                fixes.push({
                    original: fullMatch + leak.originalLeakString,
                    fixed: fixed,
                    start: start,
                    end: leak.fullEndIndex
                });
                continue; // Skip standard processing
            }
        }

        // Verificar que no es una forma especial (contenido empieza con /, \, [, ()
        const firstChar = content.trim()[0];
        if (firstChar === '/' || firstChar === '\\' || firstChar === '[' || firstChar === '(') {
            continue; // Es forma especial, ya debería estar procesada
        }

        // Verificar si ya está entrecomillado
        if (isFullyQuoted(content.trim())) {
            continue; // Ya está bien
        }

        // Solo corregir si tiene contenido problemático (paréntesis o comillas)
        if (hasProblematicContent(content)) {
            const quoted = safeQuote(content);
            // IMPORTANTE: Eliminar espacios antes del modificador :::
            // Algunos navegadores/versiones de Mermaid no aceptan "content"] :::class
            const modifier = modifierWithSpace ? modifierWithSpace.trim() : '';
            const fixed = `${nodeId}[${quoted}]${modifier}`;

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

        // Ignorar si empieza dentro de comillas
        if (isInsideQuotes(start, quotedRanges)) continue;

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

        // =================================================================
        // FIX: Clases CSS mal ubicadas DENTRO del contenido del nodo {}
        // Ejemplo: {:::res1 texto} → {"texto"}:::res1
        // =================================================================
        const misplacedClassResultBrace = fixMisplacedClassInNodeContent(content);
        if (misplacedClassResultBrace.wasFixed) {
            const existingModBrace = modifier ? modifier.trim() : '';
            const combinedClassesBrace = misplacedClassResultBrace.extractedClasses + existingModBrace;
            const fixedBrace = `${nodeId}{${misplacedClassResultBrace.cleanContent}}${combinedClassesBrace}`;

            if (fixedBrace !== fullMatch) {
                fixes.push({
                    original: fullMatch,
                    fixed: fixedBrace,
                    start: start,
                    end: end
                });
                continue;
            }
        }

        // =================================================================
        // CHECK FOR LEAKED CONTENT (content outside brackets)
        // =================================================================
        const leak = detectLeakedContent(line, end);
        if (leak) {
            const mergedContent = (content + leak.leaked).trim();
            const finalStyle = leak.style || modifier || '';

            const quoted = safeQuote(mergedContent);
            const fixed = `${nodeId}{${quoted}}${finalStyle}`;

            // Verificar overlap con leak incluido
            const leakProcessed = fixes.some(f =>
                (leak.fullEndIndex > f.start && leak.fullEndIndex <= f.end)
            );

            if (!leakProcessed && fixed !== fullMatch + leak.originalLeakString) {
                fixes.push({
                    original: fullMatch + leak.originalLeakString,
                    fixed: fixed,
                    start: start,
                    end: leak.fullEndIndex
                });
                continue; // Skip standard processing
            }
        }

        // Verificar si ya está entrecomillado
        if (isFullyQuoted(content.trim())) continue;

        // Solo corregir si tiene contenido problemático (paréntesis o comillas)
        if (hasProblematicContent(content)) {
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

    // =========================================================================
    // FIX PRO: Parsing manual de nodos redondos id(...) con paréntesis anidados
    // Este se ejecuta AL FINAL porque es el más "codicioso" y ambiguo.
    // =========================================================================

    // Regex para encontrar el inicio de un nodo: word + spaces + (
    const startRegex = /(\w+)\s*\(/g;
    let startMatch;

    while ((startMatch = startRegex.exec(line)) !== null) {
        const nodeId = startMatch[1];
        const openParenIndex = startMatch.index + startMatch[0].length - 1; // Index of '('
        const matchStartIndex = startMatch.index;

        // Ignorar si empieza dentro de comillas
        if (isInsideQuotes(matchStartIndex, quotedRanges)) continue;

        // Verificar que NO es una forma especial
        // Formas especiales que empiezan con (: ((, (((, ([, (\
        if (openParenIndex + 1 < line.length) {
            const nextChar = line[openParenIndex + 1];
            if (nextChar === '(' || nextChar === '[' || nextChar === '\\' || nextChar === '/') {
                continue; // Es una forma especial, ya procesada arriba
            }
        }

        const isProcessed = fixes.some(f =>
            matchStartIndex >= f.start && matchStartIndex < f.end
        );
        if (isProcessed) continue;

        // Buscar el cierre balanceado )
        let balance = 1;
        let closeParenIndex = -1;
        let inQuotes = false;
        let quoteChar = '';

        for (let i = openParenIndex + 1; i < line.length; i++) {
            const char = line[i];
            const prevChar = i > 0 ? line[i - 1] : '';

            // Manejar comillas para ignorar parens dentro de strings
            if ((char === '"' || char === "'") && prevChar !== '\\') {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                }
            }

            if (!inQuotes) {
                if (char === '(') balance++;
                else if (char === ')') {
                    balance--;
                    if (balance === 0) {
                        closeParenIndex = i;
                        break;
                    }
                }
            }
        }

        if (closeParenIndex !== -1) {
            // Encontramos el nodo completo: id ( content )
            const content = line.substring(openParenIndex + 1, closeParenIndex);

            // Buscar modificador opcional después (:::class)
            let modifier = '';
            const remainingLine = line.substring(closeParenIndex + 1);
            const modMatch = remainingLine.match(/^\s*(:::?[\w\-]+)/);
            if (modMatch) {
                modifier = modMatch[1];
            }

            // Calcular el string completo original
            const totalEnd = closeParenIndex + 1 + (modMatch ? modMatch[0].length : 0);
            const finalFullMatch = line.substring(startMatch.index, totalEnd);

            // =================================================================
            // FIX: Clases CSS mal ubicadas DENTRO del contenido del nodo ()
            // Ejemplo: (:::res1 texto) → ("texto"):::res1
            // =================================================================
            const misplacedClassResultParen = fixMisplacedClassInNodeContent(content);
            if (misplacedClassResultParen.wasFixed) {
                const existingModParen = modifier ? modifier.trim() : '';
                const combinedClassesParen = misplacedClassResultParen.extractedClasses + existingModParen;
                const fixedParen = `${nodeId}(${misplacedClassResultParen.cleanContent})${combinedClassesParen}`;

                if (fixedParen !== finalFullMatch) {
                    fixes.push({
                        original: finalFullMatch,
                        fixed: fixedParen,
                        start: startMatch.index,
                        end: totalEnd
                    });
                    continue;
                }
            }

            // =================================================================
            // CHECK FOR LEAKED CONTENT (content outside brackets)
            // =================================================================
            const leak = detectLeakedContent(line, totalEnd);
            if (leak) {
                const mergedContent = (content + leak.leaked).trim();
                const finalStyle = leak.style || modifier || '';

                // Siempre aplicar fix si hubo leak
                const quoted = safeQuote(mergedContent);
                const fixed = `${nodeId}(${quoted})${finalStyle}`;

                // Verificar overlap con leak incluido
                const leakProcessed = fixes.some(f =>
                    (leak.fullEndIndex > f.start && leak.fullEndIndex <= f.end)
                );

                if (!leakProcessed && fixed !== finalFullMatch + leak.originalLeakString) {
                    fixes.push({
                        original: finalFullMatch + leak.originalLeakString,
                        fixed: fixed,
                        start: startMatch.index,
                        end: leak.fullEndIndex
                    });
                    continue; // Skip standard processing
                }
            }

            // Solo procesar si tiene contenido problemático
            if (hasProblematicContent(content)) {
                // Para nodos redondos, si hay paréntesis internos, SIEMPRE debemos entrecomillar
                const fixedContent = safeQuote(content);
                const fixed = `${nodeId}(${fixedContent})${modifier}`;

                if (fixed !== finalFullMatch) {
                    fixes.push({
                        original: finalFullMatch,
                        fixed: fixed,
                        start: startMatch.index,
                        end: totalEnd
                    });
                }
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
 * @returns {{code: string, fixes: Array, hasChanges: boolean, diagramType: string}}
 */
export const autoFixMermaidCode = (code) => {
    const allFixes = [];

    // Detectar tipo de diagrama para manejar estilos específicos
    const diagramType = getDiagramType(code);
    const styleSupport = DIAGRAM_STYLE_SUPPORT[diagramType] || DIAGRAM_STYLE_SUPPORT.unknown;

    const lines = code.split('\n');

    // =========================================================================
    // FIX ESTRUCTURAL: Detectar y corregir 'end' huérfanos ANTES de otros fixes
    // Esto debe ejecutarse primero porque un 'end' huérfano causa errores de
    // parsing que impiden que otros fixes se detecten correctamente.
    // =========================================================================
    const orphanEndResult = fixOrphanEnds(lines);
    const preprocessedLines = orphanEndResult.lines;
    orphanEndResult.fixes.forEach(fix => allFixes.push(fix));

    const fixedLines = preprocessedLines.map((line, index) => {
        // =================================================================
        // MANEJO ESPECIAL DE DIRECTIVAS DE ESTILO POR TIPO DE DIAGRAMA
        // =================================================================

        // Detectar directivas 'style nodeId' (NO soportadas en mindmaps)
        if (/^\s*style\s+\w+/.test(line)) {
            if (!styleSupport.style) {
                // El diagrama no soporta 'style' - eliminar la línea y reportar
                allFixes.push({
                    line: index + 1,
                    type: 'unsupported_style_directive',
                    original: line.trim(),
                    fixed: '(línea eliminada)',
                    description: `Los diagramas tipo '${diagramType}' no soportan directivas 'style'. Se renderizaría como texto.`
                });
                return null; // Marcar para eliminar
            }
            return line; // Mantener en diagramas que sí soportan
        }

        // Detectar directivas 'class node1,node2 className' (NO soportadas en mindmaps)
        if (/^\s*class\s+[\w,]+\s+\w+/.test(line)) {
            if (!styleSupport.classAssign) {
                // El diagrama no soporta asignación de clase con 'class' keyword
                allFixes.push({
                    line: index + 1,
                    type: 'unsupported_class_assign',
                    original: line.trim(),
                    fixed: '(línea eliminada)',
                    description: `Los diagramas tipo '${diagramType}' no soportan 'class nodeId className'. Usa ':::className' inline.`
                });
                return null; // Marcar para eliminar
            }
            return line;
        }

        // Ignorar líneas que no necesitan procesamiento
        if (
            /^\s*%%/.test(line) ||           // Comentarios
            /^\s*classDef\s/.test(line) ||   // Definiciones de clase (soportadas en mindmaps)
            /^\s*graph\s/.test(line) ||      // Declaración de grafo
            /^\s*flowchart\s/.test(line) ||  // Declaración de flowchart
            /^\s*sequenceDiagram/.test(line) || // Diagrama de secuencia
            /^\s*mindmap/.test(line) ||      // Declaración de mindmap
            /^\s*end\s*$/.test(line) ||      // Cierre de subgraph
            /^\s*direction\s/.test(line) ||  // Dirección
            /^\s*$/.test(line)               // Líneas vacías
        ) {
            return line;
        }


        // FIX ESPECIAL: Subgraph titles con paréntesis
        // Sintaxis: subgraph ID [título que puede tener (paréntesis)]
        // Los paréntesis en títulos de subgraph causan parse errors
        if (/^\s*subgraph\s/.test(line)) {
            const result = fixSubgraphTitle(line);
            if (result.wasModified) {
                allFixes.push({
                    line: index + 1,
                    original: `subgraph title: ${result.original}`,
                    fixed: `subgraph title: ${result.fixedTitle}`
                });
                return result.fixed;
            }
            return line; // Subgraph sin problemas
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

        // FIX ESPECIAL: Sintaxis inválida después de nodos
        // Patrones como NODE[text]:(annotation):::class son inválidos
        // El : seguido de texto (no :::) causa parse error "got COLON"
        const trailingResult = fixInvalidTrailingSyntax(line);
        let currentLine = line;

        if (trailingResult.wasModified) {
            allFixes.push({
                line: index + 1,
                original: `trailing syntax: ${trailingResult.removed}`,
                fixed: 'removed invalid trailing text'
            });
            currentLine = trailingResult.fixed;
        }

        // FIX ESPECIAL: Edge labels con delimitadores INCORRECTOS
        // Patrones como -->|texto] en lugar de -->|texto| (] debería ser |)
        // DEBE ejecutarse ANTES de fixEdgeLabels para corregir la estructura primero
        const malformedEdgeLabelResult = fixMalformedEdgeLabels(currentLine);

        if (malformedEdgeLabelResult.fixes.length > 0) {
            malformedEdgeLabelResult.fixes.forEach(fix => {
                allFixes.push({
                    line: index + 1,
                    original: `edge label delimiter: ${fix.wrongDelim} → |`,
                    fixed: `edge label: ${fix.fixed}`,
                    type: fix.type
                });
            });
            currentLine = malformedEdgeLabelResult.fixed;
        }

        // FIX ESPECIAL: Edge labels con paréntesis o comillas
        // Patrones como -->|texto (problemático)| causan parse error "got PS"
        const edgeLabelResult = fixEdgeLabels(currentLine);

        if (edgeLabelResult.fixes.length > 0) {
            edgeLabelResult.fixes.forEach(fix => {
                allFixes.push({
                    line: index + 1,
                    original: `edge label: ${fix.original}`,
                    fixed: `edge label: ${fix.fixed}`
                });
            });
            currentLine = edgeLabelResult.fixed;
        }

        // Parsear y corregir nodos en esta línea
        const lineFixes = parseAndFixNodes(currentLine);

        if (lineFixes.length > 0) {
            const fixedLine = applyFixes(currentLine, lineFixes);

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

        // =====================================================================
        // FIX GLOBAL: Eliminar espacios antes de ::: en TODOS los nodos
        // Algunos navegadores/versiones de Mermaid no aceptan "] :::class"
        // Debe ser "]:::class" sin espacio
        // Este fix se aplica INCLUSO si no hubo otros cambios en la línea
        // =====================================================================
        const spaceBeforeClassPattern = /(\]|\}|\)|(?:\]\])|(?:\)\))|(?:\)\]\]))\s+(:::?\w+)/g;
        if (spaceBeforeClassPattern.test(currentLine)) {
            const fixedLine = currentLine.replace(/(\]|\}|\)|(?:\]\])|(?:\)\))|(?:\)\]\]))\s+(:::?\w+)/g, '$1$2');
            if (fixedLine !== currentLine) {
                allFixes.push({
                    line: index + 1,
                    original: 'space before :::',
                    fixed: 'removed space before class separator'
                });
                return fixedLine;
            }
        }

        // Retornar la línea (posiblemente modificada por trailing fix)
        return currentLine;
    });

    // Filtrar líneas marcadas como null (eliminadas por directivas no soportadas)
    const cleanedLines = fixedLines.filter(line => line !== null);

    return {
        code: cleanedLines.join('\n'),
        fixes: allFixes,
        hasChanges: allFixes.length > 0,
        diagramType: diagramType
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

    // Detectar tipo de diagrama para verificar soporte de estilos
    const diagramType = getDiagramType(code);
    const styleSupport = DIAGRAM_STYLE_SUPPORT[diagramType] || DIAGRAM_STYLE_SUPPORT.unknown;

    // =========================================================================
    // DETECCIÓN DE 'END' HUÉRFANOS (sin subgraph correspondiente)
    // Usamos un contador de stack para rastrear subgraphs abiertos.
    // =========================================================================
    let subgraphStack = 0;
    lines.forEach((line, index) => {
        const trimmed = line.trim().toLowerCase();

        // Ignorar comentarios (incluidos los auto-fix previos)
        if (trimmed.startsWith('%%')) return;

        // Contar apertura de subgraph
        if (/^subgraph\s/.test(trimmed) || trimmed === 'subgraph') {
            subgraphStack++;
            return;
        }

        // Detectar 'end'
        if (/^end\s*$/.test(trimmed)) {
            if (subgraphStack > 0) {
                subgraphStack--;
            } else {
                // end huérfano detectado
                issues.push({
                    line: index + 1,
                    type: 'orphan_end',
                    content: line.trim(),
                    description: "'end' sin subgraph correspondiente - será comentado automáticamente"
                });
            }
        }
    });

    lines.forEach((line, index) => {
        // =================================================================
        // DETECCIÓN DE DIRECTIVAS DE ESTILO NO SOPORTADAS
        // =================================================================

        // Detectar 'style nodeId' en diagramas que no lo soportan (ej: mindmaps)
        if (/^\s*style\s+\w+/.test(line) && !styleSupport.style) {
            issues.push({
                line: index + 1,
                type: 'unsupported_style_directive',
                content: line.trim(),
                description: `Los diagramas tipo '${diagramType}' no soportan directivas 'style'. Se renderiza como texto.`
            });
            return;
        }

        // Detectar 'class nodeId className' en diagramas que no lo soportan
        if (/^\s*class\s+[\w,]+\s+\w+/.test(line) && !styleSupport.classAssign) {
            issues.push({
                line: index + 1,
                type: 'unsupported_class_assign',
                content: line.trim(),
                description: `Los diagramas tipo '${diagramType}' no soportan 'class nodeId className'. Usa ':::className' inline.`
            });
            return;
        }

        // Ignorar líneas especiales que no necesitan análisis
        if (
            /^\s*%%/.test(line) ||            // Comentarios
            /^\s*classDef\s/.test(line) ||    // classDef SÍ es soportado en mindmaps
            /^\s*style\s/.test(line) ||       // Ya procesado arriba si no era soportado
            /^\s*class\s/.test(line) ||       // Ya procesado arriba si no era soportado
            /^\s*$/.test(line)                // Líneas vacías
        ) {
            return;
        }


        // Detectar problemas en subgraph titles
        if (/^\s*subgraph\s/.test(line)) {
            const result = fixSubgraphTitle(line);
            if (result.wasModified) {
                issues.push({
                    line: index + 1,
                    type: 'unquoted_subgraph_title',
                    content: result.original,
                    description: 'Título de subgraph con paréntesis sin entrecomillar'
                });
            }
            return;
        }

        // Detectar edge labels con delimitadores incorrectos (] } ) en lugar de |)
        const malformedEdgeLabelResult = fixMalformedEdgeLabels(line);
        if (malformedEdgeLabelResult.fixes.length > 0) {
            malformedEdgeLabelResult.fixes.forEach(fix => {
                issues.push({
                    line: index + 1,
                    type: 'malformed_edge_label_delimiter',
                    content: fix.original,
                    description: `Edge label cerrado con '${fix.wrongDelim}' en lugar de '|'`
                });
            });
        }

        // Detectar problemas en edge labels (contenido problemático)
        const edgeLabelResult = fixEdgeLabels(line);
        if (edgeLabelResult.fixes.length > 0) {
            edgeLabelResult.fixes.forEach(fix => {
                issues.push({
                    line: index + 1,
                    type: 'unquoted_edge_label',
                    content: fix.original,
                    description: 'Edge label con paréntesis o comillas sin entrecomillar'
                });
            });
        }

        // Usar el mismo parser para detectar problemas en nodos
        const lineFixes = parseAndFixNodes(line);

        if (lineFixes.length > 0) {
            lineFixes.forEach(fix => {
                issues.push({
                    line: index + 1,
                    type: 'unquoted_special_chars',
                    content: fix.original,
                    description: 'Paréntesis o comillas internas sin escapar correctamente'
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
        // Flag/Asymmetric: id>text] - word followed by >
        { name: 'flag', pattern: /\w>/ },
    ];

    for (const { name, pattern } of patterns) {
        if (pattern.test(code)) {
            found.push(name);
        }
    }

    return found;
};
