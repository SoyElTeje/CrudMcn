@echo off
echo ========================================
echo Actualizacion de ABM McN en Produccion
echo ========================================

echo.
echo 1. Deteniendo aplicaciones...
call pm2 stop all

echo.
echo 2. Actualizando codigo desde Git...
git pull

echo.
echo 3. Instalando dependencias del backend...
cd backend
call npm install --production
cd ..

echo.
echo 4. Instalando dependencias del frontend...
cd frontend
call npm install --production
cd ..

echo.
echo 5. Construyendo el frontend...
cd frontend
call npm run build
cd ..

echo.
echo 6. Reiniciando aplicaciones...
call pm2 start ecosystem.config.js

echo.
echo 7. Guardando configuracion de PM2...
call pm2 save

echo.
echo ========================================
echo Actualizacion completada!
echo ========================================
echo.
echo Las aplicaciones han sido actualizadas y reiniciadas.
echo.
pause




