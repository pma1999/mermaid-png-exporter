
const { autoFixMermaidCode } = require('./src/utils/mermaidAutoFix.js');

const code = `graph TD
    FAM[Familia]
    F2(Excepción Voluntaria:<br/><b>MATRIMONIO (Art. 55 CC)</b><br/>Carácter de <i>Nuntius</i>)
    FAM --> F2`;

console.log('Original:');
console.log(code);

const result = autoFixMermaidCode(code);

console.log('\nFixed:');
console.log(result.code);
console.log('\nChanges:', result.fixes);
