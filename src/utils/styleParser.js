/**
 * Style Parser Utility
 * 
 * Parses Mermaid classDef definitions and provides WCAG contrast analysis.
 * Enables interactive editing of node styles for visibility fixes.
 */

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Parse a color string (hex, rgb, rgba, named) to RGB values
 * @param {string} color - Color string
 * @returns {{r: number, g: number, b: number} | null}
 */
export const parseColor = (color) => {
    if (!color) return null;

    const trimmed = color.trim().toLowerCase();

    // Named colors mapping (common ones used in Mermaid)
    const namedColors = {
        white: { r: 255, g: 255, b: 255 },
        black: { r: 0, g: 0, b: 0 },
        red: { r: 255, g: 0, b: 0 },
        green: { r: 0, g: 128, b: 0 },
        blue: { r: 0, g: 0, b: 255 },
        yellow: { r: 255, g: 255, b: 0 },
        orange: { r: 255, g: 165, b: 0 },
        purple: { r: 128, g: 0, b: 128 },
        pink: { r: 255, g: 192, b: 203 },
        gray: { r: 128, g: 128, b: 128 },
        grey: { r: 128, g: 128, b: 128 },
        transparent: null,
    };

    if (namedColors[trimmed] !== undefined) {
        return namedColors[trimmed];
    }

    // Hex color (#RGB, #RRGGBB)
    const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
        const hex = hexMatch[1];
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
            };
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }

    // RGB/RGBA
    const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
        };
    }

    return null;
};

/**
 * Convert RGB to hex string
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {string}
 */
export const rgbToHex = (rgb) => {
    if (!rgb) return '#000000';
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

/**
 * Calculate relative luminance per WCAG 2.1
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {number}
 */
export const getRelativeLuminance = (rgb) => {
    if (!rgb) return 0;

    const normalize = (value) => {
        const sRGB = value / 255;
        return sRGB <= 0.03928
            ? sRGB / 12.92
            : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };

    const R = normalize(rgb.r);
    const G = normalize(rgb.g);
    const B = normalize(rgb.b);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Calculate WCAG contrast ratio between two colors
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @returns {{ratio: number, level: 'AAA' | 'AA' | 'FAIL'}}
 */
export const getContrastRatio = (foreground, background) => {
    const fgRGB = parseColor(foreground);
    const bgRGB = parseColor(background);

    if (!fgRGB || !bgRGB) {
        return { ratio: 1, level: 'FAIL' };
    }

    const L1 = getRelativeLuminance(fgRGB);
    const L2 = getRelativeLuminance(bgRGB);

    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);

    const ratio = (lighter + 0.05) / (darker + 0.05);

    let level = 'FAIL';
    if (ratio >= 7) level = 'AAA';
    else if (ratio >= 4.5) level = 'AA';

    return { ratio: Math.round(ratio * 10) / 10, level };
};

/**
 * Suggest optimal text color (black or white) for a given background
 * @param {string} backgroundColor
 * @returns {string}
 */
export const suggestTextColor = (backgroundColor) => {
    const bgRGB = parseColor(backgroundColor);
    if (!bgRGB) return '#000000';

    const luminance = getRelativeLuminance(bgRGB);

    // Use white text for dark backgrounds, black for light
    return luminance > 0.179 ? '#000000' : '#ffffff';
};

// =============================================================================
// INTELLIGENT CONTRAST FIX ALGORITHM
// =============================================================================

/**
 * Convert RGB to HSL
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {{h: number, s: number, l: number}}
 */
const rgbToHsl = (rgb) => {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
            default: h = 0;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {{r: number, g: number, b: number}}
 */
const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
    };
    return { r: f(0), g: f(8), b: f(4) };
};

/**
 * Calculate minimum lightness adjustment needed to achieve target contrast
 * @param {number} currentContrast - Current contrast ratio
 * @param {number} targetContrast - Target contrast ratio (4.5 for AA)
 * @returns {number} - Estimated lightness delta needed
 */
