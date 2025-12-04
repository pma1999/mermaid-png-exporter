import { useState, useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";

// Configuración inicial de Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "JetBrains Mono, monospace",
  flowchart: { useMaxWidth: false, htmlLabels: true, curve: "basis" },
  sequence: { useMaxWidth: false, wrap: true },
  gantt: { useMaxWidth: false },
  er: { useMaxWidth: false },
  pie: { useMaxWidth: false },
  mindmap: { useMaxWidth: false },
});

const DEFAULT_DIAGRAM = `flowchart TD
    A[📝 Pega tu código] --> B{¿Es válido?}
    B -->|Sí| C[✨ Renderizado]
    B -->|No| D[🔧 Revisa sintaxis]
    C --> E[📥 Descarga PNG]
    D --> A
    
    style A fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style B fill:#16213e,stroke:#00d9ff,color:#fff
    style C fill:#0f3460,stroke:#00ff88,color:#fff
    style D fill:#1a1a2e,stroke:#ff6b6b,color:#fff
    style E fill:#0f3460,stroke:#00ff88,color:#fff`;

const EXAMPLE_DIAGRAMS = {
  flowchart: `flowchart LR
    subgraph Entrada
        A[Usuario] --> B[Formulario]
    end
    subgraph Proceso
        B --> C{Validación}
        C -->|OK| D[Base de Datos]
        C -->|Error| E[Notificación]
    end
    subgraph Salida
        D --> F[Confirmación]
        E --> B
    end`,
  sequence: `sequenceDiagram
    participant U as 👤 Usuario
    participant S as 🖥️ Sistema
    participant DB as 🗄️ Base de Datos
    
    U->>S: Solicitud de datos
    activate S
    S->>DB: Query
    activate DB
    DB-->>S: Resultados
    deactivate DB
    S-->>U: Respuesta JSON
    deactivate S`,
  classDiagram: `classDiagram
    class Usuario {
        +String nombre
        +String email
        +login()
        +logout()
    }
    class Proyecto {
        +String titulo
        +Date fecha
        +getDetalles()
    }
    class Tarea {
        +String descripcion
        +Boolean completada
        +marcarCompleta()
    }
    Usuario "1" --> "*" Proyecto : gestiona
    Proyecto "1" --> "*" Tarea : contiene`,
  stateDiagram: `stateDiagram-v2
    [*] --> Borrador
    Borrador --> EnRevisión : enviar
    EnRevisión --> Aprobado : aprobar
    EnRevisión --> Borrador : rechazar
    Aprobado --> Publicado : publicar
    Publicado --> [*]
    
    state EnRevisión {
        [*] --> Pendiente
        Pendiente --> Revisando
        Revisando --> [*]
    }`,
  erDiagram: `erDiagram
    USUARIO ||--o{ PEDIDO : realiza
    PEDIDO ||--|{ LINEA_PEDIDO : contiene
    PRODUCTO ||--o{ LINEA_PEDIDO : incluido_en
    
    USUARIO {
        int id PK
        string nombre
        string email
    }
    PEDIDO {
        int id PK
        date fecha
        float total
    }
    PRODUCTO {
        int id PK
        string nombre
        float precio
    }`,
  gantt: `gantt
    title Cronograma del Proyecto
    dateFormat YYYY-MM-DD
    section Planificación
        Análisis           :a1, 2024-01-01, 15d
        Diseño             :a2, after a1, 20d
    section Desarrollo
        Frontend           :a3, after a2, 30d
        Backend            :a4, after a2, 25d
    section Testing
        QA                 :a5, after a3, 15d
        Deploy             :a6, after a5, 5d`,
  pie: `pie showData
    title Distribución del Presupuesto
    "Desarrollo" : 45
    "Diseño" : 20
    "Marketing" : 15
    "Infraestructura" : 12
    "Otros" : 8`,
  mindmap: `mindmap
  root((Proyecto))
    Investigación
      Análisis de mercado
      Competencia
      Usuarios
    Diseño
      UX
      UI
      Prototipo
    Desarrollo
      Frontend
      Backend
      Testing
    Lanzamiento
      Marketing
      Soporte`,
};

// ============================================================================
// SISTEMA DE MANEJO DE ERRORES ROBUSTO Y AUTOFIX
// ============================================================================

/**
 * Sistema de Auto-corrección global de código Mermaid
 * Analiza todo el código y corrige patrones problemáticos conocidos
 */
