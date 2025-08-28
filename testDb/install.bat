@echo off
echo ========================================
echo    Instalacion del Test de Base de Datos
echo ========================================
echo.

echo 1. Instalando dependencias...
npm install

echo.
echo 2. Configurando archivo de variables de entorno...
if not exist .env (
    copy env.example .env
    echo    Archivo .env creado desde env.example
) else (
    echo    Archivo .env ya existe
)

echo.
echo 3. Instalacion completada!
echo.
echo Para ejecutar el test:
echo    npm start
echo.
echo Para editar la configuracion:
echo    notepad .env
echo.
pause
