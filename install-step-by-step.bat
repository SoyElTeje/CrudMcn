@echo off
echo ========================================
echo   INSTALACION PASO A PASO ABM MCN
echo ========================================
echo.

:menu
echo Selecciona el paso a ejecutar:
echo.
echo 1. Instalar PM2
echo 2. Instalar serve
echo 3. Instalar dependencias backend
echo 4. Instalar dependencias frontend
echo 5. Construir frontend
echo 6. Corregir base de datos
echo 7. Iniciar servicios
echo 8. Verificar estado
echo 9. Ejecutar todos los pasos
echo 0. Salir
echo.
set /p choice="Ingresa tu opcion (0-9): "

if "%choice%"=="1" goto install_pm2
if "%choice%"=="2" goto install_serve
if "%choice%"=="3" goto install_backend
if "%choice%"=="4" goto install_frontend
if "%choice%"=="5" goto build_frontend
if "%choice%"=="6" goto fix_database
if "%choice%"=="7" goto start_services
if "%choice%"=="8" goto check_status
if "%choice%"=="9" goto install_all
if "%choice%"=="0" goto exit
goto menu

:install_pm2
echo.
echo === INSTALANDO PM2 ===
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo Instalando PM2...
    npm install -g pm2
    if errorlevel 1 (
        echo ❌ Error al instalar PM2
        echo 💡 Ejecuta como administrador
    ) else (
        echo ✅ PM2 instalado correctamente
    )
) else (
    echo ✅ PM2 ya esta instalado
)
echo.
pause
goto menu

:install_serve
echo.
echo === INSTALANDO SERVE ===
serve --version >nul 2>&1
if errorlevel 1 (
    echo Instalando serve...
    npm install -g serve
    if errorlevel 1 (
        echo ❌ Error al instalar serve
        echo 💡 Ejecuta como administrador
    ) else (
        echo ✅ serve instalado correctamente
    )
) else (
    echo ✅ serve ya esta instalado
)
echo.
pause
goto menu

:install_backend
echo.
echo === INSTALANDO DEPENDENCIAS BACKEND ===
if not exist "backend" (
    echo ❌ Directorio backend no encontrado
    pause
    goto menu
)
cd backend
echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias del backend
) else (
    echo ✅ Dependencias del backend instaladas
)
cd ..
echo.
pause
goto menu

:install_frontend
echo.
echo === INSTALANDO DEPENDENCIAS FRONTEND ===
if not exist "frontend" (
    echo ❌ Directorio frontend no encontrado
    pause
    goto menu
)
cd frontend
echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias del frontend
) else (
    echo ✅ Dependencias del frontend instaladas
)
cd ..
echo.
pause
goto menu

:build_frontend
echo.
echo === CONSTRUYENDO FRONTEND ===
if not exist "frontend" (
    echo ❌ Directorio frontend no encontrado
    pause
    goto menu
)
cd frontend
echo Construyendo frontend para produccion...
call npm run build
if errorlevel 1 (
    echo ❌ Error al construir el frontend
) else (
    echo ✅ Frontend construido correctamente
)
cd ..
echo.
pause
goto menu

:fix_database
echo.
echo === CORRIGIENDO BASE DE DATOS ===
if not exist "backend" (
    echo ❌ Directorio backend no encontrado
    pause
    goto menu
)
cd backend
echo Corrigiendo estructura de base de datos...
node fix_production_database.js
cd ..
echo.
pause
goto menu

:start_services
echo.
echo === INICIANDO SERVICIOS ===
echo Deteniendo servicios existentes...
pm2 delete all >nul 2>&1
echo Iniciando servicios con PM2...
pm2 start ecosystem.config.js
if errorlevel 1 (
    echo ❌ Error al iniciar servicios
) else (
    echo ✅ Servicios iniciados correctamente
)
echo.
pause
goto menu

:check_status
echo.
echo === ESTADO DE SERVICIOS ===
pm2 status
echo.
echo === VERIFICANDO CONECTIVIDAD ===
echo Probando backend...
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend no responde
) else (
    echo ✅ Backend funcionando
)

echo Probando frontend...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend no responde
) else (
    echo ✅ Frontend funcionando
)
echo.
pause
goto menu

:install_all
echo.
echo === EJECUTANDO TODOS LOS PASOS ===
call :install_pm2
call :install_serve
call :install_backend
call :install_frontend
call :build_frontend
call :fix_database
call :start_services
call :check_status
echo.
echo 🎉 INSTALACION COMPLETADA
echo.
pause
goto menu

:exit
echo.
echo Saliendo...
exit /b 0
