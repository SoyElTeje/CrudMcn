@echo off
echo ========================================
echo    Verificacion de Estado de Red
echo ========================================
echo.

echo 1. Obteniendo IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    echo    IP Local: !IP!
    goto :found_ip
)
:found_ip

echo.
echo 2. Verificando puertos activos...
echo    Puerto 3001 (Backend):
netstat -an | findstr ":3001" >nul && echo    ✅ Puerto 3001 activo || echo    ❌ Puerto 3001 inactivo

echo    Puerto 5173 (Frontend):
netstat -an | findstr ":5173" >nul && echo    ✅ Puerto 5173 activo || echo    ❌ Puerto 5173 inactivo

echo    Puerto 1433 (SQL Server):
netstat -an | findstr ":1433" >nul && echo    ✅ Puerto 1433 activo || echo    ❌ Puerto 1433 inactivo

echo.
echo 3. URLs de acceso:
echo    Frontend local:  http://localhost:5173
echo    Frontend red:    http://!IP!:5173
echo    Backend local:   http://localhost:3001
echo    Backend red:     http://!IP!:3001
echo    Health Check:    http://localhost:3001/api/health

echo.
echo 4. Comandos de prueba:
echo    curl http://localhost:3001/api/health
echo    curl http://!IP!:3001/api/health

echo.
pause
