
import { autoFixMermaidCode } from './src/utils/mermaidAutoFix.js';

const code = `graph TD
    FAM[Familia]
    F2(Excepción Voluntaria:<br/><b>MATRIMONIO (Art. 55 CC)</b><br/>Carácter de <i>Nuntius</i>)
    FAM --> F2`;

console.log('Original:');
console.log(code);

const result = autoFixMermaidCode(code);

console.log('\nFixed:');
console.log(result.code);
console.log('\nChanges:', JSON.stringify(result.fixes, null, 2));


// Also test the user's specific case
const fullLine = `F2(Excepción Voluntaria:<br/><b>MATRIMONIO (Art. 55 CC)</b><br/>Carácter de <i>Nuntius</i>)`;
console.log('\nDetailed check for line:');
console.log(fullLine);
// Manually check if the regex catches it
// The circle regex in mermaidAutoFix.js is roughly: /(\w+)\s*(\(\()(.*?)(\)\))/
// Wait, for single circle it is ( ... )
// In ParseAndFixNodes, the regex for circle is /(( ... ))/ but F2(...) is a ROUND node (stadium-like but distinct from ([...])).
// Actually in Mermaid `id(...)` is a round edge node. 
// Let's check the shape patterns in mermaidAutoFix.js

// The current code has:
// { open: '((', close: '))', name: 'circle' }
// but it MISSES single parenthesis `(` `)` which is the most common "Round node"!

`;
