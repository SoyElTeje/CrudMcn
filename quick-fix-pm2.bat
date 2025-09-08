@echo off
REM ===========================================
REM SOLUCIÓN RÁPIDA PARA PM2 EN WINDOWS
REM ===========================================

echo.
echo 🔧 SOLUCIÓN RÁPIDA PARA PM2
echo ============================
echo.

REM Paso 1: Matar procesos de Node.js
echo [INFO] Deteniendo procesos de Node.js...
taskkill /f /im node.exe >nul 2>&1

REM Paso 2: Matar PM2 daemon
echo [INFO] Deteniendo PM2 daemon...
pm2 kill >nul 2>&1

REM Paso 3: Limpiar directorio PM2
echo [INFO] Limpiando directorio PM2...
if exist "%USERPROFILE%\.pm2" (
    rmdir /s /q "%USERPROFILE%\.pm2" >nul 2>&1
)

REM Paso 4: Reiniciar PM2
echo [INFO] Reiniciando PM2...
pm2 ping >nul 2>&1

echo [SUCCESS] ✅ PM2 reiniciado correctamente

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
