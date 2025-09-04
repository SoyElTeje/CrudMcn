@echo off
echo ========================================
echo    INICIANDO APLICACION ABM EN PRODUCCION
echo ========================================
echo.

echo Verificando que Node.js esté instalado...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Verificando que las dependencias estén instaladas...
if not exist "backend\node_modules" (
    echo Instalando dependencias del backend...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Instalando dependencias del frontend...
    cd frontend
    npm install
    cd ..
)

echo.
echo Iniciando backend en puerto 3001...
start "Backend ABM" cmd /k "cd backend && npm start"

echo Esperando 5 segundos para que el backend inicie...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando frontend en puerto 5173...
start "Frontend ABM" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    APLICACION INICIADA EXITOSAMENTE
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Usuario: admin
echo Contraseña: admin
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul





