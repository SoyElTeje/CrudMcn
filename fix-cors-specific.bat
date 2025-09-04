@echo off
echo ========================================
echo   CORRECCION CORS ESPECIFICO
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

echo 🔧 Configuracion CORS especifica:
echo    - http://localhost:5173
echo    - http://%server_ip%:5173
echo    - http://%server_ip%:3001
echo.

REM Detener servicios actuales
echo [1/4] Deteniendo servicios actuales...
pm2 stop all >nul 2>&1

REM Crear archivo de configuracion CORS
echo [2/4] Creando configuracion CORS especifica...
echo CORS_ORIGIN=http://localhost:5173,http://%server_ip%:5173,http://%server_ip%:3001 > cors_config.txt

REM Actualizar archivo .env del backend
echo [3/4] Actualizando archivo .env del backend...
if exist "backend\.env" (
    echo Actualizando CORS_ORIGIN en backend\.env...
    powershell -Command "(Get-Content 'backend\.env') -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=http://localhost:5173,http://%server_ip%:5173,http://%server_ip%:3001' | Set-Content 'backend\.env'"
    echo ✅ Archivo .env actualizado
) else (
    echo ⚠️  Archivo backend\.env no encontrado
)

REM Actualizar ecosystem.config.js
echo [4/4] Actualizando ecosystem.config.js...
if exist "ecosystem.config.js" (
    powershell -Command "(Get-Content 'ecosystem.config.js') -replace 'CORS_ORIGIN: \".*\"', 'CORS_ORIGIN: \"http://localhost:5173,http://%server_ip%:5173,http://%server_ip%:3001\"' | Set-Content 'ecosystem.config.js'"
    echo ✅ ecosystem.config.js actualizado
) else (
    echo ⚠️  Archivo ecosystem.config.js no encontrado
)

REM Reiniciar servicios
echo [5/5] Reiniciando servicios...
pm2 start ecosystem.config.js
if errorlevel 1 (
    echo ❌ Error al reiniciar servicios
) else (
    echo ✅ Servicios reiniciados correctamente
)

echo.
echo ========================================
echo      CORS ESPECIFICO CONFIGURADO
echo ========================================
echo.
echo 🌐 Acceso permitido desde:
echo    - http://localhost:5173
echo    - http://%server_ip%:5173
echo    - http://%server_ip%:3001
echo.
echo 📋 Para verificar:
echo    pm2 status
echo    pm2 logs
echo.
pause
