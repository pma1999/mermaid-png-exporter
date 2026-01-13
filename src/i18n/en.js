// English translations
export const en = {
    header: {
        subtitle: 'High-quality exporter'
    },
    tabs: {
        code: 'Code',
        preview: 'Preview'
    },
    editor: {
        title: 'Mermaid Code',
        copy: 'Copy code',
        placeholder: 'Paste your Mermaid code here...'
    },
    preview: {
        title: 'Preview'
    },
    footer: {
        scale: 'Scale',
        transparent: 'Transparent background',
        transparentShort: 'Transp.'
    },
    theme: {
        light: 'Light',
        dark: 'Dark',
        switchToLight: 'Switch to light mode',
        switchToDark: 'Switch to dark mode'
    },
    export: {
        button: 'Export PNG',
        success: 'Downloaded'
    },
    error: {
        line: 'Line',
        autoFix: 'Auto-Fix',
        fix: 'Fix',
        problematicCode: 'Problematic code:',
        whatHappened: 'What happened?',
        issuesDetected: 'Issues detected',
        more: 'more...',
        suggestion: 'Suggestion:',
        showTechnical: 'Show full technical message',
        hideDetails: 'Hide details',
        showDetails: 'Show details',
        changesPreview: 'View changes to apply',
        fixTooltip: 'Automatically fix all detected issues'
    },

    styleEditor: {
        title: 'Style Editor',
        editStyles: 'Edit Styles',
        tooltip: 'Edit node styles and fix contrast issues',
        classesFound: 'classes found',
        noClasses: 'No classDef definitions found in your code. Add classDef statements to define custom node styles.',
        issues: 'issues',
        contrast: 'Contrast',
        sampleText: 'Sample Text',
        autoFix: 'Fix',
        fixAll: 'Fix All',
        improveAll: '→ AAA',
        apply: 'Apply',
        fill: 'Fill',
        edgeLabels: 'Edge Labels',
        edgeLabelIssue: 'Invisible labels (white on white)',
        fixEdgeLabels: 'Fix Labels',
        textColor: 'Text',
        fixedViaCSS: 'Fixed via CSS injection',
        unstyledNodeInfo: 'This node has no style. Fixing will create a dedicated class to ensure visibility.',
    },
    examples: {
        flowchart: `flowchart LR
    subgraph Input
        A[User] --> B[Form]
    end
    subgraph Process
        B --> C{Validation}
        C -->|OK| D[Database]
        C -->|Error| E[Notification]
    end
    subgraph Output
        D --> F[Confirmation]
        E --> B
    end`,
        sequence: `sequenceDiagram
    participant U as 👤 User
    participant S as 🖥️ System
    participant DB as 🗄️ Database
    
    U->>S: Data request
    activate S
    S->>DB: Query
    activate DB
    DB-->>S: Results
    deactivate DB
    S-->>U: JSON Response
    deactivate S`,
        classDiagram: `classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Project {
        +String title
        +Date date
        +getDetails()
    }
    class Task {
        +String description
        +Boolean completed
        +markComplete()
    }
    User "1" --> "*" Project : manages
    Project "1" --> "*" Task : contains`,
        stateDiagram: `stateDiagram-v2
    [*] --> Draft
    Draft --> InReview : submit
    InReview --> Approved : approve
    InReview --> Draft : reject
    Approved --> Published : publish
    Published --> [*]
    
    state InReview {
        [*] --> Pending
        Pending --> Reviewing
        Reviewing --> [*]
    }`,
        erDiagram: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_LINE : contains
    PRODUCT ||--o{ ORDER_LINE : included_in
    
    USER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date date
        float total
    }
    PRODUCT {
        int id PK
        string name
        float price
    }`,
        gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
        Analysis           :a1, 2024-01-01, 15d
        Design             :a2, after a1, 20d
    section Development
        Frontend           :a3, after a2, 30d
        Backend            :a4, after a2, 25d
    section Testing
        QA                 :a5, after a3, 15d
        Deploy             :a6, after a5, 5d`,
        pie: `pie showData
    title Budget Distribution
    "Development" : 45
    "Design" : 20
    "Marketing" : 15
    "Infrastructure" : 12
    "Other" : 8`,
        mindmap: `mindmap
  root((Project))
    Research
      Market analysis
      Competition
      Users
    Design
      UX
      UI
      Prototype
    Development
      Frontend
      Backend
      Testing
    Launch
      Marketing
      Support`
    }
};
