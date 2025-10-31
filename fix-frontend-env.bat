@echo off
echo ===========================================
echo CORRECCIÓN DE VARIABLES DE ENTORNO FRONTEND
echo ===========================================

echo.
echo 🔧 Creando archivo .env en el frontend...

REM Crear archivo .env con la IP correcta
(
echo # ===========================================
echo # CONFIGURACIÓN DE PRODUCCIÓN - FRONTEND
echo # ===========================================
echo.
echo # API Configuration - IP DEL SERVIDOR
echo VITE_CURRENT_IP=http://192.168.168.209:3001
echo VITE_API_BASE_URL=http://192.168.168.209:3001
echo.
echo # Environment
echo VITE_NODE_ENV=production
echo.
echo # App Configuration
echo VITE_APP_NAME=AbmMcn
echo VITE_APP_VERSION=1.0.0
echo.
echo # Production Features
echo VITE_DEBUG_MODE=false
echo VITE_LOG_LEVEL=info
echo.
echo # API Timeouts
echo VITE_API_TIMEOUT=30000
echo VITE_UPLOAD_TIMEOUT=300000
echo.
echo # Feature Flags
echo VITE_ENABLE_DEV_TOOLS=false
echo VITE_ENABLE_MOCK_DATA=false
) > "frontend\.env"

if %errorlevel% equ 0 (
    echo ✅ Archivo .env creado exitosamente
) else (
    echo ❌ Error creando archivo .env
    pause
    exit /b 1
)

echo.
echo 📋 Configuración aplicada:
echo    VITE_CURRENT_IP=http://192.168.168.209:3001
echo    VITE_API_BASE_URL=http://192.168.168.209:3001
echo    VITE_NODE_ENV=production

echo.
echo 🚀 Para aplicar los cambios:
echo    1. cd frontend
echo    2. npm run dev
echo    3. El frontend ahora usará la IP del servidor

echo.
echo ✅ Configuración completada
pause
