const estimateLightnessDelta = (currentContrast, targetContrast) => {
    // Logarithmic relationship between contrast and luminance
    const ratio = targetContrast / Math.max(currentContrast, 0.1);
    return Math.min(50, Math.max(5, Math.log2(ratio) * 15));
};

/**
 * Search in one direction for optimal lightness
 * @param {{h: number, s: number, l: number}} hsl - Original HSL
 * @param {string} targetHex - Color to contrast against
 * @param {boolean} goLighter - Direction (true = lighter, false = darker)
 * @param {number} originalL - Original lightness for deltaL calculation
 * @returns {Array<{l: number, hex: string, ratio: number, deltaL: number}>}
 */
const searchDirection = (hsl, targetHex, goLighter, originalL) => {
    const candidates = [];
    const direction = goLighter ? 1 : -1;

    // Search from AFTER original (step=2) to limit - we want IMPROVEMENTS only
    for (let step = 2; step <= 100; step += 2) {
        const newL = Math.max(0, Math.min(100, originalL + (direction * step)));

        // Skip if going wrong direction
        if (goLighter && newL < originalL) continue;
        if (!goLighter && newL > originalL) continue;

        const newRGB = hslToRgb(hsl.h, hsl.s, newL);
        const newHex = rgbToHex(newRGB);
        const contrast = getContrastRatio(newHex, targetHex);

        candidates.push({
            l: newL,
            hex: newHex,
            ratio: contrast.ratio,
            deltaL: Math.abs(newL - originalL)
        });

        // Stop if we hit the limit
        if (newL <= 0 || newL >= 100) break;
    }

    return candidates;
};

/**
 * Find optimal color by searching BOTH directions and picking the best
 * This ensures we always find the optimal solution regardless of starting point
 * @param {string} hexColor - Original hex color
 * @param {string} targetHex - Color to contrast against
 * @returns {{hex: string, ratio: number, deltaL: number}}
 */
export const findOptimalLightness = (hexColor, targetHex) => {
    const rgb = parseColor(hexColor);
    const targetRGB = parseColor(targetHex);
    if (!rgb || !targetRGB) return { hex: hexColor, ratio: 1, deltaL: 100 };

    const hsl = rgbToHsl(rgb);
    const originalL = hsl.l;

    // Search BOTH directions
    const lighterCandidates = searchDirection(hsl, targetHex, true, originalL);
    const darkerCandidates = searchDirection(hsl, targetHex, false, originalL);
    const allCandidates = [...lighterCandidates, ...darkerCandidates];

    if (allCandidates.length === 0) {
        return { hex: hexColor, ratio: getContrastRatio(hexColor, targetHex).ratio, deltaL: 0 };
    }

    // Sort by: AAA first, then AA, then by smallest deltaL within each tier
    allCandidates.sort((a, b) => {
        const aLevel = a.ratio >= 7.0 ? 2 : a.ratio >= 4.5 ? 1 : 0;
        const bLevel = b.ratio >= 7.0 ? 2 : b.ratio >= 4.5 ? 1 : 0;

        // Higher level always wins
        if (aLevel !== bLevel) return bLevel - aLevel;

        // Same level: smaller change wins
        return a.deltaL - b.deltaL;
    });

    // Get the best candidate
    let best = allCandidates[0];

    // Fine-tune around best with 1% steps to find exact optimal
    const fineCandidates = [];
    for (let fineL = Math.max(0, best.l - 5); fineL <= Math.min(100, best.l + 5); fineL += 1) {
        const newRGB = hslToRgb(hsl.h, hsl.s, fineL);
        const newHex = rgbToHex(newRGB);
        const contrast = getContrastRatio(newHex, targetHex);
        const deltaL = Math.abs(fineL - originalL);

        fineCandidates.push({ l: fineL, hex: newHex, ratio: contrast.ratio, deltaL });
    }

    // Re-sort fine candidates
    fineCandidates.sort((a, b) => {
        const aLevel = a.ratio >= 7.0 ? 2 : a.ratio >= 4.5 ? 1 : 0;
        const bLevel = b.ratio >= 7.0 ? 2 : b.ratio >= 4.5 ? 1 : 0;
        if (aLevel !== bLevel) return bLevel - aLevel;
        return a.deltaL - b.deltaL;
    });

    if (fineCandidates.length > 0) {
        best = fineCandidates[0];
    }

    return { hex: best.hex, ratio: best.ratio, deltaL: best.deltaL };
};

