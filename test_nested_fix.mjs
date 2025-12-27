
import { autoFixMermaidCode } from './src/utils/mermaidAutoFix.js';

console.log('=== Testing Autofixer v2.4 PRO - Nested Parenthesis Support ===\n');

const testCases = [
    {
        name: 'Node with nested parenthesis (User Case)',
        input: 'F2(Excepción Voluntaria:<br/><b>MATRIMONIO (Art. 55 CC)</b><br/>)',
        expectedPart: 'F2("Excepción Voluntaria:<br/><b>MATRIMONIO (Art. 55 CC)</b><br/>")',
        shouldFix: true
    },
    {
        name: 'Simple round node (no fix)',
        input: 'A(Hello)',
        expectedPart: 'A(Hello)',
        shouldFix: false
    },
    {
        name: 'Round node with one unquoted paren (fix)',
        input: 'A(Hello (World)',
        expectedPart: 'A("Hello (World")', // Note: If input unbalanced, it might fail to find closing paren if not present?
        // Wait, if input is A(Hello (World), it misses closing paren. The parser won't capture it.
        // This is fine, we can't fix what isn't a node.
        // But if user writes A(Hello (World)) -> it IS a node.
        input: 'A(Hello (World))',
        expectedPart: 'A("Hello (World)")',
        shouldFix: true
    },
    {
        name: 'Multiple nested levels',
        input: 'A(Level 1 (Level 2 (Level 3)))',
        expectedPart: 'A("Level 1 (Level 2 (Level 3))")',
        shouldFix: true
    },
    {
        name: 'Round node with class',
        input: 'A(Text (with parens)):::myClass',
        expectedPart: 'A("Text (with parens)"):::myClass',
        shouldFix: true
    },
    {
        name: 'Double circle (should skip)',
        input: 'A((Inner Circle))',
        expectedPart: 'A((Inner Circle))', // No change
        shouldFix: false
    },
    {
        name: 'Stadium (should skip)',
        input: 'A([Stadium info])',
        expectedPart: 'A([Stadium info])', // No change
        shouldFix: false
    },
    {
        name: 'Mixed with quotes (nested)',
        input: 'A(Text "quote" (parens))',
        // Quotes inside are problematic if not full.
        expectedPart: 'A("Text &quot;quote&quot; (parens)")',
        shouldFix: true
    }
];

let failed = 0;

for (const tc of testCases) {
    console.log(`Testing: ${tc.name}`);
    console.log(`Input: ${tc.input}`);
    const result = autoFixMermaidCode(tc.input);
    const fixedCode = result.code.trim(); // Trim for comparison

    // Allow partial match if full code has extra wrappers
    const pass = fixedCode.includes(tc.expectedPart) && result.hasChanges === tc.shouldFix;

    if (pass) {
        console.log(`✅ PASS`);
    } else {
        console.log(`❌ FAIL`);
        console.log(`   Expected: ${tc.expectedPart}`);
        console.log(`   Got:      ${fixedCode}`);
        console.log(`   Changes: ${result.hasChanges}`);
        failed++;
    }
    console.log('---');
}

console.log(`\nFailed: ${failed}`);
