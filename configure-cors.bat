@echo off
echo ========================================
echo      CONFIGURACION CORS
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

echo Selecciona la configuracion CORS:
echo.
echo 1. Permitir todos los origenes (*) - MAS FACIL
echo 2. Solo localhost - SOLO DESARROLLO
echo 3. Red local especifica - MAS SEGURO
echo 4. Ver configuracion actual
echo 5. Salir
echo.
set /p choice="Ingresa tu opcion (1-5): "

if "%choice%"=="1" goto allow_all
if "%choice%"=="2" goto localhost_only
if "%choice%"=="3" goto specific_network
if "%choice%"=="4" goto show_current
if "%choice%"=="5" goto exit
goto configure-cors

:allow_all
echo.
echo 🔧 Configurando: Permitir todos los origenes
echo.
call :update_cors "*"
goto restart_services

:localhost_only
echo.
echo 🔧 Configurando: Solo localhost
echo.
call :update_cors "http://localhost:5173"
goto restart_services

:specific_network
echo.
echo 🔧 Configurando: Red local especifica
echo.
set "cors_value=http://localhost:5173,http://%server_ip%:5173,http://%server_ip%:3001"
call :update_cors "%cors_value%"
goto restart_services

:show_current
echo.
echo 📋 Configuracion actual:
echo.
if exist "backend\.env" (
    type backend\.env | findstr CORS_ORIGIN
) else (
    echo ❌ Archivo backend\.env no encontrado
)
echo.
pause
goto configure-cors

:update_cors
set "new_cors=%~1"
echo Actualizando CORS_ORIGIN a: %new_cors%
echo.

if not exist "backend\.env" (
    echo ❌ Archivo backend\.env no encontrado
    pause
    goto configure-cors
)

REM Crear backup
copy "backend\.env" "backend\.env.backup" >nul 2>&1
echo ✅ Backup creado

REM Actualizar archivo
powershell -Command "(Get-Content 'backend\.env') -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=%new_cors%' | Set-Content 'backend\.env'"
echo ✅ Archivo .env actualizado
goto :eof

:restart_services
echo.
echo 🔄 Reiniciando servicios...
pm2 restart abmmcn-backend
if errorlevel 1 (
    echo ❌ Error al reiniciar el backend
) else (
    echo ✅ Backend reiniciado correctamente
)

echo.
echo ========================================
echo      CONFIGURACION APLICADA
echo ========================================
echo.
echo 🌐 Configuracion CORS: %new_cors%
echo.
echo 📋 Para verificar:
echo    pm2 status
echo    pm2 logs abmmcn-backend
echo.
pause
goto configure-cors

:exit
echo.
echo Saliendo...
exit /b 0
