@echo off
echo ========================================
echo   INSTALACION ABM MCN EN SERVIDOR
echo ========================================
echo.

REM Verificar si estamos en el directorio correcto
if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio backend
    echo    Asegurate de estar en el directorio raiz del proyecto
    pause
    exit /b 1
)

REM Verificar si PM2 esta instalado
echo [1/6] Verificando PM2...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 no esta instalado. Instalando...
    echo    Esto puede tomar unos minutos...
    npm install -g pm2
    if errorlevel 1 (
        echo ❌ Error al instalar PM2
        echo.
        echo 💡 Soluciones posibles:
        echo 1. Ejecutar como administrador
        echo 2. Verificar conexion a internet
        echo 3. Instalar manualmente: npm install -g pm2
        echo.
        pause
        exit /b 1
    )
    echo ✅ PM2 instalado correctamente
    pm2 --version
) else (
    echo ✅ PM2 ya esta instalado
    pm2 --version
)

REM Verificar si serve esta instalado
echo.
echo [2/6] Verificando serve...
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

REM Instalar dependencias del backend
echo.
echo [3/6] Instalando dependencias del backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias del backend
    pause
    exit /b 1
)
echo ✅ Dependencias del backend instaladas
cd ..

REM Instalar dependencias del frontend
echo.
echo [4/6] Instalando dependencias del frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias del frontend
    pause
    exit /b 1
)
echo ✅ Dependencias del frontend instaladas

REM Construir frontend
echo.
echo [5/6] Construyendo frontend para produccion...
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
echo [6/6] Configurando base de datos y iniciando servicios...
if not exist logs mkdir logs

REM Corregir estructura de base de datos
echo    Corrigiendo estructura de base de datos...
cd backend
node fix_production_database.js
cd ..

REM Detener servicios existentes
pm2 delete all >nul 2>&1

REM Iniciar servicios
echo    Iniciando servicios con PM2...
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
