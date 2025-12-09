# Mermaid → PNG Exporter

Exportador de diagramas Mermaid a PNG de alta calidad.

## 🚀 Uso rápido

### Opción 1: Ejecutable (Recomendado)

Haz doble clic en **`release/MermaidExporter.exe`**

- No requiere instalación
- Se abre automáticamente en tu navegador
- Funciona sin conexión a internet

### Opción 2: Desarrollo

```bash
npm install
npm run dev
```

## 📦 Crear ejecutable

Para regenerar el ejecutable después de hacer cambios:

```powershell
.\build-exe.ps1
```

Esto generará `release/MermaidExporter.exe` (~38 MB).

## ✨ Funcionalidades

- ✨ Renderizado en tiempo real
- 📥 Exportación PNG en escalas 1x, 2x, 3x, 4x
- 🎨 Opción de fondo transparente
- 📋 8 plantillas de ejemplo incluidas
- 🔄 Validación de sintaxis Mermaid
- 📴 Funciona offline (PWA)
- 💻 Instalable como app de escritorio desde el navegador

## 📊 Tipos de diagramas soportados

- Flowchart
- Sequence Diagram
- Class Diagram
- State Diagram
- Entity Relationship
- Gantt Chart
- Pie Chart
- Mind Map

## 🛠️ Estructura del proyecto

```
mermaid-png-exporter/
├── src/                    # Código fuente React
├── public/                 # Iconos PWA
├── server/                 # Servidor embebido para el .exe
├── release/                # Ejecutables generados
│   └── MermaidExporter.exe
├── build-exe.ps1          # Script para crear el ejecutable
└── vite.config.js         # Configuración PWA
```

---

Desarrollado con Vite + React + Mermaid.js
