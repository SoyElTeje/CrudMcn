@echo off
REM ===========================================
REM CONFIGURAR PM2 COMO SERVICIO DE WINDOWS
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🔧 CONFIGURANDO PM2 COMO SERVICIO DE WINDOWS
echo =============================================
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

REM Paso 1: Detener PM2 si está corriendo
echo [INFO] 🛑 Deteniendo PM2 actual...
pm2 kill >nul 2>&1
echo [SUCCESS] ✅ PM2 detenido

REM Paso 2: Crear directorio de logs si no existe
echo [INFO] 📁 Creando directorio de logs...
if not exist "logs" mkdir logs
echo [SUCCESS] ✅ Directorio de logs creado

REM Paso 3: Crear script de inicio de PM2
echo [INFO] 📝 Creando script de inicio de PM2...
(
echo @echo off
echo cd /d "%~dp0"
echo pm2 start ecosystem.config.js --env production
echo pm2 save
echo pm2 startup
) > start-pm2.bat

echo [SUCCESS] ✅ Script de inicio creado

REM Paso 4: Crear script de parada de PM2
echo [INFO] 📝 Creando script de parada de PM2...
(
echo @echo off
echo cd /d "%~dp0"
echo pm2 stop all
echo pm2 kill
) > stop-pm2.bat

echo [SUCCESS] ✅ Script de parada creado

REM Paso 5: Configurar PM2 como servicio usando NSSM
echo [INFO] 🔧 Configurando PM2 como servicio de Windows...

REM Desinstalar servicio existente si existe
nssm stop "AbmMcn-PM2" >nul 2>&1
nssm remove "AbmMcn-PM2" confirm >nul 2>&1

REM Instalar nuevo servicio
nssm install "AbmMcn-PM2" "%~dp0start-pm2.bat"
if errorlevel 1 (
    echo [ERROR] No se pudo instalar el servicio PM2
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Servicio PM2 instalado

REM Paso 6: Configurar parámetros del servicio
echo [INFO] ⚙️ Configurando parámetros del servicio...

REM Configurar directorio de trabajo
nssm set "AbmMcn-PM2" AppDirectory "%~dp0"

REM Configurar descripción
nssm set "AbmMcn-PM2" Description "AbmMcn - Sistema de Gestión de Bases de Datos - PM2 Process Manager"

REM Configurar inicio automático
nssm set "AbmMcn-PM2" Start SERVICE_AUTO_START

REM Configurar reinicio automático
nssm set "AbmMcn-PM2" AppExit Default Restart

REM Configurar logs del servicio
nssm set "AbmMcn-PM2" AppStdout "%~dp0logs\pm2-service.log"
nssm set "AbmMcn-PM2" AppStderr "%~dp0logs\pm2-service-error.log"

REM Configurar tiempo de espera
nssm set "AbmMcn-PM2" AppStopMethodSkip 0
nssm set "AbmMcn-PM2" AppStopMethodConsole 5000
nssm set "AbmMcn-PM2" AppStopMethodWindow 5000
nssm set "AbmMcn-PM2" AppStopMethodThreads 5000

echo [SUCCESS] ✅ Parámetros del servicio configurados

REM Paso 7: Iniciar el servicio
echo [INFO] 🚀 Iniciando servicio PM2...
nssm start "AbmMcn-PM2"
if errorlevel 1 (
    echo [ERROR] No se pudo iniciar el servicio PM2
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Servicio PM2 iniciado

REM Paso 8: Verificar estado del servicio
echo [INFO] 🔍 Verificando estado del servicio...
timeout /t 5 /nobreak >nul

nssm status "AbmMcn-PM2"
if errorlevel 1 (
    echo [WARNING] El servicio puede no estar funcionando correctamente
) else (
    echo [SUCCESS] ✅ Servicio PM2 funcionando correctamente
)

REM Paso 9: Verificar PM2
echo [INFO] 🔍 Verificando PM2...
timeout /t 3 /nobreak >nul

pm2 list
if errorlevel 1 (
    echo [WARNING] PM2 puede no estar respondiendo correctamente
) else (
    echo [SUCCESS] ✅ PM2 funcionando correctamente
)

REM Resumen final
echo.
echo 🎉 PM2 CONFIGURADO COMO SERVICIO DE WINDOWS
echo ===========================================
echo.
echo 📋 Configuración completada:
echo    ✅ Script de inicio creado
echo    ✅ Script de parada creado
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

echo [SUCCESS] 🎉 ¡PM2 configurado como servicio de Windows!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
