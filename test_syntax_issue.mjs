import { autoFixMermaidCode, analyzeCode } from './src/utils/mermaidAutoFix.js';

const problematicLine = 'CONTEXTO -.-> INTEGRA[Requiere<br/>INTEGRACIÓN]:(dispersión):::context';

console.log('=== Analyzing problematic line ===');
console.log('Original:', problematicLine);
console.log();

// Test the autofix
const result = autoFixMermaidCode(problematicLine);
console.log('Autofix result:');
console.log('  Code:', result.code);
console.log('  Fixes:', JSON.stringify(result.fixes, null, 2));
console.log('  Has changes:', result.hasChanges);
console.log();

// Analyze the issue
// The pattern ]:(text) indicates invalid syntax
// The user likely intended INTEGRA[Requiere<br/>INTEGRACIÓN] with annotation (dispersión)
// But :(dispersión) after ] is NOT valid Mermaid syntax

// Check what's happening:
// Looking for node pattern: NODEID[CONTENT]:::class
const bracketRegex = /(\w+)\s*\[([^\]]+)\](:::?\w+)?/g;
let match;
while ((match = bracketRegex.exec(problematicLine)) !== null) {
    console.log('Bracket regex match:');
    console.log('  Full match:', JSON.stringify(match[0]));
    console.log('  Node ID:', match[1]);
    console.log('  Content:', match[2]);
    console.log('  Modifier:', match[3]);
    console.log('  Index:', match.index);
    console.log('  Text after match:', JSON.stringify(problematicLine.substring(match.index + match[0].length)));
}

// The issue: the regex captures up to ] but then the :(dispersión) is left over
// This causes the COLON parse error
console.log();
console.log('=== The problem ===');
console.log('After the bracket ], there is :(dispersión) which is invalid Mermaid syntax');
console.log('The autofixer needs to detect this and either:');
console.log('  1. Remove the :(...) part');
console.log('  2. Move it to a proper location (like edge label)');
console.log('  3. Convert INTEGRA[...] to INTEGRA["..."] and include annotation');
