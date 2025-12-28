/**
 * Visibility Fixer Utility
 * 
 * Provides targeted fixes for visibility issues in Mermaid diagrams.
 * Uses a "Direct Injection" approach with robust CSS and LinkStyle.
 */

/**
 * Applies a high-contrast style to the diagram text and lines.
 * 
 * @param {string} code - The original Mermaid code
 * @param {string} mode - 'dark' (Fix for Dark Text) or 'light' (Fix for Light Text)
 * @returns {string} - The modified code
 */
export const fixEdgeVisibility = (code, mode = 'dark') => {
    if (!code) return code;

    const lines = code.split('\n');
    let newLines = [...lines];

    // --------------------------------------------------------
    // 1. CLEANUP
    // --------------------------------------------------------
    // Remove old directives and linkStyles
    newLines = newLines.filter(line =>
        !line.trim().startsWith('%%{init:') &&
        !/^\s*linkStyle\s+default\s+/.test(line)
    );

    // --------------------------------------------------------
    // 2. DEFINE COLORS
    // --------------------------------------------------------
    const isDarkText = mode === 'dark';

    const colors = {
        // Text Color: Black or White
        text: isDarkText ? '#000000' : '#ffffff',
        // Background for Label: White or Black
        bg: isDarkText ? '#ffffff' : '#1a1a1a',
        // Line Color: ALWAYS Dark/Visible (unless user really wants white lines on dark bg)
        // Since the user is complaining about disappearing lines, we stick to safe Dark Gray.
        // Even for "Light Text" mode (White text), we usually want the lines to be visible on the canvas.
        // If the canvas is white, lines must be dark.
        line: '#333333'
    };

    // --------------------------------------------------------
    // 3. CONSTRUCT CSS (The Heavy Hammer)
    // --------------------------------------------------------
    // We explicitly target every known permutation of Mermaid label classes.
    // SVG text uses 'fill', HTML text uses 'color'.

    const cssRule = `
        /* HTML Labels */
        .edgeLabel { color: ${colors.text} !important; opacity: 1 !important; }
        .edgeLabel span { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
        .edgeLabel div { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
        
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
    // 4. CONSTRUCT LINKSTYLE (Line Visibility)
    // --------------------------------------------------------
    // Explicitly paint lines with the safe line color

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
 * Applies high contrast to node text.
 */
export const fixNodeVisibility = (code, mode = 'dark') => {
    const lines = code.split('\n');
    let newLines = [...lines];

    const color = mode === 'dark' ? '#000000' : '#ffffff';
    const fill = mode === 'dark' ? '#ffffff' : '#333333';

    const directive = `classDef default fill:${fill},stroke:${color},color:${color};`;

    newLines = newLines.filter(l => !/^\s*classDef\s+default\s/.test(l));

    let insertIdx = newLines.length;
    while (insertIdx > 0 && newLines[insertIdx - 1].trim() === '') {
        insertIdx--;
    }
    newLines.splice(insertIdx, 0, directive);

    return newLines.join('\n');
};
