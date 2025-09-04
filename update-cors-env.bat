@echo off
echo ========================================
echo      ACTUALIZAR CORS EN .ENV
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

echo 🔧 Actualizando archivo .env del backend...
echo.

if not exist "backend\.env" (
    echo ❌ Archivo backend\.env no encontrado
    echo    Asegurate de estar en el directorio correcto del proyecto
    pause
    exit /b 1
)

echo 📋 Contenido actual del archivo .env:
echo.
type backend\.env | findstr CORS_ORIGIN
echo.

echo 🔄 Actualizando CORS_ORIGIN...
echo.

REM Crear backup del archivo original
copy "backend\.env" "backend\.env.backup" >nul 2>&1
echo ✅ Backup creado: backend\.env.backup

REM Actualizar CORS_ORIGIN
powershell -Command "(Get-Content 'backend\.env') -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=*' | Set-Content 'backend\.env'"

echo ✅ Archivo .env actualizado
echo.

echo 📋 Nuevo contenido:
type backend\.env | findstr CORS_ORIGIN
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
echo      CORS ACTUALIZADO EXITOSAMENTE
echo ========================================
echo.
echo 🌐 Ahora puedes acceder desde:
echo    - http://localhost:5173
echo    - http://%server_ip%:5173
echo    - http://%server_ip%:3001
echo    - Cualquier IP de la red local
echo.
echo 📋 Para verificar:
echo    pm2 status
echo    pm2 logs abmmcn-backend
echo.
echo 💡 Si necesitas revertir:
echo    copy backend\.env.backup backend\.env
echo.
pause