/**
 * Intelligent contrast fix - analyzes both options and chooses the best
 * Works for both fixing FAIL and improving AA to AAA
 * @param {string} fillColor - Background/fill color
 * @param {string} textColor - Text/foreground color
 * @returns {{strategy: 'text' | 'fill' | 'none', newColor: string, reason: string, improvement: {from: number, to: number}}}
 */
export const smartContrastFix = (fillColor, textColor) => {
    const currentContrast = getContrastRatio(textColor, fillColor);

    // Already AAA? No improvement needed
    if (currentContrast.level === 'AAA') {
        return {
            strategy: 'none',
            newColor: null,
            reason: 'Contrast already meets WCAG AAA',
            improvement: { from: currentContrast.ratio, to: currentContrast.ratio }
        };
    }

    const fillRGB = parseColor(fillColor);
    const textRGB = parseColor(textColor);
    if (!fillRGB || !textRGB) {
        return {
            strategy: 'text',
            newColor: suggestTextColor(fillColor),
            reason: 'Could not parse colors, using simple text fix',
            improvement: { from: currentContrast.ratio, to: 21 }
        };
    }

    // Strategy 1: Adjust text color (bidirectional search finds optimal direction)
    const textFix = findOptimalLightness(textColor, fillColor);

    // Strategy 2: Adjust fill color (bidirectional search finds optimal direction)
    const fillFix = findOptimalLightness(fillColor, textColor);

    // Strategy 3: Simple black/white text (always works)
    const simpleTextColor = suggestTextColor(fillColor);
    const simpleContrast = getContrastRatio(simpleTextColor, fillColor);

    // Decision: Choose strategy with minimum visual change
    // Priority: 
    // 1. Preserve original hue if possible
    // 2. Minimize lightness change
    // 3. Fallback to black/white text

    const strategies = [];

    // Current WCAG level
    const currentLevel = currentContrast.ratio >= 7.0 ? 2 : currentContrast.ratio >= 4.5 ? 1 : 0;

    // Evaluate text adjustment - only add if it IMPROVES the WCAG level
    const textLevel = textFix.ratio >= 7.0 ? 2 : textFix.ratio >= 4.5 ? 1 : 0;
    if (textLevel > currentLevel) {
        strategies.push({
            strategy: 'text',
            newColor: textFix.hex,
            score: textFix.deltaL + (textFix.hex === '#ffffff' || textFix.hex === '#000000' ? 10 : 0),
            reason: `Adjusted text lightness by ${Math.round(textFix.deltaL)}%`,
            improvement: { from: currentContrast.ratio, to: textFix.ratio }
        });
    }

    // Evaluate fill adjustment - only add if it IMPROVES the WCAG level
    const fillLevel = fillFix.ratio >= 7.0 ? 2 : fillFix.ratio >= 4.5 ? 1 : 0;
    if (fillLevel > currentLevel) {
        strategies.push({
            strategy: 'fill',
            newColor: fillFix.hex,
            score: fillFix.deltaL * 1.2 + 5, // Slight penalty for changing background
            reason: `Adjusted fill lightness by ${Math.round(fillFix.deltaL)}%`,
            improvement: { from: currentContrast.ratio, to: fillFix.ratio }
        });
    }

    // Simple text fix - only if it's an improvement
    if (simpleContrast.ratio > currentContrast.ratio + 0.5) {
        strategies.push({
            strategy: 'text',
            newColor: simpleTextColor,
            score: 50, // High score = last resort
            reason: `Changed text to ${simpleTextColor === '#ffffff' ? 'white' : 'black'}`,
            improvement: { from: currentContrast.ratio, to: simpleContrast.ratio }
        });
    }

    // Choose best strategy (lowest score)
    strategies.sort((a, b) => a.score - b.score);

    // If no improvement strategies found, return no change
    if (strategies.length === 0) {
        return {
            strategy: 'none',
            newColor: null,
            reason: 'Already at maximum achievable contrast',
            improvement: { from: currentContrast.ratio, to: currentContrast.ratio }
        };
    }

    const best = strategies[0];

    return {
        strategy: best.strategy,
        newColor: best.newColor,
        reason: best.reason,
        improvement: best.improvement
    };
};

