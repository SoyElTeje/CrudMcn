@echo off
echo Deteniendo sistema ABM MCN...
echo.

pm2 stop all
pm2 delete all

echo.
echo Sistema detenido correctamente.
echo.
pause