const autoFixMermaidCode = (code) => {
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
 * Corrige nodos con corchetes [] que contienen paréntesis ()
 * Este es el error más común en Mermaid
 * 
 * Ejemplo:
 *   INPUT:  RES1[Texto (con paréntesis)]:::process
 *   OUTPUT: RES1["Texto (con paréntesis)"]:::process
 */
const fixBracketNodesWithParentheses = (line) => {
  // Encontrar todos los nodos con formato ID[contenido], ID{contenido} o ID(contenido)
  // que contengan caracteres problemáticos (paréntesis sin escapar, comillas internas, etc.)

  const result = [];
  let lastIndex = 0;

  // Regex para encontrar nodos: captura ID + [contenido] o {contenido} o (contenido) + opcional :::clase
  // Usamos un enfoque iterativo para manejar múltiples nodos por línea
  // Actualizado para soportar [], {} y () 
  // IMPORTANTE: Para () usamos un regex que evita capturar formas especiales como ((...)) o ([...])
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
      // No debería llegar aquí
      result.push(fullMatch);
      lastIndex = matchStart + fullMatch.length;
      continue;
    }

    // Añadir el texto antes del match
    result.push(line.slice(lastIndex, matchStart));

    const trimmedContent = content.trim();

    // Detectar formas especiales que NO debemos modificar:
    // [(...)] [[...]] [/.../] [\...\] {{...}} ((...)) ([...])
    const isSpecialShape = /^[\(\[\{\/\\]/.test(trimmedContent);

    // Verificar si el contenido ya está correctamente entre comillas
    const alreadyQuoted = /^["'].*["']$/.test(trimmedContent);

    // Detectar si hay comillas internas SIN que el contenido esté completamente entrecomillado
    const hasInternalQuotes = /["']/.test(content) && !alreadyQuoted;

    // Detectar si contiene paréntesis problemáticos (solo para [] y {})
    const hasProblematicParens = (openChar !== '(') && content.includes('(') && content.includes(')');

    // Necesita corrección si NO es forma especial Y:
    // 1. Tiene paréntesis problemáticos (en [] o {}) y no está entre comillas
    // 2. O tiene comillas internas que causan conflicto
    // IMPORTANTE: Las formas especiales NUNCA se modifican (cilindros, subroutines, etc.)
    const needsFix = !isSpecialShape && (
      (!alreadyQuoted && hasProblematicParens) ||
      (!alreadyQuoted && hasInternalQuotes)
    );

    if (needsFix) {
      // Escapar comillas internas si las hay
      let fixedContent = content;
      if (hasInternalQuotes) {
        // Reemplazar comillas dobles por entidad HTML o escaparlas
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
 * Analiza el código y devuelve problemas detectados sin corregir
 */
const analyzeCode = (code) => {
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

/**
 * Extrae la línea real del error buscando el fragmento en el código
 */
const findActualErrorLine = (errorMessage, code) => {
  const lines = code.split('\n');

  // Método 1: Buscar el fragmento de código que aparece en el error
  // El error de Mermaid muestra algo como: "...: NO HAY DELITO<br/>(Aunque"
  const fragmentMatch = errorMessage.match(/\.\.\.([^\n]{5,60})/);
  if (fragmentMatch) {
    const fragment = fragmentMatch[1].trim();
    // Buscar qué línea contiene este fragmento
    for (let i = 0; i < lines.length; i++) {
      // Limpiar espacios para comparación más flexible
      if (lines[i].includes(fragment.substring(0, Math.min(15, fragment.length)))) {
        return {
          lineNumber: i + 1,
          lineContent: lines[i]
        };
      }
    }
  }

  // Método 2: Buscar líneas que tengan el patrón problemático
  // Si el error menciona SQE, PE, PS, STR - es un problema de sintaxis en nodos
  if (/Expecting.*('SQE'|'PE'|'PS'|'STR')|got '(PS|STR)'/.test(errorMessage)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Buscar nodos con corchetes/llaves/paréntesis que contengan problemas
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
    // Mermaid puede contar líneas ignorando comentarios, buscar cerca
    const searchRange = 10;
    for (let offset = 0; offset <= searchRange; offset++) {
      for (const dir of [0, 1, -1]) {
        const checkLine = reportedLine + (offset * dir) - 1;
        if (checkLine >= 0 && checkLine < lines.length) {
          const line = lines[checkLine];
          // Verificar si esta línea tiene el patrón problemático
          if (/\w+\s*(?:\[[^\]]*\([^\]]*\)[^\]]*\]|\{[^\}]*\([^\}]*\)[^\}]*\})/.test(line)) {
            return {
              lineNumber: checkLine + 1,
              lineContent: line
            };
          }
        }
      }
    }

    // Si no encontramos el patrón, devolver la línea reportada
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
 * Patrones comunes de errores en Mermaid y sus soluciones
 */
const ERROR_PATTERNS = [
  {
    // Error principal: Paréntesis dentro de nodos o comillas internas
    // Detectado por tokens como SQE (Square End), PE (Paren End), PS (Paren Start), STR
    pattern: /Expecting.*('SQE'|'PE'|'PS'|'DOUBLECIRCLEEND'|'STADIUMEND'|'STR')|got '(PS|STR)'/i,
    detect: (code) => {
      // Buscar cualquier nodo [contenido], {contenido} o (contenido) con problemas
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

        // Problema si hay comillas internas sin escapar
        if (hasInternalQuotes) {
          return true;
        }

        // Problema si hay paréntesis en [] o {} sin comillas
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
    detect: (code, line) => /"[^"]*"[^"]*"/.test(code) || /'[^']*'[^']*'/.test(code),
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
 * Analiza un error de Mermaid y devuelve información estructurada
 */
const parseError = (error, code) => {
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

/**
 * Componente para mostrar errores de forma detallada
 */
const ErrorDisplay = ({ errorInfo, code, onAutoFix }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!errorInfo) return null;

  const hasDetails = errorInfo.lineNumber || errorInfo.pattern || errorInfo.issues?.length > 0;

  return (
    <div style={errorStyles.container}>
      {/* Header del error */}
      <div style={errorStyles.header}>
        <div style={errorStyles.iconContainer}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div style={errorStyles.titleSection}>
          <span style={errorStyles.title}>{errorInfo.summary}</span>
          {errorInfo.lineNumber && (
            <span style={errorStyles.lineIndicator}>Línea {errorInfo.lineNumber}</span>
          )}
        </div>

        {/* Botón de Auto-Fix prominente */}
        {errorInfo.canAutoFix && (
          <button
            onClick={() => onAutoFix()}
            style={errorStyles.autoFixButton}
            title="Corregir automáticamente todos los problemas detectados"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Auto-Fix
          </button>
        )}

        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={errorStyles.expandButton}
            title={expanded ? "Ocultar detalles" : "Ver detalles"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Detalles expandibles */}
      {expanded && hasDetails && (
        <div style={errorStyles.details}>
          {/* Línea problemática */}
          {errorInfo.errorLine && (
            <div style={errorStyles.section}>
              <span style={errorStyles.sectionLabel}>Código problemático:</span>
              <code style={errorStyles.codeBlock}>{errorInfo.errorLine.trim()}</code>
            </div>
          )}

          {/* Explicación */}
          {errorInfo.pattern && (
            <div style={errorStyles.section}>
              <span style={errorStyles.sectionLabel}>¿Qué ocurre?</span>
              <p style={errorStyles.explanation}>{errorInfo.pattern.explanation}</p>
            </div>
          )}

          {/* Problemas detectados */}
          {errorInfo.issues?.length > 0 && (
            <div style={errorStyles.section}>
              <span style={errorStyles.sectionLabel}>
                Problemas detectados ({errorInfo.issues.length}):
              </span>
              <div style={errorStyles.issuesList}>
                {errorInfo.issues.slice(0, 5).map((issue, idx) => (
                  <div key={idx} style={errorStyles.issueItem}>
                    <span style={errorStyles.issueLine}>L{issue.line}</span>
                    <span style={errorStyles.issueDesc}>{issue.description}</span>
                  </div>
                ))}
                {errorInfo.issues.length > 5 && (
                  <span style={errorStyles.issueMore}>
                    +{errorInfo.issues.length - 5} más...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview de cambios */}
          {errorInfo.canAutoFix && errorInfo.autoFixPreview?.length > 0 && (
            <div style={errorStyles.section}>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={errorStyles.previewToggle}
              >
                {showPreview ? '▼' : '▶'} Ver cambios que se aplicarán ({errorInfo.autoFixPreview.length})
              </button>

              {showPreview && (
                <div style={errorStyles.previewContainer}>
                  {errorInfo.autoFixPreview.map((fix, idx) => (
                    <div key={idx} style={errorStyles.previewItem}>
                      <div style={errorStyles.previewHeader}>Línea {fix.line}</div>
                      <div style={errorStyles.previewOld}>
                        <span style={errorStyles.previewLabel}>−</span>
                        <code>{fix.original}</code>
                      </div>
                      <div style={errorStyles.previewNew}>
                        <span style={errorStyles.previewLabel}>+</span>
                        <code>{fix.fixed}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sugerencia */}
          {errorInfo.pattern?.suggestion && (
            <div style={errorStyles.section}>
              <span style={errorStyles.sectionLabel}>💡 Sugerencia:</span>
              <p style={errorStyles.suggestion}>{errorInfo.pattern.suggestion}</p>
            </div>
          )}

          {/* Mensaje técnico original */}
          <details style={errorStyles.technicalDetails}>
            <summary style={errorStyles.technicalSummary}>Ver mensaje técnico completo</summary>
            <pre style={errorStyles.technicalMessage}>{errorInfo.message}</pre>
          </details>
        </div>
      )}

      {/* Mensaje compacto cuando no está expandido */}
      {!expanded && errorInfo.pattern?.explanation && (
        <p style={errorStyles.compactHint}>{errorInfo.pattern.explanation}</p>
      )}
    </div>
  );
};

const errorStyles = {
  container: {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "12px",
    padding: "16px",
    maxWidth: "650px",
    width: "100%",
    animation: "fadeIn 0.3s ease-out",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  iconContainer: {
    flexShrink: 0,
    marginTop: "2px",
  },
  titleSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    color: "#fca5a5",
    fontSize: "14px",
    fontWeight: "600",
    lineHeight: "1.3",
  },
  lineIndicator: {
    display: "inline-block",
    background: "rgba(239, 68, 68, 0.2)",
    color: "#f87171",
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "4px",
    fontFamily: "'JetBrains Mono', monospace",
    width: "fit-content",
  },
  autoFixButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
    flexShrink: 0,
  },
  expandButton: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "6px",
    cursor: "pointer",
    color: "#a1a1aa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  details: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(239, 68, 68, 0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sectionLabel: {
    color: "#a1a1aa",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  codeBlock: {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#fca5a5",
    overflowX: "auto",
    whiteSpace: "pre",
  },
  explanation: {
    color: "#d4d4d8",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
  },
  suggestion: {
    color: "#a3e635",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
    background: "rgba(163, 230, 53, 0.1)",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(163, 230, 53, 0.2)",
  },
  issuesList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  issueItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "12px",
  },
  issueLine: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#f87171",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    fontWeight: "600",
  },
  issueDesc: {
    color: "#d4d4d8",
  },
  issueMore: {
    color: "#71717a",
    fontSize: "11px",
    fontStyle: "italic",
  },
  previewToggle: {
    background: "transparent",
    border: "none",
    color: "#a1a1aa",
    fontSize: "12px",
    cursor: "pointer",
    padding: "4px 0",
    textAlign: "left",
    fontFamily: "inherit",
  },
  previewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  previewItem: {
    background: "rgba(0,0,0,0.2)",
    borderRadius: "6px",
    padding: "10px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  previewHeader: {
    color: "#71717a",
    marginBottom: "6px",
    fontSize: "10px",
    fontWeight: "600",
  },
  previewOld: {
    display: "flex",
    gap: "8px",
    color: "#fca5a5",
    background: "rgba(239, 68, 68, 0.1)",
    padding: "6px 8px",
    borderRadius: "4px",
    marginBottom: "4px",
    overflowX: "auto",
  },
  previewNew: {
    display: "flex",
    gap: "8px",
    color: "#86efac",
    background: "rgba(34, 197, 94, 0.1)",
    padding: "6px 8px",
    borderRadius: "4px",
    overflowX: "auto",
  },
  previewLabel: {
    fontWeight: "bold",
    flexShrink: 0,
  },
  technicalDetails: {
    marginTop: "8px",
  },
  technicalSummary: {
    color: "#71717a",
    fontSize: "11px",
    cursor: "pointer",
    userSelect: "none",
  },
  technicalMessage: {
    background: "rgba(0,0,0,0.4)",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#a1a1aa",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    marginTop: "8px",
    maxHeight: "150px",
    overflowY: "auto",
  },
  compactHint: {
    color: "#a1a1aa",
    fontSize: "12px",
    marginTop: "8px",
    marginBottom: 0,
    marginLeft: "34px",
    lineHeight: "1.4",
  },
};

// ============================================================================
// FIN DEL SISTEMA DE MANEJO DE ERRORES
// ============================================================================

// ============================================================================
// SISTEMA DE TEMAS (DARK/LIGHT MODE)
// ============================================================================

const getInitialTheme = () => {
  // Verificar localStorage primero
  const savedTheme = localStorage.getItem('mermaid-exporter-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  // Detectar preferencia del sistema
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

// Paletas de colores para cada tema
const themes = {
  dark: {
    // Backgrounds
    bgPrimary: '#0a0a0f',
    bgSecondary: '#0d0d12',
    bgTertiary: '#0f0f14',
    bgElevated: 'rgba(10,10,15,0.8)',
    bgFooter: 'rgba(10,10,15,0.9)',
    bgHover: 'rgba(255,255,255,0.05)',
    bgInput: 'transparent',
    bgButton: 'rgba(255,255,255,0.04)',
    bgButtonHover: 'rgba(255,255,255,0.08)',

    // Text
    textPrimary: '#e4e4e7',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textInverse: '#18181b',

    // Borders
    borderPrimary: 'rgba(255,255,255,0.06)',
    borderSecondary: 'rgba(255,255,255,0.08)',
    borderInput: 'rgba(255,255,255,0.1)',

    // Accents
    gradientStart: '#6366f1',
    gradientEnd: '#8b5cf6',

    // Preview area
    previewPattern: 'rgba(255,255,255,0.02)',

    // Scrollbar
    scrollTrack: 'rgba(255,255,255,0.05)',
    scrollThumb: 'rgba(255,255,255,0.15)',
    scrollThumbHover: 'rgba(255,255,255,0.25)',
  },
  light: {
    // Backgrounds
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f5f9',
    bgElevated: 'rgba(255,255,255,0.95)',
    bgFooter: 'rgba(248,250,252,0.95)',
    bgHover: 'rgba(0,0,0,0.04)',
    bgInput: '#ffffff',
    bgButton: 'rgba(0,0,0,0.04)',
    bgButtonHover: 'rgba(0,0,0,0.08)',

    // Text
    textPrimary: '#18181b',
    textSecondary: '#52525b',
    textMuted: '#71717a',
    textInverse: '#fafafa',

    // Borders
    borderPrimary: 'rgba(0,0,0,0.08)',
    borderSecondary: 'rgba(0,0,0,0.12)',
    borderInput: 'rgba(0,0,0,0.15)',

    // Accents
    gradientStart: '#6366f1',
    gradientEnd: '#8b5cf6',

    // Preview area  
    previewPattern: 'rgba(0,0,0,0.03)',

    // Scrollbar
    scrollTrack: 'rgba(0,0,0,0.05)',
    scrollThumb: 'rgba(0,0,0,0.15)',
    scrollThumbHover: 'rgba(0,0,0,0.25)',
  }
};

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [code, setCode] = useState(DEFAULT_DIAGRAM);
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [exportScale, setExportScale] = useState(3);
  const [bgTransparent, setBgTransparent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const previewRef = useRef(null);
  const renderIdRef = useRef(0);

  // Colores del tema actual
  const t = themes[theme];

  // Guardar tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('mermaid-exporter-theme', theme);
  }, [theme]);

  // Escuchar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e) => {
      // Solo cambiar automáticamente si no hay preferencia guardada
      if (!localStorage.getItem('mermaid-exporter-theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
      // Usar el nuevo sistema de parsing de errores
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

  useEffect(() => {
    const timeout = setTimeout(renderDiagram, 400);
    return () => clearTimeout(timeout);
  }, [renderDiagram]);

  const exportToPNG = async () => {
    const svgElement = previewRef.current?.querySelector("svg");
    if (!svgElement) {
      setError("No hay diagrama para exportar");
      return;
    }

    try {
      setIsRendering(true);

      // Clonar SVG para manipulación
      const clonedSvg = svgElement.cloneNode(true);

      // Obtener dimensiones reales
      const bbox = svgElement.getBBox();
      const padding = 40;
      const width = Math.ceil(bbox.width + padding);
      const height = Math.ceil(bbox.height + padding);

      // Limpiar atributos problemáticos y configurar dimensiones
      clonedSvg.removeAttribute("style");
      clonedSvg.setAttribute("width", width);
      clonedSvg.setAttribute("height", height);
      clonedSvg.setAttribute("viewBox", `${bbox.x - padding / 2} ${bbox.y - padding / 2} ${width} ${height}`);
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

      // Convertir todos los estilos computados a inline para garantizar renderizado correcto
      const applyInlineStyles = (element) => {
        if (element.nodeType !== 1) return; // Solo elementos

        const computed = window.getComputedStyle(element);
        const importantStyles = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size',
          'font-weight', 'opacity', 'transform', 'text-anchor',
          'dominant-baseline', 'fill-opacity', 'stroke-opacity'];

        importantStyles.forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value && value !== 'none' && value !== '') {
            element.style[prop] = value;
          }
        });

        Array.from(element.children).forEach(applyInlineStyles);
      };

      applyInlineStyles(clonedSvg);

      // Insertar estilos completos con fuentes del sistema (sin dependencias externas)
      const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
      styleElement.textContent = `
        * { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; 
        }
        text { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 14px;
        }
        .node rect, .node circle, .node ellipse, .node polygon, .node path { stroke-width: 2px; }
        .label { font-size: 14px; }
        .edgeLabel { background-color: ${bgTransparent ? "transparent" : "#ffffff"}; }
        .cluster rect { stroke-width: 2px; }
        .flowchart-link { stroke-width: 2px; }
        .marker { fill: #333; }
        .messageText { font-size: 13px; }
        .actor { stroke: #333; fill: #eee; }
        .actor-line { stroke: #333; }
        foreignObject { overflow: visible; }
      `;
      clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

      // Añadir fondo si no es transparente (debe ser el primer elemento después de style)
      if (!bgTransparent) {
        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", bbox.x - padding / 2);
        bgRect.setAttribute("y", bbox.y - padding / 2);
        bgRect.setAttribute("width", width);
        bgRect.setAttribute("height", height);
        bgRect.setAttribute("fill", "#ffffff");
        // Insertar justo después del style
        clonedSvg.insertBefore(bgRect, styleElement.nextSibling);
      }

      // Serializar SVG y convertir a Data URI (evita problemas de CORS/tainted canvas)
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);

      // Asegurar declaración XML y encoding correcto
      if (!svgString.startsWith('<?xml')) {
        svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
      }

      // Método robusto: usar base64 Data URI (evita todos los problemas de CORS)
      const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

      // Crear imagen desde Data URI
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Error renderizando SVG"));
        img.src = dataUri;
      });

      // Crear canvas con escala para alta resolución
      const canvas = document.createElement("canvas");
      const scale = exportScale;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d", { alpha: bgTransparent });

      // Configurar antialiasing de alta calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Aplicar fondo si no es transparente
      if (!bgTransparent) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Dibujar imagen escalada
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar PNG con máxima calidad
      const pngDataUrl = canvas.toDataURL("image/png", 1.0);

      // Descargar archivo
      const link = document.createElement("a");
      link.download = `mermaid-diagram-${Date.now()}.png`;
      link.href = pngDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error("Export error:", err);
      // Crear errorInfo para errores de exportación
      setErrorInfo({
        summary: "Error al exportar",
        message: err.message,
        lineNumber: null,
        errorLine: null,
        pattern: {
          title: "Error de exportación",
          explanation: "Ha ocurrido un error durante la conversión a PNG.",
          suggestion: "Intenta recargar la página o verifica que el diagrama se renderice correctamente."
        },
        autoFix: null
      });
      setError("Error al exportar: " + err.message);
    } finally {
      setIsRendering(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = (type) => {
    setCode(EXAMPLE_DIAGRAMS[type]);
  };

  // Función para aplicar auto-fix global
  const handleAutoFix = () => {
    const result = autoFixMermaidCode(code);
    if (result.hasChanges) {
      // Limpiar errores inmediatamente para mostrar el panel de preview
      setError(null);
      setErrorInfo(null);
      // Actualizar el código - esto disparará el re-render automáticamente
      setCode(result.code);
    }
  };

  // Estilos dinámicos basados en el tema actual
  const dynamicStyles = {
    container: {
      minHeight: "100vh",
      background: theme === 'dark'
        ? `linear-gradient(135deg, ${t.bgPrimary} 0%, #13131a 50%, ${t.bgPrimary} 100%)`
        : `linear-gradient(135deg, ${t.bgPrimary} 0%, #e2e8f0 50%, ${t.bgPrimary} 100%)`,
      fontFamily: "'Outfit', -apple-system, sans-serif",
      color: t.textPrimary,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    header: {
      padding: "20px 32px",
      borderBottom: `1px solid ${t.borderPrimary}`,
      background: t.bgElevated,
      backdropFilter: "blur(20px)",
      transition: "background 0.3s ease, border-color 0.3s ease",
    },
    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      maxWidth: "1800px",
      margin: "0 auto",
    },
    title: {
      fontSize: "22px",
      fontWeight: "600",
      color: theme === 'dark' ? '#ffffff' : '#6366f1',
      letterSpacing: "-0.02em",
    },
    subtitle: {
      fontSize: "13px",
      color: t.textMuted,
      fontWeight: "500",
    },
    themeToggle: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: t.bgButton,
      border: `1px solid ${t.borderSecondary}`,
      borderRadius: "12px",
      padding: "8px 14px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      color: t.textSecondary,
    },
    editorSection: {
      background: t.bgSecondary,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      transition: "background 0.3s ease",
    },
    previewSection: {
      background: t.bgTertiary,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      transition: "background 0.3s ease",
    },
    panelHeader: {
      padding: "14px 20px",
      borderBottom: `1px solid ${t.borderPrimary}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: t.bgHover,
      transition: "background 0.3s ease, border-color 0.3s ease",
    },
    panelTitle: {
      fontSize: "13px",
      fontWeight: "600",
      color: t.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    iconButton: {
      background: "transparent",
      border: "none",
      padding: "8px",
      borderRadius: "8px",
      cursor: "pointer",
      color: t.textMuted,
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    examplesBar: {
      padding: "12px 20px",
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      borderBottom: `1px solid ${t.borderPrimary}`,
      background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)",
      transition: "background 0.3s ease",
    },
    exampleButton: {
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: "500",
      fontFamily: "'JetBrains Mono', monospace",
      background: t.bgButton,
      border: `1px solid ${t.borderSecondary}`,
      borderRadius: "6px",
      color: t.textSecondary,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    textarea: {
      flex: 1,
      background: t.bgInput,
      border: "none",
      padding: "20px",
      fontSize: "14px",
      fontFamily: "'JetBrains Mono', monospace",
      color: t.textPrimary,
      resize: "none",
      lineHeight: "1.7",
      letterSpacing: "0.01em",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    previewContainer: {
      flex: 1,
      overflow: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: `
        linear-gradient(45deg, ${t.previewPattern} 25%, transparent 25%),
        linear-gradient(-45deg, ${t.previewPattern} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, ${t.previewPattern} 75%),
        linear-gradient(-45deg, transparent 75%, ${t.previewPattern} 75%)
      `,
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      transition: "background 0.3s ease",
    },
    footer: {
      padding: "16px 32px",
      borderTop: `1px solid ${t.borderPrimary}`,
      background: t.bgFooter,
      backdropFilter: "blur(20px)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "24px",
      transition: "background 0.3s ease, border-color 0.3s ease",
    },
    optionLabel: {
      fontSize: "13px",
      color: t.textMuted,
      fontWeight: "500",
    },
    scaleButtons: {
      display: "flex",
      gap: "4px",
      background: t.bgButton,
      padding: "4px",
      borderRadius: "10px",
    },
    scaleButton: {
      padding: "8px 14px",
      fontSize: "13px",
      fontWeight: "600",
      fontFamily: "'JetBrains Mono', monospace",
      background: "transparent",
      border: "none",
      borderRadius: "6px",
      color: t.textMuted,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "13px",
      color: t.textSecondary,
      cursor: "pointer",
      fontWeight: "500",
    },
    checkboxCustom: {
      width: "20px",
      height: "20px",
      borderRadius: "6px",
      border: `2px solid ${t.borderInput}`,
      background: t.bgButton,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    },
  };

  return (
    <div style={dynamicStyles.container}>
      {/* Header */}
      <header style={dynamicStyles.header}>
        <div style={dynamicStyles.headerContent}>
          <div style={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <rect width="32" height="32" rx="8" fill="url(#mermaidLogoGrad)" />
              <path
                d="M8 12L16 8L24 12L16 16L8 12Z"
                fill="white"
                fillOpacity="0.9"
              />
              <path
                d="M8 16L16 20L24 16"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M8 20L16 24L24 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="mermaidLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 style={dynamicStyles.title}>Mermaid → PNG</h1>
          </div>

          {/* Theme Toggle Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={toggleTheme}
              style={dynamicStyles.themeToggle}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>Claro</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>Oscuro</span>
                </>
              )}
            </button>
            <p style={dynamicStyles.subtitle}>Exportador de alta calidad</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        ...styles.main,
        background: t.borderPrimary,
      }}>
        {/* Editor Panel */}
        <section style={dynamicStyles.editorSection}>
          <div style={dynamicStyles.panelHeader}>
            <span style={dynamicStyles.panelTitle}>Código Mermaid</span>
            <button
              onClick={copyCode}
              style={dynamicStyles.iconButton}
              title="Copiar código"
            >
              {copied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </div>

          {/* Examples */}
          <div style={dynamicStyles.examplesBar}>
            {Object.keys(EXAMPLE_DIAGRAMS).map((type) => (
              <button
                key={type}
                onClick={() => loadExample(type)}
                style={dynamicStyles.exampleButton}
              >
                {type}
              </button>
            ))}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={dynamicStyles.textarea}
            placeholder="Pega tu código Mermaid aquí..."
            spellCheck={false}
          />
        </section>

        {/* Preview Panel */}
        <section style={dynamicStyles.previewSection}>
          <div style={dynamicStyles.panelHeader}>
            <span style={dynamicStyles.panelTitle}>
              Vista previa
              {isRendering && <span style={styles.renderingDot} />}
            </span>
          </div>

          <div style={dynamicStyles.previewContainer}>
            {errorInfo && (
              <ErrorDisplay
                errorInfo={errorInfo}
                code={code}
                onAutoFix={handleAutoFix}
              />
            )}
            <div
              ref={previewRef}
              style={{
                ...styles.preview,
                display: errorInfo ? 'none' : undefined
              }}
            />
          </div>
        </section>
      </main>

      {/* Export Controls */}
      <footer style={dynamicStyles.footer}>
        <div style={styles.exportOptions}>
          <div style={styles.optionGroup}>
            <label style={dynamicStyles.optionLabel}>Escala</label>
            <div style={dynamicStyles.scaleButtons}>
              {[1, 2, 3, 4].map((scale) => (
                <button
                  key={scale}
                  onClick={() => setExportScale(scale)}
                  style={{
                    ...dynamicStyles.scaleButton,
                    ...(exportScale === scale ? styles.scaleButtonActive : {}),
                  }}
                >
                  {scale}x
                </button>
              ))}
            </div>
          </div>

          <div style={styles.optionGroup}>
            <label style={dynamicStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={bgTransparent}
                onChange={(e) => setBgTransparent(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={dynamicStyles.checkboxCustom}>
                {bgTransparent && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? 'white' : '#6366f1'} strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              Fondo transparente
            </label>
          </div>
        </div>

        <button
          onClick={exportToPNG}
          disabled={isRendering || !!errorInfo || !code.trim()}
          style={{
            ...styles.exportButton,
            ...(isRendering || errorInfo || !code.trim() ? styles.exportButtonDisabled : {}),
            ...(exportSuccess ? styles.exportButtonSuccess : {}),
          }}
        >
          {exportSuccess ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Descargado
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar PNG
            </>
          )}
        </button>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          background: ${t.bgPrimary};
          overflow: hidden;
          transition: background 0.3s ease;
        }
        
        textarea:focus, button:focus {
          outline: none;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${t.scrollTrack};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${t.scrollThumb};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${t.scrollThumbHover};
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes themeTransition {
          from { opacity: 0.9; }
          to { opacity: 1; }
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0f 0%, #13131a 50%, #0a0a0f 100%)",
    fontFamily: "'Outfit', -apple-system, sans-serif",
    color: "#e4e4e7",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,10,15,0.8)",
    backdropFilter: "blur(20px)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1800px",
    margin: "0 auto",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #fff 0%, #a1a1aa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#71717a",
    fontWeight: "500",
  },
  main: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1px",
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    animation: "fadeIn 0.5s ease-out",
  },
  editorSection: {
    background: "#0d0d12",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  previewSection: {
    background: "#0f0f14",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.02)",
  },
  panelTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  renderingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#6366f1",
    animation: "pulse 1s ease-in-out infinite",
  },
  iconButton: {
    background: "transparent",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#71717a",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  examplesBar: {
    padding: "12px 20px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(0,0,0,0.2)",
  },
  exampleButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    fontFamily: "'JetBrains Mono', monospace",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    color: "#a1a1aa",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "20px",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#e4e4e7",
    resize: "none",
    lineHeight: "1.7",
    letterSpacing: "0.01em",
  },
  previewContainer: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: `
      linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%)
    `,
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  },
  preview: {
    maxWidth: "100%",
    maxHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px 20px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "12px",
    color: "#fca5a5",
    fontSize: "13px",
    lineHeight: "1.5",
    maxWidth: "500px",
  },
  footer: {
    padding: "16px 32px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,10,15,0.9)",
    backdropFilter: "blur(20px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
  },
  exportOptions: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  optionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  optionLabel: {
    fontSize: "13px",
    color: "#71717a",
    fontWeight: "500",
  },
  scaleButtons: {
    display: "flex",
    gap: "4px",
    background: "rgba(255,255,255,0.04)",
    padding: "4px",
    borderRadius: "10px",
  },
  scaleButton: {
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'JetBrains Mono', monospace",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "#71717a",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  scaleButtonActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#a1a1aa",
    cursor: "pointer",
    fontWeight: "500",
  },
  checkbox: {
    display: "none",
  },
  checkboxCustom: {
    width: "20px",
    height: "20px",
    borderRadius: "6px",
    border: "2px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  exportButton: {
    padding: "14px 28px",
    fontSize: "14px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
  },
  exportButtonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  exportButtonSuccess: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
  },
};