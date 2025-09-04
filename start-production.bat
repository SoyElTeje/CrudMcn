@echo off
echo Iniciando sistema ABM MCN en modo produccion...
echo.

REM Verificar si PM2 esta instalado
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo Error: PM2 no esta instalado. Instalando...
    npm install -g pm2
)

REM Verificar si serve esta instalado
serve --version >nul 2>&1
if errorlevel 1 (
    echo Error: serve no esta instalado. Instalando...
    npm install -g serve
)

echo Construyendo frontend para produccion...
cd frontend
call npm run build
if errorlevel 1 (
    echo Error: Fallo al construir el frontend
    pause
    exit /b 1
)

cd ..

echo Iniciando servicios con PM2...
pm2 delete all >nul 2>&1
pm2 start ecosystem.config.js

echo.
echo ========================================
echo Sistema ABM MCN iniciado en produccion
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Para ver el estado: pm2 status
echo Para ver logs: pm2 logs
echo Para detener: pm2 stop all
echo Para reiniciar: pm2 restart all
echo.
pause