// Test valid Mermaid patterns vs invalid ones

// PATTERN 1: Invalid - ]:( after node
// ]:(dispersión):::context - The :(dispersión) is INVALID
// This appears to be user trying to add an annotation but the syntax is wrong

// PATTERN 2: What they likely intended options:
// Option A: Include in node text
// INTEGRA["Requiere<br/>INTEGRACIÓN (dispersión)"]:::context

// Option B: Use as comment (remove entirely)
// INTEGRA[Requiere<br/>INTEGRACIÓN]:::context  %% dispersión

// Option C: Keep just the class
// INTEGRA[Requiere<br/>INTEGRACIÓN]:::context

// The pattern to detect:
// After a node definition [...] or {...} or (...):
// If immediately followed by : and then (text) or text that's NOT :::class
// Then it's invalid

const patterns = [
    // Valid patterns
    'A[Text]:::class',
    'A[Text]',
    'A[Text] --> B',
    'A["Text (with parens)"]:::class',

    // Invalid patterns we need to fix
    'A[Text]:(annotation):::class',
    'A[Text]:annotation:::class',
    'A[Text]:(annotation)',
    'A{Rhombus}:(annotation):::class',
];

console.log('=== Analyzing patterns ===');

// Detection pattern:
// After node delimiters (], }, )), detect :text that is NOT :::className
const invalidTrailingPattern = /(\]|\}|\))\s*:(?!::)\s*(\([^)]+\)|[^\s:]+)/g;

for (const p of patterns) {
    const matches = [...p.matchAll(invalidTrailingPattern)];
    console.log(`Pattern: "${p}"`);
    console.log(`  Invalid trailing found: ${matches.length > 0}`);
    if (matches.length > 0) {
        matches.forEach(m => {
            console.log(`    Match: "${m[0]}" at index ${m.index}`);
            console.log(`    Delimiter: "${m[1]}", Trailing: "${m[2]}"`);
        });
    }
    console.log();
}
