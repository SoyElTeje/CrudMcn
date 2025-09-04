@echo off
echo ========================================
echo      CORRECCION CORS PARA SERVIDOR
echo ========================================
echo.

echo 🔍 Detectando IP del servidor...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set "server_ip=%%b"
        goto :found_ip
    )
)
:found_ip

echo 📡 IP del servidor: %server_ip%
echo.

echo 🔧 Actualizando configuracion CORS...
echo.

REM Detener servicios actuales
echo [1/4] Deteniendo servicios actuales...
pm2 stop all >nul 2>&1

REM Actualizar archivo .env del backend
echo [2/4] Actualizando archivo .env del backend...
if exist "backend\.env" (
    echo Actualizando CORS_ORIGIN en backend\.env...
    powershell -Command "(Get-Content 'backend\.env') -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=*' | Set-Content 'backend\.env'"
    echo ✅ Archivo .env actualizado
) else (
    echo ⚠️  Archivo backend\.env no encontrado
)

REM Actualizar ecosystem.config.js
echo [3/4] Actualizando ecosystem.config.js...
if exist "ecosystem.config.js" (
    powershell -Command "(Get-Content 'ecosystem.config.js') -replace 'CORS_ORIGIN: \".*\"', 'CORS_ORIGIN: \"*\"' | Set-Content 'ecosystem.config.js'"
    echo ✅ ecosystem.config.js actualizado
) else (
    echo ⚠️  Archivo ecosystem.config.js no encontrado
)

REM Reiniciar servicios
echo [4/4] Reiniciando servicios...
pm2 start ecosystem.config.js
if errorlevel 1 (
    echo ❌ Error al reiniciar servicios
) else (
    echo ✅ Servicios reiniciados correctamente
)

echo.
echo ========================================
echo      CORS CORREGIDO EXITOSAMENTE
echo ========================================
echo.
echo 🌐 Acceso desde red local:
echo    Frontend: http://%server_ip%:5173
echo    Backend:  http://%server_ip%:3001
echo.
echo 🔧 Configuracion CORS: Permitir todos los origenes (*)
echo.
echo 📋 Para verificar:
echo    pm2 status
echo    pm2 logs
echo.
pause
