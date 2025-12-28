/**
 * Visibility Fixer Utility
 * 
 * Provides a single, robust High Contrast Mode to fix visibility issues.
 * Uses the proven Tri-Layer approach:
 * 1. Base Theme Init
 * 2. Wildcard CSS Injection
 * 3. LinkStyle Command
 */

/**
 * Applies the High Contrast style (White Text, Dark Labels, Dark Lines).
 * This is the only mode that guarantees visibility across all edge cases.
 * 
 * @param {string} code - The original Mermaid code
 * @returns {string} - The modified code
 */
export const applyHighContrast = (code) => {
    if (!code) return code;

    const lines = code.split('\n');
    let newLines = [...lines];

    // --------------------------------------------------------
    // 1. CLEANUP
    // --------------------------------------------------------
    newLines = newLines.filter(line =>
        !line.trim().startsWith('%%{init:') &&
        !/^\s*linkStyle\s+default\s+/.test(line)
    );

    // --------------------------------------------------------
    // 2. DEFINE COLORS (Proven Config)
    // --------------------------------------------------------
    // Text: White (#ffffff)
    // Background: Dark Gray (#1a1a1a) (Better than pure black for readability)
    // Lines: Medium/Dark Gray (#333333) (Visible on white/transparent canvas)

    const colors = {
        text: '#ffffff',
        bg: '#1a1a1a',
        line: '#333333'
    };

    // --------------------------------------------------------
    // 3. CONSTRUCT CSS (The Nuclear Option)
    // --------------------------------------------------------
    const cssRule = `
        /* HTML Labels */
        .edgeLabel { color: ${colors.text} !important; opacity: 1 !important; }
        .edgeLabel span { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
        .edgeLabel div { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
        .edgeLabel p { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
        
        /* Wildcard for HTML children (The Fixer) */
        .edgeLabel * { color: ${colors.text} !important; background-color: transparent; }
        .edgeLabel span, .edgeLabel div { background-color: ${colors.bg} !important; }
        
        /* SVG Labels */
        g.edgeLabels text { fill: ${colors.text} !important; color: ${colors.text} !important; }
        g.edgeLabels rect { fill: ${colors.bg} !important; opacity: 1 !important; stroke: ${colors.line} !important; stroke-width: 1px !important; }
        
        /* General fallback */
        .label { color: ${colors.text} !important; fill: ${colors.text} !important; }
    `.replace(/\s+/g, ' ').trim();

    const config = {
        theme: "base",
        themeVariables: {
            primaryTextColor: colors.text,
            secondaryTextColor: colors.text,
            tertiaryTextColor: colors.text,
            textColor: colors.text,
            edgeLabelBackground: colors.bg,
            lineColor: colors.line,
            mainBkg: "transparent",
            background: "transparent"
        },
        themeCSS: cssRule
    };

    const directive = `%%{init: ${JSON.stringify(config)} }%%`;

    // Insert Directive at TOP
    newLines.unshift(directive);

    // --------------------------------------------------------
    // 4. CONSTRUCT LINKSTYLE (Redundancy)
    // --------------------------------------------------------
    // Explicitly set stroke to ensure visibility
    const linkStyle = `linkStyle default stroke:${colors.line},stroke-width:1px,fill:none;`;

    // Insert LinkStyle at BOTTOM
    let insertIdx = newLines.length;
    while (insertIdx > 0 && newLines[insertIdx - 1].trim() === '') {
        insertIdx--;
    }
    newLines.splice(insertIdx, 0, linkStyle);

    return newLines.join('\n');
};

/**
 * Resets any visibility fixes by removing the injected lines.
 * 
 * @param {string} code 
 * @returns {string} 
 */
export const resetVisibility = (code) => {
    if (!code) return code;
    return code.split('\n')
        .filter(line =>
            !line.trim().startsWith('%%{init:') &&
            !/^\s*(linkStyle|classDef)\s+default/.test(line)
        )
        .join('\n');
};