// =============================================================================
// CLASSDEF PARSING
// =============================================================================

/**
 * Parse all classDef definitions from Mermaid code
 * @param {string} code - Mermaid code
 * @returns {Map<string, {fill?: string, stroke?: string, color?: string, strokeWidth?: string, raw: string, lineNumber: number}>}
 */
export const parseClassDefs = (code) => {
    const classDefs = new Map();
    if (!code) return classDefs;

    const lines = code.split('\n');

    // Regex to match: classDef className prop1:val1,prop2:val2...
    const classDefRegex = /^\s*classDef\s+(\w+)\s+(.+?)\s*;?\s*$/;

    lines.forEach((line, index) => {
        const match = line.match(classDefRegex);
        if (!match) return;

        const [, className, propsString] = match;

        // Parse properties
        const props = { raw: propsString, lineNumber: index + 1 };
        const propPairs = propsString.split(',');

        propPairs.forEach((pair) => {
            const colonIndex = pair.indexOf(':');
            if (colonIndex === -1) return;

            const key = pair.slice(0, colonIndex).trim();
            const value = pair.slice(colonIndex + 1).trim();

            // Normalize common property names
            const normalizedKey = key.toLowerCase();
            if (normalizedKey === 'fill') props.fill = value;
            else if (normalizedKey === 'stroke') props.stroke = value;
            else if (normalizedKey === 'color') props.color = value;
            else if (normalizedKey === 'stroke-width') props.strokeWidth = value;
            else props[key] = value;
        });

        classDefs.set(className, props);
    });

    return classDefs;
};

/**
 * Parse class assignments (class NODE1,NODE2 className;)
 * @param {string} code
 * @returns {Map<string, string[]>} Map of nodeId -> array of classNames
 */
export const parseClassAssignments = (code) => {
    const assignments = new Map();
    if (!code) return assignments;

    const lines = code.split('\n');

    // Regex: class nodeList className;
    const classAssignRegex = /^\s*class\s+([^;]+)\s+(\w+)\s*;?\s*$/;

    lines.forEach((line) => {
        const match = line.match(classAssignRegex);
        if (!match) return;

        const [, nodeList, className] = match;
        const nodes = nodeList.split(',').map(n => n.trim());

        nodes.forEach(nodeId => {
            if (!assignments.has(nodeId)) {
                assignments.set(nodeId, []);
            }
            assignments.get(nodeId).push(className);
        });
    });

    return assignments;
};

/**
 * Update a classDef in the code with new properties
 * @param {string} code - Original Mermaid code
 * @param {string} className - Class name to update
 * @param {Object} newProps - New properties {fill?, stroke?, color?, strokeWidth?}
 * @returns {string} - Modified code
 */
export const updateClassDef = (code, className, newProps) => {
    if (!code || !className) return code;

    const lines = code.split('\n');
    const classDefRegex = new RegExp(`^(\\s*classDef\\s+${className}\\s+)(.+?)(\\s*;?\\s*)$`);

    let found = false;
    const newLines = lines.map((line) => {
        const match = line.match(classDefRegex);
        if (!match) return line;

        found = true;
        const [, prefix, propsString, suffix] = match;

        // Parse existing props
        const existingProps = {};
        propsString.split(',').forEach((pair) => {
            const colonIndex = pair.indexOf(':');
            if (colonIndex === -1) return;
            const key = pair.slice(0, colonIndex).trim();
            const value = pair.slice(colonIndex + 1).trim();
            existingProps[key] = value;
        });

        // Merge with new props
        const mergedProps = { ...existingProps };
        if (newProps.fill !== undefined) mergedProps.fill = newProps.fill;
        if (newProps.stroke !== undefined) mergedProps.stroke = newProps.stroke;
        if (newProps.color !== undefined) mergedProps.color = newProps.color;
        if (newProps.strokeWidth !== undefined) mergedProps['stroke-width'] = newProps.strokeWidth;

        // Rebuild props string
        const newPropsString = Object.entries(mergedProps)
            .map(([k, v]) => `${k}:${v}`)
            .join(',');

        return `${prefix}${newPropsString}${suffix.includes(';') ? ';' : ''}`;
    });

    return newLines.join('\n');
};

