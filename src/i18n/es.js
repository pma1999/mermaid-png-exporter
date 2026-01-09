// Spanish (Spain) translations
export const es = {
    header: {
        subtitle: 'Exportador de alta calidad'
    },
    tabs: {
        code: 'Código',
        preview: 'Vista previa'
    },
    editor: {
        title: 'Código Mermaid',
        copy: 'Copiar código',
        placeholder: 'Pega tu código Mermaid aquí...'
    },
    preview: {
        title: 'Vista previa'
    },
    footer: {
        scale: 'Escala',
        transparent: 'Fondo transparente',
        transparentShort: 'Transp.'
    },
    theme: {
        light: 'Claro',
        dark: 'Oscuro',
        switchToLight: 'Cambiar a modo claro',
        switchToDark: 'Cambiar a modo oscuro'
    },
    export: {
        button: 'Exportar PNG',
        success: 'Descargado'
    },
    error: {
        line: 'Línea',
        autoFix: 'Auto-Fix',
        fill: 'Fondo',
        edgeLabels: 'Etiquetas de Aristas',
        edgeLabelIssue: 'Etiquetas invisibles (blanco sobre blanco)',
        fixEdgeLabels: 'Arreglar Etiquetas',
        fix: 'Fix',
        problematicCode: 'Código problemático:',
        whatHappened: '¿Qué ocurre?',
        issuesDetected: 'Problemas detectados',
        more: 'más...',
        suggestion: 'Sugerencia:',
        showTechnical: 'Ver mensaje técnico completo',
        hideDetails: 'Ocultar detalles',
        showDetails: 'Ver detalles',
        changesPreview: 'Ver cambios que se aplicarán',
        fixTooltip: 'Corregir automáticamente todos los problemas detectados'
    },

    styleEditor: {
        title: 'Editor de Estilos',
        editStyles: 'Editar Estilos',
        tooltip: 'Editar estilos de nodos y corregir problemas de contraste',
        classesFound: 'clases encontradas',
        noClasses: 'No se encontraron definiciones classDef en tu código. Añade instrucciones classDef para definir estilos personalizados.',
        issues: 'problemas',
        contrast: 'Contraste',
        sampleText: 'Texto de Ejemplo',
        autoFix: 'Corregir',
        fixAll: 'Corregir Todo',
        improveAll: '→ AAA',
        apply: 'Aplicar',
        fill: 'Relleno',
        textColor: 'Texto',
        fixedViaCSS: 'Corregido via CSS',
    },
    examples: {
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
      Soporte`
    }
};
