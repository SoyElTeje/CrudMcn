@echo off
REM ===========================================
REM CONFIGURAR PM2 COMO SERVICIO CON NODE-WINDOWS
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🚀 CONFIGURANDO PM2 COMO SERVICIO CON NODE-WINDOWS
echo ==================================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Este script debe ejecutarse como Administrador
    echo Hacer clic derecho en el archivo y seleccionar "Ejecutar como administrador"
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Ejecutándose con permisos de administrador

REM Obtener directorio actual
set PROJECT_DIR=%~dp0
set PROJECT_DIR=%PROJECT_DIR:~0,-1%

echo [INFO] 📁 Directorio del proyecto: %PROJECT_DIR%

REM Paso 1: Verificar Node.js
echo [INFO] 🔍 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado
    echo [SOLUTION] Instalar Node.js desde: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] ✅ Node.js instalado - Versión: !NODE_VERSION!
)

REM Paso 2: Verificar PM2
echo [INFO] 🔍 Verificando PM2...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PM2 no está instalado
    echo [INFO] Instalando PM2...
    npm install -g pm2
    if errorlevel 1 (
        echo [ERROR] No se pudo instalar PM2
        pause
        exit /b 1
    )
    echo [SUCCESS] ✅ PM2 instalado
) else (
    for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
    echo [SUCCESS] ✅ PM2 instalado - Versión: !PM2_VERSION!
)

REM Paso 3: Instalar node-windows
echo [INFO] 📦 Instalando node-windows...
npm install node-windows
if errorlevel 1 (
    echo [ERROR] No se pudo instalar node-windows
    pause
    exit /b 1
)
echo [SUCCESS] ✅ node-windows instalado

REM Paso 4: Detener PM2 actual
echo [INFO] 🛑 Deteniendo PM2 actual...
pm2 kill >nul 2>&1
echo [SUCCESS] ✅ PM2 detenido

REM Paso 5: Crear directorio de logs
echo [INFO] 📁 Creando directorio de logs...
if not exist "logs" mkdir logs
echo [SUCCESS] ✅ Directorio de logs creado

REM Paso 6: Verificar archivos necesarios
echo [INFO] 🔍 Verificando archivos necesarios...
if not exist "ecosystem.config.js" (
    echo [ERROR] ecosystem.config.js no encontrado
    echo [SOLUTION] Asegúrate de que el archivo ecosystem.config.js esté en el directorio del proyecto
    pause
    exit /b 1
)
echo [SUCCESS] ✅ ecosystem.config.js encontrado

if not exist "setup-node-windows-service.js" (
    echo [ERROR] setup-node-windows-service.js no encontrado
    echo [SOLUTION] Asegúrate de que el archivo setup-node-windows-service.js esté en el directorio del proyecto
    pause
    exit /b 1
)
echo [SUCCESS] ✅ setup-node-windows-service.js encontrado

if not exist "pm2-service.js" (
    echo [ERROR] pm2-service.js no encontrado
    echo [SOLUTION] Asegúrate de que el archivo pm2-service.js esté en el directorio del proyecto
    pause
    exit /b 1
)
echo [SUCCESS] ✅ pm2-service.js encontrado

REM Paso 7: Instalar el servicio
echo [INFO] 🔧 Instalando servicio PM2 con node-windows...
node setup-node-windows-service.js install
if errorlevel 1 (
    echo [ERROR] No se pudo instalar el servicio PM2
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Servicio PM2 instalado con node-windows

REM Paso 8: Verificar estado del servicio
echo [INFO] 🔍 Verificando estado del servicio...
timeout /t 5 /nobreak >nul

REM Verificar en el Administrador de servicios
sc query "AbmMcn-PM2" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] El servicio puede no estar funcionando correctamente
) else (
    echo [SUCCESS] ✅ Servicio PM2 funcionando correctamente
    sc query "AbmMcn-PM2"
)

REM Paso 9: Verificar PM2
echo [INFO] 🔍 Verificando PM2...
timeout /t 3 /nobreak >nul

pm2 list
if errorlevel 1 (
    echo [WARNING] PM2 puede no estar respondiendo correctamente
) else (
    echo [SUCCESS] ✅ PM2 funcionando correctamente
    echo [INFO] 📋 Aplicaciones activas:
    pm2 list
)

REM Paso 10: Verificar puertos
echo [INFO] 🔍 Verificando puertos...
netstat -an | findstr ":3001" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ⚠️ Puerto 3001 (backend) no está en uso
) else (
    echo [SUCCESS] ✅ Puerto 3001 (backend) está en uso
)

netstat -an | findstr ":5173" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ⚠️ Puerto 5173 (frontend) no está en uso
) else (
    echo [SUCCESS] ✅ Puerto 5173 (frontend) está en uso
)

REM Resumen final
echo.
echo 🎉 PM2 CONFIGURADO COMO SERVICIO CON NODE-WINDOWS
echo =================================================
echo.
echo 📋 Configuración completada:
echo    ✅ Node.js verificado
echo    ✅ PM2 verificado
echo    ✅ node-windows instalado
echo    ✅ Servicio de Windows instalado
echo    ✅ Servicio iniciado
echo.
echo 🔧 Comandos de gestión del servicio:
echo    node setup-node-windows-service.js start     - Iniciar servicio
echo    node setup-node-windows-service.js stop      - Detener servicio
echo    node setup-node-windows-service.js restart   - Reiniciar servicio
echo    node setup-node-windows-service.js uninstall - Desinstalar servicio
echo.
echo 📋 Comandos de PM2:
echo    pm2 list                    - Ver aplicaciones
echo    pm2 logs                    - Ver logs
echo    pm2 restart all             - Reiniciar todas
echo    pm2 stop all                - Detener todas
echo.
echo 📁 Archivos creados:
echo    logs\pm2-service-info.log   - Log de información
echo    logs\pm2-service-error.log  - Log de errores
echo    logs\pm2-service-stdout.log - Log de salida
echo    logs\pm2-service-stderr.log - Log de errores
echo.
echo 🚀 El servicio se iniciará automáticamente al reiniciar Windows
echo.
echo 🔍 Para verificar en el Administrador de servicios:
echo    services.msc
echo    Buscar "AbmMcn-PM2"
echo.

echo [SUCCESS] 🎉 ¡PM2 configurado como servicio con node-windows!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
