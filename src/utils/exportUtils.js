/**
 * Exporta un SVG a PNG con alta calidad
 * @param {SVGElement} svgElement - Elemento SVG a exportar
 * @param {Object} options - Opciones de exportación
 * @param {number} options.scale - Escala de exportación (1-4)
 * @param {boolean} options.transparent - Si el fondo debe ser transparente
 * @returns {Promise<string>} - Data URL del PNG generado
 */
export const exportSvgToPng = async (svgElement, { scale = 3, transparent = false }) => {
    // Clonar SVG para manipulación
    const clonedSvg = svgElement.cloneNode(true);

    // Obtener dimensiones reales
    const bbox = svgElement.getBBox();
    const padding = 40;
    const width = Math.ceil(bbox.width + padding);
    const height = Math.ceil(bbox.height + padding);

    // Limpiar atributos problemáticos y configurar dimensiones
    clonedSvg.removeAttribute("style");
    clonedSvg.setAttribute("width", width);
    clonedSvg.setAttribute("height", height);
    clonedSvg.setAttribute("viewBox", `${bbox.x - padding / 2} ${bbox.y - padding / 2} ${width} ${height}`);
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Aplicar estilos inline para garantizar renderizado correcto
    applyInlineStyles(clonedSvg);

    // Insertar estilos con fuentes del sistema
    // Insertar estilos con fuentes del sistema
    // Capturamos el ID para asegurar especificidad máxima y vencer conflictos (ej: classDef root)
    const svgId = svgElement.id; // El ID original del SVG
    const selectorId = svgId ? `#${svgId}` : '';

    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = `
    * { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; 
    }
    text { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 14px;
    }
    .node rect, .node circle, .node ellipse, .node polygon, .node path { stroke-width: 2px; }
    .label { font-size: 14px; }
    
    /* Regla maestra para etiquetas de bordes - Especificidad Nuclear */
    ${selectorId} .root .edgeLabel, 
    ${selectorId} .edgeLabel,
    ${selectorId} .edgeLabel span,
    ${selectorId} .edgeLabel div,
    ${selectorId} .edgeLabel p,
    ${selectorId} .edgeLabel foreignObject { 
        background-color: ${transparent ? "transparent" : "#ffffff"}; 
        color: #000000 !important; 
        fill: #000000 !important;
    }

    .cluster rect { stroke-width: 2px; }
    .flowchart-link { stroke-width: 2px; }
    .marker { fill: #333; }
    .messageText { font-size: 13px; }
    .actor { stroke: #333; fill: #eee; }
    .actor-line { stroke: #333; }
    foreignObject { overflow: visible; }
  `;
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

    // Añadir fondo si no es transparente
    if (!transparent) {
        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", bbox.x - padding / 2);
        bgRect.setAttribute("y", bbox.y - padding / 2);
        bgRect.setAttribute("width", width);
        bgRect.setAttribute("height", height);
        bgRect.setAttribute("fill", "#ffffff");
        // Insertar después de nuestro style para no romper orden, aunque style ya está dentro
        clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
        // Nota: Insertamos el rect PRIMERO (como firstChild) para que quede AL FONDO (z-index visual).
        // El styleElement lo insertamos DESPUÉS del rect o lo dejamos gestionar.
        // Corrección: insertBefore firstChild pone al principio. Si ponemos rect primero, y luego style antes de rect?
        // Mejor: rect primero (fondo), luego contenido. Style no pinta, da igual.
        // Vamos a re-insertar styleElement para asegurar
        clonedSvg.insertBefore(styleElement, bgRect.nextSibling);
    } else {
        clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
    }

    // Serializar SVG y convertir a Data URI
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clonedSvg);

    // Asegurar declaración XML y encoding correcto
    if (!svgString.startsWith('<?xml')) {
        svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
    }

    // Usar base64 Data URI para evitar problemas de CORS
    const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

    // Crear imagen desde Data URI
    const img = new Image();

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Error renderizando SVG"));
        img.src = dataUri;
    });

    // Crear canvas con escala para alta resolución
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d", { alpha: transparent });

    // Configurar antialiasing de alta calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Aplicar fondo si no es transparente
    if (!transparent) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Dibujar imagen escalada
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);

    // Exportar PNG con máxima calidad
    return canvas.toDataURL("image/png", 1.0);
};

/**
 * Descarga un Data URL como archivo
 * @param {string} dataUrl - Data URL del archivo
 * @param {string} filename - Nombre del archivo
 */
export const downloadDataUrl = (dataUrl, filename) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Aplica estilos computados como inline para garantizar renderizado
 */
const applyInlineStyles = (element) => {
    if (element.nodeType !== 1) return;

    const computed = window.getComputedStyle(element);
    const importantStyles = [
        'fill', 'stroke', 'stroke-width', 'font-family', 'font-size',
        'font-weight', 'opacity', 'transform', 'text-anchor',
        'dominant-baseline', 'fill-opacity', 'stroke-opacity', 'color'
    ];

    importantStyles.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== '') {
            element.style[prop] = value;
        }
    });

    Array.from(element.children).forEach(applyInlineStyles);
};

/**
 * Genera un nombre de archivo con timestamp
 */
export const generateFilename = () => {
    return `mermaid-diagram-${Date.now()}.png`;
};
