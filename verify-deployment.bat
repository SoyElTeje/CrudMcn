@echo off
REM ===========================================
REM SCRIPT DE VERIFICACIÓN POST-DESPLIEGUE
REM Para Windows Server
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🔍 VERIFICACIÓN POST-DESPLIEGUE - AbmMcn
echo ========================================
echo.

REM Verificar estado de PM2
echo [INFO] 🔍 Verificando estado de PM2...

pm2 list | findstr "abmmcn-backend" | findstr "online" >nul
if errorlevel 1 (
    echo [ERROR] Backend no está corriendo
    pause
    exit /b 1
)

pm2 list | findstr "abmmcn-frontend" | findstr "online" >nul
if errorlevel 1 (
    echo [ERROR] Frontend no está corriendo
    pause
    exit /b 1
)

echo [SUCCESS] ✅ PM2: Aplicaciones corriendo

REM Verificar puertos
echo [INFO] 🔍 Verificando puertos...

netstat -an | findstr ":3001" >nul
if errorlevel 1 (
    echo [ERROR] Puerto 3001 (backend) no está abierto
    pause
    exit /b 1
)

netstat -an | findstr ":5173" >nul
if errorlevel 1 (
    echo [ERROR] Puerto 5173 (frontend) no está abierto
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Puertos: 3001 y 5173 abiertos

REM Verificar endpoints del backend
echo [INFO] 🔍 Verificando endpoints del backend...

REM Health check
curl -s -o nul -w "%%{http_code}" http://localhost:3001/health > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "!response!"=="200" (
    echo [SUCCESS] ✅ Health Check: HTTP !response!
) else (
    echo [ERROR] ❌ Health Check: Esperado HTTP 200, recibido HTTP !response!
    pause
    exit /b 1
)

REM API status
curl -s -o nul -w "%%{http_code}" http://localhost:3001/api/status > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "!response!"=="200" (
    echo [SUCCESS] ✅ API Status: HTTP !response!
) else (
    echo [ERROR] ❌ API Status: Esperado HTTP 200, recibido HTTP !response!
    pause
    exit /b 1
)

REM Verificar endpoints del frontend
echo [INFO] 🔍 Verificando endpoints del frontend...

REM Frontend principal
curl -s -o nul -w "%%{http_code}" http://localhost:5173 > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "!response!"=="200" (
    echo [SUCCESS] ✅ Frontend Principal: HTTP !response!
) else (
    echo [ERROR] ❌ Frontend Principal: Esperado HTTP 200, recibido HTTP !response!
    pause
    exit /b 1
)

REM Verificar base de datos
echo [INFO] 🔍 Verificando conexión a base de datos...

cd backend
node -e "const { getPool } = require('./db'); require('dotenv').config(); async function testDB() { try { const pool = await getPool(); const result = await pool.request().query('SELECT 1 as test'); if (result.recordset[0].test === 1) { console.log('✅ Base de datos: Conexión exitosa'); process.exit(0); } else { console.log('❌ Base de datos: Respuesta inesperada'); process.exit(1); } } catch (error) { console.log('❌ Base de datos: Error de conexión'); process.exit(1); } } testDB();"
if errorlevel 1 (
    echo [ERROR] Base de datos: Error de conexión
    cd ..
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] ✅ Base de datos: Conexión verificada

REM Verificar archivos de log
echo [INFO] 🔍 Verificando archivos de log...

if not exist "logs" (
    echo [WARNING] Directorio logs no existe
) else (
    if exist "logs\backend-combined.log" (
        echo [SUCCESS] ✅ Log backend existe
    ) else (
        echo [WARNING] Log backend no encontrado
    )
    
    if exist "logs\frontend-combined.log" (
        echo [SUCCESS] ✅ Log frontend existe
    ) else (
        echo [WARNING] Log frontend no encontrado
    )
)

REM Verificar directorio de uploads
echo [INFO] 🔍 Verificando directorio de uploads...

if not exist "uploads" (
    echo [WARNING] Directorio uploads no existe
) else (
    echo [SUCCESS] ✅ Directorio uploads existe
)

REM Verificar memoria y CPU
echo [INFO] 🔍 Verificando recursos del sistema...

REM Mostrar uso de memoria de PM2
pm2 list

REM Verificar espacio en disco
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set free_space=%%a
echo [INFO] Espacio libre en disco: !free_space! bytes

REM Resumen final
echo.
echo 🎉 VERIFICACIÓN COMPLETADA
echo ==========================
echo.
echo 📊 Estado de las aplicaciones:
pm2 list
echo.
echo 🌐 URLs de acceso:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo 📋 Comandos útiles:
echo    Ver logs:           pm2 logs
echo    Ver estado:         pm2 status
echo    Monitoreo:          pm2 monit
echo    Reiniciar:          pm2 restart all
echo.

echo [SUCCESS] 🎉 ¡Verificación completada exitosamente!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
