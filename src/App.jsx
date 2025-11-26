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

export default function App() {
  const [code, setCode] = useState(DEFAULT_DIAGRAM);
  const [error, setError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [exportScale, setExportScale] = useState(3);
  const [bgTransparent, setBgTransparent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const previewRef = useRef(null);
  const renderIdRef = useRef(0);

  const renderDiagram = useCallback(async () => {
    if (!previewRef.current || !code.trim()) {
      if (previewRef.current) previewRef.current.innerHTML = "";
      setError(null);
      return;
    }

    setIsRendering(true);
    setError(null);
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
      const cleanError = err.message
        ?.replace(/mermaid-\d+-\d+/g, "diagrama")
        ?.replace(/\n/g, " ")
        ?.substring(0, 200);
      setError(cleanError || "Error al renderizar el diagrama");
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
      clonedSvg.setAttribute("viewBox", `${bbox.x - padding/2} ${bbox.y - padding/2} ${width} ${height}`);
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
        bgRect.setAttribute("x", bbox.x - padding/2);
        bgRect.setAttribute("y", bbox.y - padding/2);
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
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
                <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 style={styles.title}>Mermaid → PNG</h1>
          </div>
          <p style={styles.subtitle}>Exportador de alta calidad</p>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Editor Panel */}
        <section style={styles.editorSection}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Código Mermaid</span>
            <button
              onClick={copyCode}
              style={styles.iconButton}
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
          <div style={styles.examplesBar}>
            {Object.keys(EXAMPLE_DIAGRAMS).map((type) => (
              <button
                key={type}
                onClick={() => loadExample(type)}
                style={styles.exampleButton}
              >
                {type}
              </button>
            ))}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.textarea}
            placeholder="Pega tu código Mermaid aquí..."
            spellCheck={false}
          />
        </section>

        {/* Preview Panel */}
        <section style={styles.previewSection}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>
              Vista previa
              {isRendering && <span style={styles.renderingDot} />}
            </span>
          </div>

          <div style={styles.previewContainer}>
            {error ? (
              <div style={styles.errorBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            ) : (
              <div ref={previewRef} style={styles.preview} />
            )}
          </div>
        </section>
      </main>

      {/* Export Controls */}
      <footer style={styles.footer}>
        <div style={styles.exportOptions}>
          <div style={styles.optionGroup}>
            <label style={styles.optionLabel}>Escala</label>
            <div style={styles.scaleButtons}>
              {[1, 2, 3, 4].map((scale) => (
                <button
                  key={scale}
                  onClick={() => setExportScale(scale)}
                  style={{
                    ...styles.scaleButton,
                    ...(exportScale === scale ? styles.scaleButtonActive : {}),
                  }}
                >
                  {scale}x
                </button>
              ))}
            </div>
          </div>

          <div style={styles.optionGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={bgTransparent}
                onChange={(e) => setBgTransparent(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxCustom}>
                {bgTransparent && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
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
          disabled={isRendering || !!error || !code.trim()}
          style={{
            ...styles.exportButton,
            ...(isRendering || error || !code.trim() ? styles.exportButtonDisabled : {}),
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
          background: #0a0a0f;
          overflow: hidden;
        }
        
        textarea:focus, button:focus {
          outline: none;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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