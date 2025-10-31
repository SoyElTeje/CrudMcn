@echo off
REM ===========================================
REM DIAGNOSTICAR ESTADO DE PM2
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🔍 DIAGNOSTICANDO ESTADO DE PM2
echo ================================
echo.

REM Verificar si PM2 está instalado
echo [INFO] 🔍 Verificando instalación de PM2...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ❌ PM2 no está instalado o no está en el PATH
    echo [SOLUTION] Ejecutar: npm install -g pm2
    goto :end
) else (
    for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
    echo [SUCCESS] ✅ PM2 instalado - Versión: !PM2_VERSION!
)

REM Verificar si PM2 responde
echo [INFO] 🔍 Verificando respuesta de PM2...
pm2 ping >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ⚠️ PM2 no responde (daemon no iniciado)
    echo [SOLUTION] Ejecutar: pm2 ping
) else (
    echo [SUCCESS] ✅ PM2 responde correctamente
)

REM Verificar aplicaciones en PM2
echo [INFO] 🔍 Verificando aplicaciones en PM2...
pm2 list >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ⚠️ No se pueden listar aplicaciones de PM2
    echo [SOLUTION] Ejecutar: pm2 kill && pm2 start ecosystem.config.js
) else (
    echo [SUCCESS] ✅ PM2 puede listar aplicaciones
    echo [INFO] 📋 Aplicaciones actuales:
    pm2 list
)

REM Verificar procesos de Node.js
echo [INFO] 🔍 Verificando procesos de Node.js...
tasklist | findstr node.exe >nul 2>&1
if errorlevel 1 (
    echo [INFO] ℹ️ No hay procesos de Node.js ejecutándose
) else (
    echo [SUCCESS] ✅ Procesos de Node.js encontrados:
    tasklist | findstr node.exe
)

REM Verificar procesos de PM2
echo [INFO] 🔍 Verificando procesos de PM2...
tasklist | findstr pm2 >nul 2>&1
if errorlevel 1 (
    echo [INFO] ℹ️ No hay procesos de PM2 ejecutándose
) else (
    echo [SUCCESS] ✅ Procesos de PM2 encontrados:
    tasklist | findstr pm2
)

REM Verificar directorio PM2
echo [INFO] 🔍 Verificando directorio PM2...
if exist "%USERPROFILE%\.pm2" (
    echo [SUCCESS] ✅ Directorio PM2 existe: %USERPROFILE%\.pm2
    dir "%USERPROFILE%\.pm2" /b 2>nul | findstr /i "dump\|pids\|logs" >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] ⚠️ Directorio PM2 existe pero puede estar vacío
    ) else (
        echo [SUCCESS] ✅ Directorio PM2 contiene archivos de configuración
    )
) else (
    echo [WARNING] ⚠️ Directorio PM2 no existe: %USERPROFILE%\.pm2
    echo [SOLUTION] Ejecutar: pm2 ping (esto creará el directorio)
)

REM Verificar archivos de socket
echo [INFO] 🔍 Verificando archivos de socket...
if exist "\\.\pipe\rpc.sock" (
    echo [SUCCESS] ✅ Archivo de socket PM2 existe
) else (
    echo [INFO] ℹ️ Archivo de socket PM2 no existe (normal si PM2 no está corriendo)
)

REM Verificar servicio de Windows (si existe)
echo [INFO] 🔍 Verificando servicio de Windows...
sc query "AbmMcn-PM2" >nul 2>&1
if errorlevel 1 (
    echo [INFO] ℹ️ Servicio de Windows 'AbmMcn-PM2' no está instalado
) else (
    echo [SUCCESS] ✅ Servicio de Windows 'AbmMcn-PM2' está instalado
    sc query "AbmMcn-PM2"
)

REM Verificar tarea programada
echo [INFO] 🔍 Verificando tarea programada...
schtasks /query /tn "AbmMcn-PM2-Startup" >nul 2>&1
if errorlevel 1 (
    echo [INFO] ℹ️ Tarea programada 'AbmMcn-PM2-Startup' no existe
) else (
    echo [SUCCESS] ✅ Tarea programada 'AbmMcn-PM2-Startup' existe
    schtasks /query /tn "AbmMcn-PM2-Startup"
)

REM Verificar entrada en el registro
echo [INFO] 🔍 Verificando entrada en el registro...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "AbmMcn-PM2" >nul 2>&1
if errorlevel 1 (
    echo [INFO] ℹ️ Entrada en el registro 'AbmMcn-PM2' no existe
) else (
    echo [SUCCESS] ✅ Entrada en el registro 'AbmMcn-PM2' existe
    reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "AbmMcn-PM2"
)

REM Verificar logs
echo [INFO] 🔍 Verificando logs...
if exist "logs" (
    echo [SUCCESS] ✅ Directorio de logs existe
    if exist "logs\backend-error.log" (
        echo [SUCCESS] ✅ Log de backend existe
    ) else (
        echo [INFO] ℹ️ Log de backend no existe
    )
    if exist "logs\frontend-error.log" (
        echo [SUCCESS] ✅ Log de frontend existe
    ) else (
        echo [INFO] ℹ️ Log de frontend no existe
    )
) else (
    echo [WARNING] ⚠️ Directorio de logs no existe
)

REM Verificar puertos
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
echo 📊 RESUMEN DEL DIAGNÓSTICO
echo ===========================
echo.

REM Determinar estado general
set STATUS=UNKNOWN
if exist "%USERPROFILE%\.pm2" (
    pm2 list >nul 2>&1
    if not errorlevel 1 (
        set STATUS=WORKING
    ) else (
        set STATUS=NOT_RESPONDING
    )
) else (
    set STATUS=NOT_INSTALLED
)

echo [INFO] 📋 Estado general de PM2: !STATUS!

if "!STATUS!"=="WORKING" (
    echo [SUCCESS] 🎉 PM2 está funcionando correctamente
    echo [INFO] 📋 Aplicaciones activas:
    pm2 list
) else if "!STATUS!"=="NOT_RESPONDING" (
    echo [WARNING] ⚠️ PM2 está instalado pero no responde
    echo [SOLUTION] Ejecutar: fix-pm2-windows.bat
) else if "!STATUS!"=="NOT_INSTALLED" (
    echo [ERROR] ❌ PM2 no está instalado correctamente
    echo [SOLUTION] Ejecutar: npm install -g pm2
) else (
    echo [ERROR] ❌ Estado desconocido de PM2
    echo [SOLUTION] Ejecutar: fix-pm2-windows.bat
)

echo.
echo 🔧 COMANDOS DE SOLUCIÓN
echo ========================
echo.
echo Si PM2 no funciona:
echo    fix-pm2-windows.bat           - Reparar PM2
echo    setup-pm2-simple.bat          - Configurar PM2 simple
echo    setup-pm2-windows-service.bat - Configurar PM2 como servicio
echo.
echo Si PM2 funciona pero no persiste:
echo    setup-pm2-simple.bat          - Configurar inicio automático
echo    setup-pm2-windows-service.bat - Configurar como servicio
echo.

:end
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