/**
 * Analyze all classDefs for contrast issues
 * @param {string} code
 * @returns {Array<{className: string, fill: string, color: string, contrast: {ratio: number, level: string}, suggestedColor: string}>}
 */
export const analyzeContrastIssues = (code) => {
    const classDefs = parseClassDefs(code);
    const issues = [];

    classDefs.forEach((props, className) => {
        const fill = props.fill || '#ffffff';
        // If no explicit color, assume white (common Mermaid default for dark themes)
        const color = props.color || 'white';

        const contrast = getContrastRatio(color, fill);
        const suggestedColor = suggestTextColor(fill);

        issues.push({
            className,
            fill,
            color,
            stroke: props.stroke,
            contrast,
            suggestedColor,
            needsFix: contrast.level === 'FAIL',
            lineNumber: props.lineNumber,
        });
    });

    return issues;
};

/**
 * Auto-fix all contrast issues in classDefs
 * @param {string} code
 * @returns {{code: string, fixes: Array<{className: string, oldColor: string, newColor: string}>}}
 */
export const autoFixAllContrast = (code) => {
    const issues = analyzeContrastIssues(code);
    const fixes = [];
    let newCode = code;

    issues.forEach((issue) => {
        if (issue.needsFix) {
            newCode = updateClassDef(newCode, issue.className, { color: issue.suggestedColor });
            fixes.push({
                className: issue.className,
                oldColor: issue.color,
                newColor: issue.suggestedColor,
            });
        }
    });

    return { code: newCode, fixes };
};

// =============================================================================
// INLINE STYLE PARSING (style NodeID fill:...,color:...)
// =============================================================================

/**
 * Parse all inline style statements from Mermaid code
 * @param {string} code - Mermaid code
 * @returns {Map<string, {fill?: string, stroke?: string, color?: string, raw: string, lineNumber: number}>}
 */
export const parseInlineStyles = (code) => {
    const inlineStyles = new Map();
    if (!code) return inlineStyles;

    const lines = code.split('\n');

    // Regex to match: style NodeID prop1:val1,prop2:val2...
    // Note: NodeID can contain letters, numbers, and some special chars but not spaces
    const styleRegex = /^\s*style\s+(\w+)\s+(.+?)\s*$/;

    lines.forEach((line, index) => {
        const match = line.match(styleRegex);
        if (!match) return;

        const [, nodeId, propsString] = match;

        // Parse properties
        const props = { raw: propsString, lineNumber: index + 1, type: 'inline' };
        const propPairs = propsString.split(',');

        propPairs.forEach((pair) => {
            const colonIndex = pair.indexOf(':');
            if (colonIndex === -1) return;

            const key = pair.slice(0, colonIndex).trim();
            const value = pair.slice(colonIndex + 1).trim();

            // Normalize common property names
            const normalizedKey = key.toLowerCase();
            if (normalizedKey === 'fill') props.fill = value;
            else if (normalizedKey === 'stroke') props.stroke = value;
            else if (normalizedKey === 'color') props.color = value;
            else if (normalizedKey === 'stroke-width') props.strokeWidth = value;
            else props[key] = value;
        });

        inlineStyles.set(nodeId, props);
    });

    return inlineStyles;
};

