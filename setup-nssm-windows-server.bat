@echo off
REM ===========================================
REM CONFIGURAR PM2 COMO SERVICIO CON NSSM
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM Para Windows Server
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🚀 CONFIGURANDO PM2 COMO SERVICIO CON NSSM
echo ===========================================
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

REM Paso 3: Verificar NSSM
echo [INFO] 🔍 Verificando NSSM...
nssm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] NSSM no está instalado
    echo [INFO] Instalando NSSM...
    
    REM Intentar instalar con winget
    winget install NSSM >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] winget no disponible, intentando con Chocolatey...
        choco install nssm -y >nul 2>&1
        if errorlevel 1 (
            echo [ERROR] No se pudo instalar NSSM automáticamente
            echo [SOLUTION] Instalar manualmente desde: https://nssm.cc/download
            echo [SOLUTION] O ejecutar: choco install nssm
            pause
            exit /b 1
        )
    )
    echo [SUCCESS] ✅ NSSM instalado
) else (
    for /f "tokens=*" %%i in ('nssm --version') do set NSSM_VERSION=%%i
    echo [SUCCESS] ✅ NSSM instalado - Versión: !NSSM_VERSION!
)

REM Paso 4: Detener PM2 actual
echo [INFO] 🛑 Deteniendo PM2 actual...
pm2 kill >nul 2>&1
echo [SUCCESS] ✅ PM2 detenido

REM Paso 5: Crear directorio de logs
echo [INFO] 📁 Creando directorio de logs...
if not exist "logs" mkdir logs
echo [SUCCESS] ✅ Directorio de logs creado

REM Paso 6: Crear script de inicio
echo [INFO] 📝 Creando script de inicio...
(
echo @echo off
echo cd /d "%PROJECT_DIR%"
echo pm2 start ecosystem.config.js --env production
echo pm2 save
) > start-pm2.bat

echo [SUCCESS] ✅ Script de inicio creado

REM Paso 7: Crear script de parada
echo [INFO] 📝 Creando script de parada...
(
echo @echo off
echo cd /d "%PROJECT_DIR%"
echo pm2 stop all
echo pm2 kill
) > stop-pm2.bat

echo [SUCCESS] ✅ Script de parada creado

REM Paso 8: Desinstalar servicio existente si existe
echo [INFO] 🧹 Limpiando servicio existente...
nssm stop "AbmMcn-PM2" >nul 2>&1
nssm remove "AbmMcn-PM2" confirm >nul 2>&1
echo [SUCCESS] ✅ Servicio existente limpiado

REM Paso 9: Instalar nuevo servicio
echo [INFO] 🔧 Instalando servicio PM2...
nssm install "AbmMcn-PM2" "%PROJECT_DIR%\start-pm2.bat"
if errorlevel 1 (
    echo [ERROR] No se pudo instalar el servicio PM2
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Servicio PM2 instalado

REM Paso 10: Configurar parámetros del servicio
echo [INFO] ⚙️ Configurando parámetros del servicio...

REM Configurar directorio de trabajo
nssm set "AbmMcn-PM2" AppDirectory "%PROJECT_DIR%"

REM Configurar descripción
nssm set "AbmMcn-PM2" Description "AbmMcn - Sistema de Gestión de Bases de Datos - PM2 Process Manager"

REM Configurar inicio automático
nssm set "AbmMcn-PM2" Start SERVICE_AUTO_START

REM Configurar reinicio automático
nssm set "AbmMcn-PM2" AppExit Default Restart

REM Configurar logs del servicio
nssm set "AbmMcn-PM2" AppStdout "%PROJECT_DIR%\logs\pm2-service.log"
nssm set "AbmMcn-PM2" AppStderr "%PROJECT_DIR%\logs\pm2-service-error.log"

REM Configurar tiempo de espera
nssm set "AbmMcn-PM2" AppStopMethodSkip 0
nssm set "AbmMcn-PM2" AppStopMethodConsole 5000
nssm set "AbmMcn-PM2" AppStopMethodWindow 5000
nssm set "AbmMcn-PM2" AppStopMethodThreads 5000

echo [SUCCESS] ✅ Parámetros del servicio configurados

REM Paso 11: Iniciar el servicio
echo [INFO] 🚀 Iniciando servicio PM2...
nssm start "AbmMcn-PM2"
if errorlevel 1 (
    echo [ERROR] No se pudo iniciar el servicio PM2
    echo [INFO] Verificando logs...
    if exist "logs\pm2-service-error.log" (
        echo [ERROR] Logs de error:
        type "logs\pm2-service-error.log"
    )
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Servicio PM2 iniciado

REM Paso 12: Verificar estado del servicio
echo [INFO] 🔍 Verificando estado del servicio...
timeout /t 5 /nobreak >nul

nssm status "AbmMcn-PM2"
if errorlevel 1 (
    echo [WARNING] El servicio puede no estar funcionando correctamente
) else (
    echo [SUCCESS] ✅ Servicio PM2 funcionando correctamente
)

REM Paso 13: Verificar PM2
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

REM Paso 14: Verificar puertos
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
echo 🎉 PM2 CONFIGURADO COMO SERVICIO DE WINDOWS
echo ===========================================
echo.
echo 📋 Configuración completada:
echo    ✅ Node.js verificado
echo    ✅ PM2 verificado
echo    ✅ NSSM verificado
echo    ✅ Scripts de inicio/parada creados
echo    ✅ Servicio de Windows instalado
echo    ✅ Parámetros configurados
echo    ✅ Servicio iniciado
echo.
echo 🔧 Comandos de gestión del servicio:
echo    nssm start "AbmMcn-PM2"     - Iniciar servicio
echo    nssm stop "AbmMcn-PM2"      - Detener servicio
echo    nssm restart "AbmMcn-PM2"   - Reiniciar servicio
echo    nssm status "AbmMcn-PM2"    - Ver estado
echo    nssm remove "AbmMcn-PM2"    - Desinstalar servicio
echo.
echo 📋 Comandos de PM2:
echo    pm2 list                    - Ver aplicaciones
echo    pm2 logs                    - Ver logs
echo    pm2 restart all             - Reiniciar todas
echo    pm2 stop all                - Detener todas
echo.
echo 📁 Archivos creados:
echo    start-pm2.bat              - Script de inicio
echo    stop-pm2.bat               - Script de parada
echo    logs\pm2-service.log       - Log del servicio
echo    logs\pm2-service-error.log - Log de errores
echo.
echo 🚀 El servicio se iniciará automáticamente al reiniciar Windows
echo.
echo 🔍 Para verificar en el Administrador de servicios:
echo    services.msc
echo    Buscar "AbmMcn-PM2"
echo.

echo [SUCCESS] 🎉 ¡PM2 configurado como servicio de Windows!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
