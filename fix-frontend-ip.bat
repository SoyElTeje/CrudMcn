@echo off
echo ===========================================
echo CORRECCIÓN RÁPIDA DE IP DEL FRONTEND
echo ===========================================

echo.
echo 🔧 Cambiando configuración del frontend...

REM Crear archivo .env con la IP correcta
echo VITE_CURRENT_IP=http://192.168.168.209:3001 > "frontend\.env"
echo VITE_API_BASE_URL=http://192.168.168.209:3001 >> "frontend\.env"
echo VITE_NODE_ENV=production >> "frontend\.env"

echo ✅ Archivo .env creado con IP del servidor
echo.
echo 📋 Configuración:
echo    Frontend: http://192.168.168.209:5173
echo    Backend:  http://192.168.168.209:3001
echo.
echo 🚀 Ahora reinicia el frontend:
echo    cd frontend
echo    npm run dev
echo.
echo ✅ Listo para usar
pause
















