/**
 * Test script to verify the subgraph title fix
 */
import { autoFixMermaidCode, analyzeCode } from './src/utils/mermaidAutoFix.js';

const testCode = `graph TD
    %% TÍTULO CENTRAL
    ROOT[("🧬 RELACIONES ENTRE LAS COSAS<br/>(Dinámica de los Objetos de Derecho)")]

    %% --- BLOQUE 1: NATURALEZA Y UNIDAD ---
    subgraph B1 [1. ¿CÓMO EXISTE LA COSA? (Ontología)]
        direction TB
        SIMPLE[<b>COSA SIMPLE</b><br/>Unidad natural/artificial<br/><i>(Ej. Caballo, Libro)</i>]
        COMP[<b>COSA COMPUESTA</b><br/>Unión de cosas con<br/>individualidad previa<br/><i>(Ej. Edificio, Coche)</i>]
        
        SIMPLE -.-> INDIV[<b>Indivisible</b><br/>Partes no son cosas]
        COMP --> CONFLICTO{¿División?}
        
        CONFLICTO --Física posible--> SEP[Separación]
        CONFLICTO --Inservible (Art 401)--> VENTA[<b>VENTA + REPARTO $</b><br/>(Art 404 CC)]
    end

    %% --- BLOQUE 2: AGRUPACIÓN ---
    subgraph B2 [2. ¿CÓMO SE AGRUPAN? (Universalidades)]
        direction TB
        UNI[<b>UNIVERSALIDADES</b><br/>Pluralidad tratada como UNIDAD<br/>*Componentes mantienen individualidad*]
        
        UNI --> FACTI[<b>De Hecho</b><br/>Voluntad del dueño<br/><i>(Biblioteca, Rebaño)</i>]
        UNI --> IURIS[<b>De Derecho</b><br/>Por Ley - Activo+Pasivo<br/><i>(Herencia - Art 659)</i>]
    end

    %% --- BLOQUE 3: JERARQUÍA Y VÍNCULO ---
    subgraph B3 [3. JERARQUÍA Y CONEXIÓN (La relación)]
        direction TB
        
        %% Sub-bloque: El Test de Principalidad
        TEST_START((<b>¿Cuál es Principal?</b><br/>Conflicto A vs B))
        TEST_START --> CRIT1{1. FINALIDAD<br/>Art. 376}
        CRIT1 --A sirve a B--> RES1[B es Principal]
        CRIT1 --Duda--> CRIT2{2. VALOR<br/>Art. 377}
        CRIT2 --B vale más--> RES1
        CRIT2 --Iguales--> CRIT3{3. VOLUMEN<br/>Art. 377}
        CRIT3 --B mayor volumen--> RES1
        
        EXCEPTION[<b>¡EXCEPCIÓN ARTE!</b><br/>Obra > Soporte] -.-> CRIT2
        
        %% Sub-bloque: Tipo de Unión
        LINK_TYPE{<b>INTENSIDAD DE UNIÓN</b>}
        
        LINK_TYPE --Fusión Jurídica--> INT[<b>PARTES INTEGRANTES</b><br/>Inmuebles por incorporación<br/>(Ladrillos)]
        INT --> NO_SEP[🚫 No derechos separados<br/>🚫 No embargo aislado]
        
        LINK_TYPE --Unión Funcional--> PERT[<b>PERTENENCIAS</b><br/>Inmuebles por destino<br/>(Tractor en finca)]
        PERT --> DEST[Acto de Destinación<br/>(Voluntad del dueño)]
        DEST --> RULE[<b>ACCESORIO SIGUE A PRINCIPAL</b><br/>Venta finca = Venta tractor<br/>(Arts. 883, 1097)]
        RULE -.-> DESAF[Posible Desafectación]
    end

    %% CONEXIONES ESTRUCTURALES
    ROOT === B1
    ROOT === B2
    ROOT === B3

    %% ESTILOS
    classDef main fill:#2c3e50,stroke:#fff,stroke-width:4px,color:white;
    classDef ontology fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef group fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef hierarchy fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef critical fill:#ffcdd2,stroke:#c62828,stroke-width:2px,font-weight:bold;
    classDef rule fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,stroke-dasharray: 5 5;

    class ROOT main;
    class SIMPLE,COMP,INDIV,SEP,VENTA ontology;
    class UNI,FACTI,IURIS group;
    class TEST_START,CRIT1,CRIT2,CRIT3,RES1,EXCEPTION,LINK_TYPE,INT,NO_SEP,PERT,DEST,DESAF hierarchy;
    class RULE rule;
    class VENTA,NO_SEP critical;`;

console.log('='.repeat(80));
console.log('TEST: Subgraph title fix for Mermaid autofix');
console.log('='.repeat(80));

// 1. Analyze the code
console.log('\n📋 ANÁLISIS DEL CÓDIGO ORIGINAL:');
const issues = analyzeCode(testCode);
console.log(`   Problemas detectados: ${issues.length}`);
issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. Línea ${issue.line}: ${issue.type}`);
    console.log(`      "${issue.content}"`);
});

// 2. Apply the fix
console.log('\n🔧 APLICANDO CORRECCIONES:');
const result = autoFixMermaidCode(testCode);
console.log(`   Cambios realizados: ${result.fixes.length}`);
result.fixes.forEach((fix, i) => {
    console.log(`   ${i + 1}. Línea ${fix.line}:`);
    console.log(`      Original: ${fix.original}`);
    console.log(`      Corregido: ${fix.fixed}`);
});

// 3. Show the fixed subgraph lines
console.log('\n📝 SUBGRAPHS EN CÓDIGO CORREGIDO:');
const fixedLines = result.code.split('\n');
fixedLines.forEach((line, i) => {
    if (line.trim().startsWith('subgraph')) {
        console.log(`   Línea ${i + 1}: ${line.trim()}`);
    }
});

// 4. Verify no parentheses issues remain in subgraphs
console.log('\n✅ VERIFICACIÓN FINAL:');
const remainingIssues = analyzeCode(result.code);
const subgraphIssues = remainingIssues.filter(i => i.type === 'unquoted_subgraph_title');
if (subgraphIssues.length === 0) {
    console.log('   ✓ Todos los títulos de subgraph están correctamente entrecomillados');
} else {
    console.log('   ✗ Aún hay problemas en títulos de subgraph:');
    subgraphIssues.forEach(issue => console.log(`      - Línea ${issue.line}: ${issue.content}`));
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETADO');
console.log('='.repeat(80));
