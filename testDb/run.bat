@echo off
echo ========================================
echo    Test de Conexion a Base de Datos
echo ========================================
echo.

if not exist .env (
    echo ERROR: Archivo .env no encontrado
    echo.
    echo Ejecuta primero: install.bat
    echo.
    pause
    exit /b 1
)

echo Ejecutando test de conexion...
echo.
npm start
