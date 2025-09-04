@echo off
echo ========================================
echo Desinstalacion de ABM McN
echo ========================================

echo.
echo 1. Deteniendo aplicaciones PM2...
call pm2 stop all
call pm2 delete all

echo.
echo 2. Desinstalando PM2 del inicio de Windows...
call pm2 unstartup

echo.
echo 3. Desinstalando PM2 globalmente...
call npm uninstall -g pm2

echo.
echo 4. Eliminando directorio de logs...
if exist logs rmdir /s /q logs

echo.
echo ========================================
echo Desinstalacion completada!
echo ========================================
echo.
echo La aplicacion ha sido completamente removida del sistema.
echo.
pause




