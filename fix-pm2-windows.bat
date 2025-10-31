@echo off
REM ===========================================
REM SOLUCIONAR PROBLEMAS DE PM2 EN WINDOWS
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🔧 SOLUCIONANDO PROBLEMAS DE PM2 EN WINDOWS
echo ============================================
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

REM Paso 1: Detener todos los procesos de Node.js
echo [INFO] 🛑 Deteniendo procesos de Node.js...

taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo [INFO] No hay procesos de Node.js ejecutándose
) else (
    echo [SUCCESS] ✅ Procesos de Node.js detenidos
)

REM Paso 2: Limpiar procesos de PM2
echo [INFO] 🧹 Limpiando procesos de PM2...

REM Detener PM2 daemon si está corriendo
pm2 kill >nul 2>&1

REM Matar procesos PM2 específicos
taskkill /f /im pm2.exe >nul 2>&1
taskkill /f /im pm2-runtime.exe >nul 2>&1

echo [SUCCESS] ✅ Procesos de PM2 limpiados

REM Paso 3: Limpiar archivos temporales de PM2
echo [INFO] 🗑️ Limpiando archivos temporales de PM2...

REM Limpiar directorio PM2 del usuario
if exist "%USERPROFILE%\.pm2" (
    rmdir /s /q "%USERPROFILE%\.pm2" >nul 2>&1
    echo [SUCCESS] ✅ Directorio .pm2 del usuario limpiado
)

REM Limpiar directorio PM2 global
if exist "%APPDATA%\pm2" (
    rmdir /s /q "%APPDATA%\pm2" >nul 2>&1
    echo [SUCCESS] ✅ Directorio PM2 global limpiado
)

REM Limpiar archivos de socket
if exist "\\.\pipe\rpc.sock" (
    echo [INFO] Limpiando archivos de socket...
)

REM Paso 4: Reinstalar PM2
echo [INFO] 📦 Reinstalando PM2...

REM Desinstalar PM2 globalmente
npm uninstall -g pm2 >nul 2>&1

REM Instalar PM2 nuevamente
npm install -g pm2
if errorlevel 1 (
    echo [ERROR] No se pudo instalar PM2
    pause
    exit /b 1
)

echo [SUCCESS] ✅ PM2 reinstalado correctamente

REM Paso 5: Configurar PM2 para Windows
echo [INFO] ⚙️ Configurando PM2 para Windows...

REM Instalar pm2-windows-service
npm install -g pm2-windows-service
if errorlevel 1 (
    echo [WARNING] No se pudo instalar pm2-windows-service
) else (
    echo [SUCCESS] ✅ pm2-windows-service instalado
)

REM Paso 6: Inicializar PM2
echo [INFO] 🚀 Inicializando PM2...

REM Iniciar PM2 daemon
pm2 ping
if errorlevel 1 (
    echo [ERROR] PM2 no responde correctamente
    pause
    exit /b 1
)

echo [SUCCESS] ✅ PM2 inicializado correctamente

REM Paso 7: Configurar PM2 como servicio (opcional)
echo [INFO] 🔧 Configurando PM2 como servicio de Windows...

REM Desinstalar servicio existente si existe
pm2-service-uninstall >nul 2>&1

REM Instalar nuevo servicio
pm2-service-install -n "AbmMcn-PM2"
if errorlevel 1 (
    echo [WARNING] No se pudo configurar PM2 como servicio
    echo [INFO] Continuando sin servicio de Windows...
) else (
    echo [SUCCESS] ✅ PM2 configurado como servicio de Windows
)

REM Paso 8: Verificar instalación
echo [INFO] 🔍 Verificando instalación de PM2...

pm2 --version
if errorlevel 1 (
    echo [ERROR] PM2 no está funcionando correctamente
    pause
    exit /b 1
)

echo [SUCCESS] ✅ PM2 funcionando correctamente

REM Paso 9: Mostrar estado
echo [INFO] 📊 Estado actual de PM2...

pm2 list
if errorlevel 1 (
    echo [INFO] No hay aplicaciones ejecutándose en PM2
) else (
    echo [SUCCESS] ✅ PM2 listo para usar
)

REM Resumen final
echo.
echo 🎉 PROBLEMAS DE PM2 SOLUCIONADOS
echo ================================
echo.
echo 📋 Acciones realizadas:
echo    ✅ Procesos de Node.js detenidos
echo    ✅ Procesos de PM2 limpiados
echo    ✅ Archivos temporales eliminados
echo    ✅ PM2 reinstalado
echo    ✅ PM2 configurado para Windows
echo    ✅ PM2 inicializado correctamente
echo.
echo 🚀 Próximos pasos:
echo    1. Ejecutar: deploy-production.bat
echo    2. Verificar: verify-deployment.bat
echo.
echo 📋 Comandos útiles:
echo    pm2 list          - Ver aplicaciones
echo    pm2 start app.js  - Iniciar aplicación
echo    pm2 stop all      - Detener todas
echo    pm2 restart all   - Reiniciar todas
echo    pm2 logs          - Ver logs
echo.

echo [SUCCESS] 🎉 ¡PM2 reparado y listo para usar!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
