/**
 * Update an inline style statement in the code
 * @param {string} code - Original Mermaid code
 * @param {string} nodeId - Node ID to update
 * @param {Object} newProps - New properties {fill?, stroke?, color?}
 * @returns {string} - Modified code
 */
export const updateInlineStyle = (code, nodeId, newProps) => {
    if (!code || !nodeId) return code;

    const lines = code.split('\n');
    const styleRegex = new RegExp(`^(\\s*style\\s+${nodeId}\\s+)(.+?)(\\s*)$`);

    const newLines = lines.map((line) => {
        const match = line.match(styleRegex);
        if (!match) return line;

        const [, prefix, propsString, suffix] = match;

        // Parse existing props
        const existingProps = {};
        propsString.split(',').forEach((pair) => {
            const colonIndex = pair.indexOf(':');
            if (colonIndex === -1) return;
            const key = pair.slice(0, colonIndex).trim();
            const value = pair.slice(colonIndex + 1).trim();
            existingProps[key] = value;
        });

        // Merge with new props
        const mergedProps = { ...existingProps };
        if (newProps.fill !== undefined) mergedProps.fill = newProps.fill;
        if (newProps.stroke !== undefined) mergedProps.stroke = newProps.stroke;
        if (newProps.color !== undefined) mergedProps.color = newProps.color;
        if (newProps.strokeWidth !== undefined) mergedProps['stroke-width'] = newProps.strokeWidth;

        // Rebuild props string
        const newPropsString = Object.entries(mergedProps)
            .map(([k, v]) => `${k}:${v}`)
            .join(',');

        return `${prefix}${newPropsString}${suffix}`;
    });

    return newLines.join('\n');
};

/**
 * Analyze ALL styles (both classDef and inline) for contrast issues
 * @param {string} code
 * @returns {Array<{id: string, type: 'classDef' | 'inline', fill: string, color: string, contrast: object, suggestedColor: string, needsFix: boolean, lineNumber: number}>}
 */
export const analyzeAllStyles = (code) => {
    const results = [];

    // Analyze classDef styles
    const classDefs = parseClassDefs(code);
    classDefs.forEach((props, className) => {
        const fill = props.fill || '#ffffff';
        const color = props.color || 'white';
        const contrast = getContrastRatio(color, fill);
        const suggestedColor = suggestTextColor(fill);

        results.push({
            id: className,
            type: 'classDef',
            fill,
            color,
            stroke: props.stroke,
            contrast,
            suggestedColor,
            needsFix: contrast.level === 'FAIL',
            lineNumber: props.lineNumber,
        });
    });

    // Analyze inline styles
    const inlineStyles = parseInlineStyles(code);
    inlineStyles.forEach((props, nodeId) => {
        const fill = props.fill || '#ffffff';
        const color = props.color || 'white';
        const contrast = getContrastRatio(color, fill);
        const suggestedColor = suggestTextColor(fill);

        results.push({
            id: nodeId,
            type: 'inline',
            fill,
            color,
            stroke: props.stroke,
            contrast,
            suggestedColor,
            needsFix: contrast.level === 'FAIL',
            lineNumber: props.lineNumber,
        });
    });

    return results;
};

/**
 * Update any style (classDef or inline) based on type
 * @param {string} code
 * @param {string} id - className or nodeId
 * @param {'classDef' | 'inline'} type
 * @param {Object} newProps
 * @returns {string}
 */
export const updateStyle = (code, id, type, newProps) => {
    if (type === 'classDef') {
        return updateClassDef(code, id, newProps);
    } else {
        return updateInlineStyle(code, id, newProps);
    }
};

/**
 * Auto-fix all contrast issues (both classDef and inline) using SMART algorithm
 * @param {string} code
 * @returns {{code: string, fixes: Array}}
 */
