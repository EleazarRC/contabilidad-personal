@echo off
echo ========================================
echo  Iniciando Aplicacion de Contabilidad
echo ========================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si las dependencias estan instaladas
if not exist "backend\node_modules" (
    echo Instalando dependencias del backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Instalando dependencias del frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Iniciando servidores...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener los servidores
echo.

REM Iniciar backend en una nueva ventana
start "Backend Server" cmd /k "cd backend && npm start"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM Iniciar frontend en una nueva ventana
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Servidores iniciados!
echo Abre tu navegador en http://localhost:3000
echo.
pause
