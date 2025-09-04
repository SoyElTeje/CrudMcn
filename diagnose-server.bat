@echo off
echo ========================================
echo      DIAGNOSTICO SERVIDOR ABM MCN
echo ========================================
echo.

echo 🔍 Informacion del sistema:
echo.
echo 📁 Directorio actual: %CD%
echo 📋 Contenido del directorio:
dir /b
echo.

echo 🔍 Verificando estructura del proyecto:
echo.
if exist "backend" (
    echo ✅ Directorio backend encontrado
    echo    Contenido de backend:
    dir /b backend
    echo.
) else (
    echo ❌ Directorio backend NO encontrado
)

if exist "frontend" (
    echo ✅ Directorio frontend encontrado
    echo    Contenido de frontend:
    dir /b frontend
    echo.
) else (
    echo ❌ Directorio frontend NO encontrado
)

if exist "ecosystem.config.js" (
    echo ✅ Archivo ecosystem.config.js encontrado
) else (
    echo ❌ Archivo ecosystem.config.js NO encontrado
)

echo.
echo 🔍 Verificando herramientas necesarias:
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NO esta instalado
) else (
    echo ✅ Node.js esta instalado
    node --version
)

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm NO esta instalado
) else (
    echo ✅ npm esta instalado
    npm --version
)

REM Verificar PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 NO esta instalado
) else (
    echo ✅ PM2 esta instalado
    pm2 --version
)

REM Verificar serve
serve --version >nul 2>&1
if errorlevel 1 (
    echo ❌ serve NO esta instalado
) else (
    echo ✅ serve esta instalado
    serve --version
)

echo.
echo 🔍 Verificando permisos:
echo.
echo 📁 Permisos del directorio actual:
icacls . | findstr "Everyone\|Users\|Administrators"

echo.
echo ========================================
echo      DIAGNOSTICO COMPLETADO
echo ========================================
echo.
echo 💡 Si hay errores, verifica:
echo 1. Que estes en el directorio correcto del proyecto
echo 2. Que el proyecto se haya descomprimido completamente
echo 3. Que tengas permisos de administrador
echo 4. Que Node.js y npm esten instalados
echo.
pause
