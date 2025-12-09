/**
 * Mermaid PNG Exporter - Servidor Embebido
 * 
 * Este servidor sirve la aplicación web y abre el navegador automáticamente.
 * Se empaqueta con pkg para crear un ejecutable standalone.
 */

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 3000;

// Determinar la ruta de los archivos estáticos
// En desarrollo: ./dist
// Empaquetado con pkg: dentro del snapshot (__dirname)
const distPath = path.join(__dirname, 'dist');

// Servir archivos estáticos
app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true
}));

// SPA fallback - todas las rutas van a index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Abrir navegador según el sistema operativo
function openBrowser(url) {
    const platform = os.platform();
    let command;

    switch (platform) {
        case 'win32':
            command = `start "" "${url}"`;
            break;
        case 'darwin':
            command = `open "${url}"`;
            break;
        default:
            command = `xdg-open "${url}"`;
    }

    exec(command, (err) => {
        if (err) {
            console.log(`⚠ No se pudo abrir el navegador automáticamente.`);
            console.log(`  Abre manualmente: ${url}`);
        }
    });
}

// Banner de inicio
function showBanner() {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════════════════════╗');
    console.log('  ║           MERMAID → PNG EXPORTER                          ║');
    console.log('  ╚═══════════════════════════════════════════════════════════╝');
    console.log('');
}

// Iniciar servidor
const server = app.listen(PORT, () => {
    showBanner();
    console.log(`  ✓ Servidor iniciado en http://localhost:${PORT}`);
    console.log('');
    console.log('  Abriendo navegador...');
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  Para cerrar: Cierra esta ventana o presiona Ctrl+C    │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    console.log('');

    openBrowser(`http://localhost:${PORT}`);
});

// Manejo de cierre limpio
process.on('SIGINT', () => {
    console.log('');
    console.log('  Cerrando servidor...');
    server.close(() => {
        console.log('  ✓ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    server.close(() => {
        process.exit(0);
    });
});
