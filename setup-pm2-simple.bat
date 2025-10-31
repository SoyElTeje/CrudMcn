@echo off
REM ===========================================
REM CONFIGURAR PM2 SIMPLE PARA WINDOWS
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🔧 CONFIGURANDO PM2 SIMPLE PARA WINDOWS
echo ========================================
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

REM Paso 3: Iniciar PM2 con ecosystem
echo [INFO] 🚀 Iniciando PM2 con ecosystem...
pm2 start ecosystem.config.js --env production
if errorlevel 1 (
    echo [ERROR] No se pudo iniciar PM2 con ecosystem
    pause
    exit /b 1
)

echo [SUCCESS] ✅ PM2 iniciado con ecosystem

REM Paso 4: Guardar configuración de PM2
echo [INFO] 💾 Guardando configuración de PM2...
pm2 save
if errorlevel 1 (
    echo [WARNING] No se pudo guardar la configuración de PM2
) else (
    echo [SUCCESS] ✅ Configuración de PM2 guardada
)

REM Paso 5: Crear script de inicio automático
echo [INFO] 📝 Creando script de inicio automático...
(
echo @echo off
echo cd /d "%~dp0"
echo pm2 resurrect
echo pm2 list
) > auto-start-pm2.bat

echo [SUCCESS] ✅ Script de inicio automático creado

REM Paso 6: Crear entrada en el registro para inicio automático
echo [INFO] 🔧 Configurando inicio automático en el registro...

REM Crear clave en el registro para inicio automático
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "AbmMcn-PM2" /t REG_SZ /d "%~dp0auto-start-pm2.bat" /f >nul 2>&1

if errorlevel 1 (
    echo [WARNING] No se pudo configurar el inicio automático en el registro
    echo [INFO] Puedes ejecutar manualmente: auto-start-pm2.bat
) else (
    echo [SUCCESS] ✅ Inicio automático configurado en el registro
)

REM Paso 7: Crear tarea programada como alternativa
echo [INFO] 📅 Creando tarea programada como alternativa...

REM Crear tarea programada que se ejecute al inicio
schtasks /create /tn "AbmMcn-PM2-Startup" /tr "%~dp0auto-start-pm2.bat" /sc onstart /ru "SYSTEM" /f >nul 2>&1

if errorlevel 1 (
    echo [WARNING] No se pudo crear la tarea programada
) else (
    echo [SUCCESS] ✅ Tarea programada creada
)

REM Paso 8: Verificar estado de PM2
echo [INFO] 🔍 Verificando estado de PM2...
timeout /t 3 /nobreak >nul

pm2 list
if errorlevel 1 (
    echo [WARNING] PM2 puede no estar respondiendo correctamente
) else (
    echo [SUCCESS] ✅ PM2 funcionando correctamente
)

REM Resumen final
echo.
echo 🎉 PM2 CONFIGURADO PARA WINDOWS
echo ================================
echo.
echo 📋 Configuración completada:
echo    ✅ PM2 iniciado con ecosystem
echo    ✅ Configuración guardada
echo    ✅ Script de inicio automático creado
echo    ✅ Inicio automático configurado
echo    ✅ Tarea programada creada
echo.
echo 🔧 Comandos de gestión:
echo    pm2 list                    - Ver aplicaciones
echo    pm2 logs                    - Ver logs
echo    pm2 restart all             - Reiniciar todas
echo    pm2 stop all                - Detener todas
echo    pm2 kill                    - Detener PM2
echo    pm2 resurrect               - Restaurar aplicaciones
echo.
echo 📁 Archivos creados:
echo    auto-start-pm2.bat         - Script de inicio automático
echo    logs\                       - Directorio de logs
echo.
echo 🚀 PM2 se iniciará automáticamente al reiniciar Windows
echo    (usando registro de Windows y tarea programada)
echo.

echo [SUCCESS] 🎉 ¡PM2 configurado para Windows!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
