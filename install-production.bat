@echo off
echo ========================================
echo    INSTALACION ABM MCN EN PRODUCCION
echo ========================================
echo.

REM Verificar si PM2 esta instalado
echo [1/5] Verificando PM2...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 no esta instalado. Instalando...
    npm install -g pm2
    if errorlevel 1 (
        echo ❌ Error al instalar PM2
        pause
        exit /b 1
    )
    echo ✅ PM2 instalado correctamente
) else (
    echo ✅ PM2 ya esta instalado
)

REM Verificar si serve esta instalado
echo.
echo [2/5] Verificando serve...
serve --version >nul 2>&1
if errorlevel 1 (
    echo ❌ serve no esta instalado. Instalando...
    npm install -g serve
    if errorlevel 1 (
        echo ❌ Error al instalar serve
        pause
        exit /b 1
    )
    echo ✅ serve instalado correctamente
) else (
    echo ✅ serve ya esta instalado
)

REM Construir frontend
echo.
echo [3/5] Construyendo frontend para produccion...
cd frontend
call npm run build
if errorlevel 1 (
    echo ❌ Error al construir el frontend
    pause
    exit /b 1
)
echo ✅ Frontend construido correctamente
cd ..

REM Crear directorio de logs
echo.
echo [4/5] Creando directorio de logs...
if not exist logs mkdir logs
echo ✅ Directorio de logs creado

REM Iniciar servicios
echo.
echo [5/5] Iniciando servicios con PM2...
pm2 delete all >nul 2>&1
pm2 start ecosystem.config.js
if errorlevel 1 (
    echo ❌ Error al iniciar servicios
    pause
    exit /b 1
)

echo.
echo ========================================
echo    INSTALACION COMPLETADA EXITOSAMENTE
echo ========================================
echo.
echo ✅ Backend:  http://localhost:3001
echo ✅ Frontend: http://localhost:5173
echo ✅ Red:      http://172.31.250.6:5173
echo.
echo 📋 Comandos utiles:
echo    pm2 status          - Ver estado de servicios
echo    pm2 logs            - Ver logs en tiempo real
echo    pm2 restart all     - Reiniciar todos los servicios
echo    pm2 stop all        - Detener todos los servicios
echo.
echo 🔄 Los servicios se iniciaran automaticamente al reiniciar el servidor
echo.
pause