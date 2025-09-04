@echo off
echo ========================================
echo      BUSCADOR DE PROYECTO ABM MCN
echo ========================================
echo.

echo 🔍 Buscando directorio del proyecto...
echo.

REM Buscar en el directorio actual
if exist "backend" if exist "frontend" if exist "ecosystem.config.js" (
    echo ✅ Proyecto encontrado en: %CD%
    echo.
    echo 📋 Contenido del directorio:
    dir /b
    echo.
    echo 🚀 Ejecutando instalacion...
    call install-server-production.bat
    goto :end
)

REM Buscar en subdirectorios
for /d %%i in (*) do (
    if exist "%%i\backend" if exist "%%i\frontend" if exist "%%i\ecosystem.config.js" (
        echo ✅ Proyecto encontrado en: %CD%\%%i
        echo.
        echo 📋 Contenido del directorio:
        dir /b "%%i"
        echo.
        echo 🚀 Cambiando al directorio del proyecto...
        cd "%%i"
        echo 📁 Nuevo directorio: %CD%
        echo.
        echo 🚀 Ejecutando instalacion...
        call install-server-production.bat
        goto :end
    )
)

REM Buscar en directorios padre
set "current=%CD%"
:parent
cd ..
if "%CD%"=="%current%" goto :notfound
if exist "backend" if exist "frontend" if exist "ecosystem.config.js" (
    echo ✅ Proyecto encontrado en: %CD%
    echo.
    echo 📋 Contenido del directorio:
    dir /b
    echo.
    echo 🚀 Ejecutando instalacion...
    call install-server-production.bat
    goto :end
)
goto :parent

:notfound
echo ❌ No se pudo encontrar el proyecto ABM MCN
echo.
echo 💡 Busca manualmente el directorio que contenga:
echo    - backend/
echo    - frontend/
echo    - ecosystem.config.js
echo.
echo 📁 Directorio actual: %CD%
echo 📋 Contenido actual:
dir /b
echo.

:end
pause
