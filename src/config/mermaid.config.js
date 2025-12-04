import mermaid from "mermaid";

// Configuración inicial de Mermaid
export const initializeMermaid = () => {
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
};

// Diagrama por defecto
export const DEFAULT_DIAGRAM = `flowchart TD
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

// Inicializar inmediatamente
initializeMermaid();

export { mermaid };
