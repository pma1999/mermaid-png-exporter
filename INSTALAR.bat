@echo off
chcp 65001 >nul
title Mermaid PNG Exporter - Instalación
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║         MERMAID → PNG EXPORTER - INSTALADOR               ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo  [1/3] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ⚠ Node.js no está instalado.
    echo.
    echo  Por favor, instálalo desde: https://nodejs.org
    echo  Descarga la versión LTS y ejecuta el instalador.
    echo  Luego vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo  ✓ Node.js %NODE_VERSION% detectado
echo.

:: Instalar dependencias
echo  [2/3] Instalando dependencias...
echo       Esto puede tardar un momento...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ✗ Error instalando dependencias
    pause
    exit /b 1
)
echo.
echo  ✓ Dependencias instaladas correctamente
echo.

:: Iniciar aplicación
echo  [3/3] Iniciando aplicación...
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║  La aplicación se abrirá en tu navegador automáticamente  ║
echo  ║                                                           ║
echo  ║  URL: http://localhost:3000                               ║
echo  ║                                                           ║
echo  ║  Para cerrar: Cierra esta ventana o presiona Ctrl+C       ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

call npm run dev
