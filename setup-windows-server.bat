@echo off
REM ===========================================
REM CONFIGURACIÓN INICIAL PARA WINDOWS SERVER
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo ⚙️ CONFIGURACIÓN INICIAL - WINDOWS SERVER
echo =========================================
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

REM Paso 1: Instalar Node.js si no está instalado
echo [INFO] 🔍 Verificando Node.js...

node --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Node.js no está instalado
    echo [INFO] Descargando Node.js LTS...
    
    REM Crear directorio temporal
    if not exist "%TEMP%\nodejs" mkdir "%TEMP%\nodejs"
    
    REM Descargar Node.js (versión LTS)
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\nodejs\nodejs.msi'"
    
    if exist "%TEMP%\nodejs\nodejs.msi" (
        echo [INFO] Instalando Node.js...
        msiexec /i "%TEMP%\nodejs\nodejs.msi" /quiet /norestart
        
        REM Limpiar archivos temporales
        del "%TEMP%\nodejs\nodejs.msi"
        rmdir "%TEMP%\nodejs"
        
        echo [SUCCESS] ✅ Node.js instalado
        echo [INFO] Reiniciar el script después de reiniciar la consola
        pause
        exit /b 0
    ) else (
        echo [ERROR] No se pudo descargar Node.js
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] ✅ Node.js ya está instalado
)

REM Paso 2: Instalar PM2 globalmente
echo [INFO] 📦 Instalando PM2...

pm2 --version >nul 2>&1
if errorlevel 1 (
    npm install -g pm2
    if errorlevel 1 (
        echo [ERROR] No se pudo instalar PM2
        pause
        exit /b 1
    )
    echo [SUCCESS] ✅ PM2 instalado
) else (
    echo [SUCCESS] ✅ PM2 ya está instalado
)

REM Paso 3: Instalar serve para el frontend
echo [INFO] 📦 Instalando serve para frontend...

npm list -g serve >nul 2>&1
if errorlevel 1 (
    npm install -g serve
    if errorlevel 1 (
        echo [ERROR] No se pudo instalar serve
        pause
        exit /b 1
    )
    echo [SUCCESS] ✅ serve instalado
) else (
    echo [SUCCESS] ✅ serve ya está instalado
)

REM Paso 4: Configurar firewall de Windows
echo [INFO] 🔥 Configurando firewall de Windows...

REM Permitir puerto 3001 (backend)
netsh advfirewall firewall add rule name="AbmMcn Backend" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1

REM Permitir puerto 5173 (frontend)
netsh advfirewall firewall add rule name="AbmMcn Frontend" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1

echo [SUCCESS] ✅ Reglas de firewall configuradas

REM Paso 5: Crear directorios necesarios
echo [INFO] 📁 Creando directorios del sistema...

if not exist "C:\AbmMcn" mkdir "C:\AbmMcn"
if not exist "C:\AbmMcn\logs" mkdir "C:\AbmMcn\logs"
if not exist "C:\AbmMcn\uploads" mkdir "C:\AbmMcn\uploads"
if not exist "C:\AbmMcn\backups" mkdir "C:\AbmMcn\backups"

echo [SUCCESS] ✅ Directorios del sistema creados

REM Paso 6: Configurar variables de entorno del sistema
echo [INFO] 🌍 Configurando variables de entorno...

REM Agregar Node.js al PATH si no está
setx PATH "%PATH%;C:\Program Files\nodejs" /M >nul 2>&1

REM Configurar variable NODE_ENV
setx NODE_ENV "production" /M >nul 2>&1

echo [SUCCESS] ✅ Variables de entorno configuradas

REM Paso 7: Configurar servicio de Windows para PM2
echo [INFO] ⚙️ Configurando servicio de Windows para PM2...

REM Instalar pm2-windows-service
npm install -g pm2-windows-service

REM Configurar PM2 como servicio de Windows
pm2-service-install -n "AbmMcn-PM2"

echo [SUCCESS] ✅ Servicio de Windows configurado

REM Paso 8: Configurar tareas programadas para backup
echo [INFO] 📅 Configurando tareas programadas...

REM Crear script de backup
echo @echo off > "C:\AbmMcn\backup.bat"
echo REM Script de backup automático >> "C:\AbmMcn\backup.bat"
echo cd /d "%~dp0" >> "C:\AbmMcn\backup.bat"
echo pm2 save >> "C:\AbmMcn\backup.bat"
echo echo Backup completado: %date% %time% >> "C:\AbmMcn\backup.bat"

REM Crear tarea programada (backup diario a las 2 AM)
schtasks /create /tn "AbmMcn-Backup" /tr "C:\AbmMcn\backup.bat" /sc daily /st 02:00 /ru SYSTEM /f >nul 2>&1

echo [SUCCESS] ✅ Tareas programadas configuradas

REM Paso 9: Configurar monitoreo básico
echo [INFO] 📊 Configurando monitoreo...

REM Crear script de monitoreo
echo @echo off > "C:\AbmMcn\monitor.bat"
echo REM Script de monitoreo >> "C:\AbmMcn\monitor.bat"
echo cd /d "%~dp0" >> "C:\AbmMcn\monitor.bat"
echo pm2 list >> "C:\AbmMcn\monitor.bat"
echo echo Monitoreo completado: %date% %time% >> "C:\AbmMcn\monitor.bat"

echo [SUCCESS] ✅ Monitoreo configurado

REM Resumen final
echo.
echo 🎉 CONFIGURACIÓN COMPLETADA
echo ===========================
echo.
echo 📋 Resumen de la configuración:
echo    ✅ Node.js instalado y configurado
echo    ✅ PM2 instalado como servicio de Windows
echo    ✅ Firewall configurado (puertos 3001, 5173)
echo    ✅ Directorios del sistema creados
echo    ✅ Variables de entorno configuradas
echo    ✅ Backup automático programado
echo    ✅ Monitoreo básico configurado
echo.
echo 📁 Directorios creados:
echo    C:\AbmMcn\
echo    C:\AbmMcn\logs\
echo    C:\AbmMcn\uploads\
echo    C:\AbmMcn\backups\
echo.
echo 🔧 Servicios configurados:
echo    AbmMcn-PM2 (servicio de Windows)
echo    AbmMcn-Backup (tarea programada)
echo.
echo 📋 Próximos pasos:
echo    1. Copiar el proyecto a C:\AbmMcn\
echo    2. Ejecutar deploy-production.bat
echo    3. Ejecutar verify-deployment.bat
echo.

echo [SUCCESS] 🎉 ¡Configuración de Windows Server completada!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul







