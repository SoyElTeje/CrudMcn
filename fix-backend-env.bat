@echo off
echo ===========================================
echo CORRECCIÓN DE VARIABLES DE ENTORNO BACKEND
echo ===========================================

echo.
echo 🔧 Creando archivo .env en el backend...

REM Crear archivo .env con la configuración correcta
(
echo # ===========================================
echo # CONFIGURACIÓN DE PRODUCCIÓN - BACKEND
echo # ===========================================
echo.
echo # Base de datos - CONFIGURAR CON CREDENCIALES REALES
echo DB_SERVER=mcn-bidb-svr
echo DB_PORT=1433
echo DB_USER=app_user
echo DB_PASSWORD=Pd6EdwB%%ta
echo DB_DATABASE=APPDATA
echo.
echo # Configuración de prueba ^(opcional^)
echo TRIAL_DB=BI_EDITOR
echo TRIAL_TABLE=TEST_ABM
echo.
echo # Servidor - CONFIGURADO PARA CONEXIONES EXTERNAS
echo PORT=3001
echo NODE_ENV=production
echo HOST=0.0.0.0
echo.
echo # CORS Configuration - PERMITE CUALQUIER ORIGEN
echo CORS_ORIGIN=*
echo.
echo # JWT Configuration - GENERAR SECRET ÚNICO Y FUERTE
echo JWT_SECRET=GENERAR_SECRET_SUPER_SEGURO_Y_LARGO_PARA_PRODUCCION
echo JWT_EXPIRES_IN=24h
echo.
echo # Logging Configuration
echo LOG_LEVEL=info
echo LOG_FILE=../logs/backend-production.log
echo.
echo # Upload Configuration
echo UPLOAD_DIR=../uploads
echo MAX_FILE_SIZE=50MB
echo.
echo # Rate Limiting - Más restrictivo en producción
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=50
echo.
echo # Security
echo HELMET_ENABLED=true
echo TRUST_PROXY=true
echo.
echo # Database Pool Configuration ^(Production^)
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
    echo ✅ Archivo .env creado exitosamente en el backend
) else (
    echo ❌ Error creando archivo .env
    pause
    exit /b 1
)

echo.
echo 📋 Configuración aplicada:
echo    DB_SERVER=mcn-bidb-svr
echo    DB_DATABASE=APPDATA
echo    PORT=3001
echo    HOST=0.0.0.0
echo    CORS_ORIGIN=*

echo.
echo 🚀 Para aplicar los cambios:
echo    1. cd backend
echo    2. node server.js
echo    3. El backend ahora usará la configuración correcta

echo.
echo ✅ Configuración completada
pause
















