@echo off
echo ===========================================
echo CONFIGURACIÓN DE FRONTEND PARA PRODUCCIÓN
echo ===========================================

echo.
echo 🔧 Configurando variables de entorno del frontend...

REM Copiar archivo de configuración de producción
copy "frontend\env.production" "frontend\.env" >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Archivo .env configurado para producción
) else (
    echo ❌ Error copiando archivo de configuración
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
echo    2. npm run build
echo    3. El frontend usará la IP del servidor

echo.
echo ✅ Configuración completada
pause
















