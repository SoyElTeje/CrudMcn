@echo off
echo ========================================
echo      INSTALACION SOLO PM2
echo ========================================
echo.

echo 🔍 Verificando si PM2 esta instalado...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 no esta instalado
    echo.
    echo 🚀 Instalando PM2...
    echo    Esto puede tomar unos minutos...
    echo.
    
    npm install -g pm2
    
    if errorlevel 1 (
        echo.
        echo ❌ Error al instalar PM2
        echo.
        echo 💡 Posibles soluciones:
        echo 1. Ejecutar como administrador (clic derecho - Ejecutar como administrador)
        echo 2. Verificar conexion a internet
        echo 3. Verificar que Node.js este instalado: node --version
        echo 4. Verificar que npm este instalado: npm --version
        echo.
        echo 🔧 Comando manual: npm install -g pm2
    ) else (
        echo.
        echo ✅ PM2 instalado correctamente
        echo.
        echo 📋 Verificando instalacion...
        pm2 --version
        echo.
        echo 🎉 PM2 listo para usar
    )
) else (
    echo ✅ PM2 ya esta instalado
    pm2 --version
)

echo.
echo 📋 Comandos utiles de PM2:
echo    pm2 --version     - Ver version
echo    pm2 list          - Ver procesos
echo    pm2 start app.js  - Iniciar aplicacion
echo    pm2 stop all      - Detener todos
echo    pm2 delete all    - Eliminar todos
echo.
pause
