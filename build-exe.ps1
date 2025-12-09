# Mermaid PNG Exporter - Build Script
# Genera el ejecutable MermaidExporter.exe

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        MERMAID PNG EXPORTER - BUILD                       ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Build de la aplicación
Write-Host "  [1/4] Generando build de producción..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Error en el build" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Build completado" -ForegroundColor Green
Write-Host ""

# Paso 2: Copiar dist al servidor
Write-Host "  [2/4] Copiando archivos al servidor..." -ForegroundColor Yellow
if (Test-Path "server/dist") {
    Remove-Item -Recurse -Force "server/dist"
}
Copy-Item -Recurse "dist" "server/dist"
Write-Host "  ✓ Archivos copiados" -ForegroundColor Green
Write-Host ""

# Paso 3: Instalar dependencias del servidor
Write-Host "  [3/4] Preparando servidor..." -ForegroundColor Yellow
Push-Location server
npm install --omit=dev
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "  ✗ Error instalando dependencias" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "  ✓ Servidor preparado" -ForegroundColor Green
Write-Host ""

# Paso 4: Empaquetar con pkg
Write-Host "  [4/4] Generando ejecutable..." -ForegroundColor Yellow

# Crear carpeta release si no existe
if (-not (Test-Path "release")) {
    New-Item -ItemType Directory -Path "release" | Out-Null
}

# Ejecutar pkg
Push-Location server
npx pkg . --output "../release/MermaidExporter.exe" --compress GZip
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "  ✗ Error generando ejecutable" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "  ✓ Ejecutable generado" -ForegroundColor Green
Write-Host ""

# Resultado final
$exePath = Resolve-Path "release/MermaidExporter.exe"
$exeSize = (Get-Item $exePath).Length / 1MB

Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║                    ¡BUILD COMPLETADO!                     ║" -ForegroundColor Green
Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Ejecutable: $exePath" -ForegroundColor White
Write-Host "  Tamaño:     $([math]::Round($exeSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "  Haz doble click en MermaidExporter.exe para iniciar la app." -ForegroundColor Cyan
Write-Host ""
