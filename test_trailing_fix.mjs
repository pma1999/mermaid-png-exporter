import { autoFixMermaidCode, analyzeCode } from './src/utils/mermaidAutoFix.js';

console.log('=== Testing Autofixer v2.3 - Trailing Syntax Fix ===\n');

// Test cases
const testCases = [
    {
        name: 'Original problematic line',
        input: 'CONTEXTO -.-> INTEGRA[Requiere<br/>INTEGRACIÓN]:(dispersión):::context',
        expected: 'CONTEXTO -.-> INTEGRA[Requiere<br/>INTEGRACIÓN]:::context',
        shouldFix: true
    },
    {
        name: 'Node with trailing colon text and class',
        input: 'A[Text]:(annotation):::class',
        expected: 'A[Text]:::class',
        shouldFix: true
    },
    {
        name: 'Node with trailing colon text without class',
        input: 'A[Text]:(annotation)',
        expected: 'A[Text]',
        shouldFix: true
    },
    {
        name: 'Rhombus with trailing colon',
        input: 'A{Rhombus}:(note):::style',
        expected: 'A{Rhombus}:::style',
        shouldFix: true
    },
    {
        name: 'Valid node with class - NO change',
        input: 'A[Text]:::class',
        expected: 'A[Text]:::class',
        shouldFix: false
    },
    {
        name: 'Valid node without class - NO change',
        input: 'A[Text]',
        expected: 'A[Text]',
        shouldFix: false
    },
    {
        name: 'Valid node with arrow - NO change',
        input: 'A[Text] --> B[Other]',
        expected: 'A[Text] --> B[Other]',
        shouldFix: false
    },
    {
        name: 'Node with parentheses INSIDE (should quote but not remove)',
        input: 'A[Text (with parens)]:::class',
        expected: 'A["Text (with parens)"]:::class',
        shouldFix: true
    }
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
    const result = autoFixMermaidCode(tc.input);
    const success = result.code === tc.expected && result.hasChanges === tc.shouldFix;

    if (success) {
        console.log(`✅ PASS: ${tc.name}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${tc.name}`);
        console.log(`   Input:    "${tc.input}"`);
        console.log(`   Expected: "${tc.expected}"`);
        console.log(`   Got:      "${result.code}"`);
        console.log(`   Expected hasChanges: ${tc.shouldFix}, Got: ${result.hasChanges}`);
        if (result.fixes.length > 0) {
            console.log(`   Fixes: ${JSON.stringify(result.fixes)}`);
        }
        failed++;
    }
}

console.log(`\n=== Results: ${passed}/${passed + failed} tests passed ===`);

// Test the full problematic diagram
console.log('\n\n=== Full Diagram Test ===\n');

const fullDiagram = `graph TD
    %% NODO CENTRAL
    CORE[RÉGIMEN REPRESENTACIÓN ESPAÑA]:::core

    %% 1. CONTEXTO (El problema)
    CORE --> CONTEXTO(CONTEXTO:<br/>❌ Sin regulación sistemática):::context
    CONTEXTO -.-> INTEGRA[Requiere<br/>INTEGRACIÓN]:(dispersión):::context

    %% 2. PILARES CÓDIGO CIVIL
    CORE --> BASE_CC{PILARES<br/>CÓDIGO CIVIL}:::base

    %% Rama A: Mandato (Interna)
    BASE_CC --> B_MANDATO[Art. 1709: MANDATO<br/>'El Vehículo']:::mandato
    B_MANDATO --> M_KEY(Actuación por<br/>cuenta ajena):::detail
    B_MANDATO -.-> M_NOTE[Regula la<br/>Relación Interna]:::note

    classDef core fill:#2c3e50,stroke:#fff,stroke-width:4px,color:#fff,font-size:16px;`;

const fullResult = autoFixMermaidCode(fullDiagram);

console.log('Has changes:', fullResult.hasChanges);
console.log('Number of fixes:', fullResult.fixes.length);
console.log('\nFixes applied:');
fullResult.fixes.forEach((fix, i) => {
    console.log(`  ${i + 1}. Line ${fix.line}: "${fix.original}" → "${fix.fixed}"`);
});

console.log('\n--- Fixed code (line 7 should be fixed) ---');
const lines = fullResult.code.split('\n');
console.log(`Line 7: ${lines[6]}`);
