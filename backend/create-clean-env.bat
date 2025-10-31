@echo off
echo ===========================================
echo CREAR ARCHIVO .ENV LIMPIO
echo ===========================================

echo.
echo 🔧 Creando archivo .env limpio...

REM Crear archivo .env limpio sin comentarios ni espacios
(
echo DB_SERVER=mcn-bidb-svr
echo DB_PORT=1433
echo DB_USER=app_user
echo DB_PASSWORD=Pd6EdwB%%ta
echo DB_DATABASE=APPDATA
echo TRIAL_DB=BI_EDITOR
echo TRIAL_TABLE=TEST_ABM
echo PORT=3001
echo NODE_ENV=production
echo CORS_ORIGIN=*
echo JWT_SECRET=GENERAR_SECRET_SUPER_SEGURO_Y_LARGO_PARA_PRODUCCION
echo JWT_EXPIRES_IN=24h
echo LOG_LEVEL=info
echo LOG_FILE=../logs/backend-production.log
echo UPLOAD_DIR=../uploads
echo MAX_FILE_SIZE=50MB
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=50
echo HELMET_ENABLED=true
echo TRUST_PROXY=true
echo DB_POOL_MAX=20
echo DB_POOL_MIN=5
echo DB_IDLE_TIMEOUT=300000
echo DB_ACQUIRE_TIMEOUT=60000
echo DB_CREATE_TIMEOUT=30000
echo DB_DESTROY_TIMEOUT=5000
echo DB_REAP_INTERVAL=1000
echo DB_CREATE_RETRY_INTERVAL=200
echo DB_REQUEST_TIMEOUT=30000
echo DB_CONNECTION_TIMEOUT=15000
echo DB_ENCRYPT=false
echo DB_TRUST_CERT=true
) > "backend\.env"

if %errorlevel% equ 0 (
    echo ✅ Archivo .env limpio creado exitosamente
) else (
    echo ❌ Error creando archivo .env
    pause
    exit /b 1
)

echo.
echo 📋 Archivo .env creado con variables básicas
echo.
echo 🚀 Ahora reinicia el servidor:
echo    cd backend
echo    node server.js
echo.
echo ✅ Listo
pause
















