@echo off
echo ========================================
echo      MONITOR ABM MCN PRODUCCION
echo ========================================
echo.

:menu
echo Selecciona una opcion:
echo.
echo 1. Ver estado de servicios
echo 2. Ver logs en tiempo real
echo 3. Reiniciar todos los servicios
echo 4. Detener todos los servicios
echo 5. Ver uso de memoria
echo 6. Verificar conectividad
echo 7. Salir
echo.
set /p choice="Ingresa tu opcion (1-7): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto memory
if "%choice%"=="6" goto connectivity
if "%choice%"=="7" goto exit
goto menu

:status
echo.
echo === ESTADO DE SERVICIOS ===
pm2 status
echo.
pause
goto menu

:logs
echo.
echo === LOGS EN TIEMPO REAL ===
echo Presiona Ctrl+C para salir
pm2 logs
goto menu

:restart
echo.
echo === REINICIANDO SERVICIOS ===
pm2 restart all
echo ✅ Servicios reiniciados
echo.
pause
goto menu

:stop
echo.
echo === DETENIENDO SERVICIOS ===
pm2 stop all
echo ✅ Servicios detenidos
echo.
pause
goto menu

:memory
echo.
echo === USO DE MEMORIA ===
pm2 monit
goto menu

:connectivity
echo.
echo === VERIFICANDO CONECTIVIDAD ===
echo.
echo Probando backend...
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend no responde
) else (
    echo ✅ Backend funcionando
)

echo.
echo Probando frontend...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend no responde
) else (
    echo ✅ Frontend funcionando
)

echo.
echo Probando base de datos...
cd backend
node test_db_connection.js
cd ..
echo.
pause
goto menu

:exit
echo.
echo Saliendo del monitor...
exit /b 0
