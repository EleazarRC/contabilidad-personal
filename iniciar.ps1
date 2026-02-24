# Script de inicio para PowerShell

Write-Host "========================================"
Write-Host " Iniciando Aplicación de Contabilidad"
Write-Host "========================================"
Write-Host ""

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Node.js desde https://nodejs.org/"
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar dependencias del backend
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Verificar dependencias del frontend
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "Iniciando servidores..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Presiona Ctrl+C para detener los servidores"
Write-Host ""

# Iniciar backend en nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start"

# Esperar 3 segundos
Start-Sleep -Seconds 3

# Iniciar frontend en nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "Servidores iniciados!" -ForegroundColor Green
Write-Host "Abre tu navegador en http://localhost:3000"
Write-Host ""

Read-Host "Presiona Enter para salir de este script"