export const autoFixAllStyles = (code) => {
    const issues = analyzeAllStyles(code);
    const fixes = [];
    let newCode = code;

    issues.forEach((issue) => {
        if (issue.needsFix) {
            // Use smart fix algorithm
            const smartFix = smartContrastFix(issue.fill, issue.color);

            if (smartFix.strategy === 'none') return;

            // Apply the fix based on strategy
            const updateProps = smartFix.strategy === 'fill'
                ? { fill: smartFix.newColor }
                : { color: smartFix.newColor };

            newCode = updateStyle(newCode, issue.id, issue.type, updateProps);

            fixes.push({
                id: issue.id,
                type: issue.type,
                strategy: smartFix.strategy,
                reason: smartFix.reason,
                oldColor: smartFix.strategy === 'fill' ? issue.fill : issue.color,
                newColor: smartFix.newColor,
                improvement: smartFix.improvement,
            });
        }
    });

    return { code: newCode, fixes };
};

/**
 * Improve all AA-level styles to AAA
 * @param {string} code - Mermaid code
 * @returns {{code: string, improvements: Array<{id: string, type: string, oldColor: string, newColor: string, improvement: {from: number, to: number}}>}}
 */
export const improveAllStyles = (code) => {
    const allStyles = analyzeAllStyles(code);
    const improvements = [];
    let newCode = code;

    allStyles.forEach((style) => {
        const contrast = getContrastRatio(style.color, style.fill);

        // Only target AA-level styles (4.5-7.0 ratio)
        if (contrast.level === 'AA') {
            const smartFix = smartContrastFix(style.fill, style.color);

            if (smartFix.strategy === 'none') return;
            if (smartFix.improvement.to <= contrast.ratio) return; // No improvement

            // Apply the improvement
            const updateProps = smartFix.strategy === 'fill'
                ? { fill: smartFix.newColor }
                : { color: smartFix.newColor };

            newCode = updateStyle(newCode, style.id, style.type, updateProps);

            improvements.push({
                id: style.id,
                type: style.type,
                strategy: smartFix.strategy,
                reason: smartFix.reason,
                oldColor: smartFix.strategy === 'fill' ? style.fill : style.color,
                newColor: smartFix.newColor,
                improvement: smartFix.improvement,
            });
        }
    });

    return { code: newCode, improvements };
};

// =============================================================================
// CURATED COLOR PALETTES
// =============================================================================

export const COLOR_PALETTES = {
    // Dark fills (pair with white text)
    darkFills: [
        { hex: '#1a1a2e', name: 'Midnight' },
        { hex: '#16213e', name: 'Navy' },
        { hex: '#0f3460', name: 'Deep Blue' },
        { hex: '#2c3e50', name: 'Wet Asphalt' },
        { hex: '#1e272e', name: 'Thunder' },
        { hex: '#2d3436', name: 'Dracula' },
        { hex: '#353b48', name: 'Steel' },
        { hex: '#4a0e4e', name: 'Purple Night' },
        { hex: '#1b4332', name: 'Forest' },
        { hex: '#7f1d1d', name: 'Maroon' },
    ],
    // Light fills (pair with dark text)
    lightFills: [
        { hex: '#e1f5fe', name: 'Ice Blue' },
        { hex: '#e8f5e9', name: 'Mint' },
        { hex: '#fff3e0', name: 'Peach' },
        { hex: '#f3e5f5', name: 'Lavender' },
        { hex: '#ffebee', name: 'Rose' },
        { hex: '#fff8e1', name: 'Cream' },
        { hex: '#e0f7fa', name: 'Cyan Light' },
        { hex: '#fce4ec', name: 'Pink Light' },
        { hex: '#f1f8e9', name: 'Lime Light' },
        { hex: '#eceff1', name: 'Blue Grey' },
    ],
    // Text colors
    textColors: [
        { hex: '#ffffff', name: 'White' },
        { hex: '#f8f9fa', name: 'Off White' },
        { hex: '#000000', name: 'Black' },
        { hex: '#1a1a2e', name: 'Dark Blue' },
        { hex: '#2c3e50', name: 'Dark Grey' },
        { hex: '#b71c1c', name: 'Dark Red' },
        { hex: '#1b5e20', name: 'Dark Green' },
        { hex: '#0d47a1', name: 'Dark Navy' },
    ],
};
