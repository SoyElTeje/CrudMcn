@echo off
echo ========================================
echo    Verificacion de Produccion
echo ========================================
echo.

echo 1. Obteniendo IP del servidor...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    echo    IP del servidor: !IP!
    goto :found_ip
)
:found_ip

echo.
echo 2. Verificando puertos activos...
echo    Puerto 3001 (Backend):
netstat -an | findstr ":3001" >nul && echo    ✅ Puerto 3001 activo || echo    ❌ Puerto 3001 inactivo

echo    Puerto 4173 (Frontend):
netstat -an | findstr ":4173" >nul && echo    ✅ Puerto 4173 activo || echo    ❌ Puerto 4173 inactivo

echo    Puerto 1433 (SQL Server):
netstat -an | findstr ":1433" >nul && echo    ✅ Puerto 1433 activo || echo    ❌ Puerto 1433 inactivo

echo.
echo 3. Verificando servicios...
echo    Backend Health Check:
curl -s http://localhost:3001/api/health >nul && echo    ✅ Backend respondiendo || echo    ❌ Backend no responde

echo    Frontend:
curl -s -I http://localhost:4173 >nul && echo    ✅ Frontend respondiendo || echo    ❌ Frontend no responde

echo.
echo 4. URLs de acceso:
echo    Frontend local:  http://localhost:4173
echo    Frontend red:    http://!IP!:4173
echo    Backend local:   http://localhost:3001
echo    Backend red:     http://!IP!:3001
echo    Health Check:    http://localhost:3001/api/health

echo.
echo 5. Comandos de prueba:
echo    curl http://localhost:3001/api/health
echo    curl http://!IP!:3001/api/health

echo.
echo 6. Verificacion de base de datos...
if exist testDb\test_db.js (
    echo    Ejecutando test de base de datos...
    cd testDb
    node test_db.js
    cd ..
) else (
    echo    ⚠️  Script de test de base de datos no encontrado
)

echo.
pause
