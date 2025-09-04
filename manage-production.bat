@echo off
echo ========================================
echo Gestion de ABM McN en Produccion
echo ========================================

:menu
echo.
echo Selecciona una opcion:
echo 1. Ver estado de las aplicaciones
echo 2. Ver logs en tiempo real
echo 3. Reiniciar todas las aplicaciones
echo 4. Reiniciar solo backend
echo 5. Reiniciar solo frontend
echo 6. Ver uso de memoria
echo 7. Ver logs de errores
echo 8. Salir
echo.
set /p choice="Ingresa tu opcion (1-8): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart_all
if "%choice%"=="4" goto restart_backend
if "%choice%"=="5" goto restart_frontend
if "%choice%"=="6" goto memory
if "%choice%"=="7" goto error_logs
if "%choice%"=="8" goto exit
goto menu

:status
echo.
echo Estado de las aplicaciones:
call pm2 status
echo.
pause
goto menu

:logs
echo.
echo Mostrando logs en tiempo real (Ctrl+C para salir):
call pm2 logs
goto menu

:restart_all
echo.
echo Reiniciando todas las aplicaciones...
call pm2 restart all
echo Reinicio completado.
pause
goto menu

:restart_backend
echo.
echo Reiniciando solo el backend...
call pm2 restart abmmcn-backend
echo Reinicio completado.
pause
goto menu

:restart_frontend
echo.
echo Reiniciando solo el frontend...
call pm2 restart abmmcn-frontend
echo Reinicio completado.
pause
goto menu

:memory
echo.
echo Uso de memoria:
call pm2 monit
goto menu

:error_logs
echo.
echo Logs de errores del backend:
if exist logs\backend-error.log (
    type logs\backend-error.log
) else (
    echo No hay logs de errores del backend.
)
echo.
echo Logs de errores del frontend:
if exist logs\frontend-error.log (
    type logs\frontend-error.log
) else (
    echo No hay logs de errores del frontend.
)
echo.
pause
goto menu

:exit
echo.
echo Saliendo...
exit




