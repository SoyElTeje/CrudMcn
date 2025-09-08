@echo off
REM ===========================================
REM SCRIPT DE DESPLIEGUE A PRODUCCIÓN - AbmMcn
REM Para Windows Server
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo 🚀 INICIANDO DESPLIEGUE A PRODUCCIÓN - AbmMcn
echo ==============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo [ERROR] No se encontró package.json. Ejecutar desde el directorio raíz del proyecto.
    pause
    exit /b 1
)

REM Paso 1: Verificar dependencias del sistema
echo [INFO] 🔍 Verificando dependencias del sistema...

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado. Instalar Node.js 18+ antes de continuar.
    pause
    exit /b 1
)

REM Verificar PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PM2 no está instalado. Instalando PM2 globalmente...
    npm install -g pm2
    if errorlevel 1 (
        echo [ERROR] No se pudo instalar PM2
        pause
        exit /b 1
    )
)

REM Verificar Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no está instalado.
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Dependencias del sistema verificadas

REM Paso 2: Verificar configuración de producción
echo [INFO] 🔧 Verificando configuración de producción...

if not exist "backend\env.production" (
    echo [ERROR] Archivo backend\env.production no encontrado. Configurar variables de entorno.
    pause
    exit /b 1
)

if not exist "ecosystem.config.js" (
    echo [ERROR] Archivo ecosystem.config.js no encontrado.
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Configuración de producción verificada

REM Paso 3: Crear directorios necesarios
echo [INFO] 📁 Creando directorios necesarios...

if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backend\uploads" mkdir backend\uploads
if not exist "frontend\dist" mkdir frontend\dist

echo [SUCCESS] ✅ Directorios creados

REM Paso 4: Instalar dependencias
echo [INFO] 📦 Instalando dependencias...

REM Backend
echo [INFO] Instalando dependencias del backend...
cd backend
call npm ci --production
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias del backend
    cd ..
    pause
    exit /b 1
)
cd ..

REM Frontend
echo [INFO] Instalando dependencias del frontend...
cd frontend
call npm ci
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias del frontend
    cd ..
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] ✅ Dependencias instaladas

REM Paso 5: Compilar frontend
echo [INFO] 🏗️ Compilando frontend para producción...

cd frontend
call npm run build
if errorlevel 1 (
    echo [ERROR] Error compilando frontend
    cd ..
    pause
    exit /b 1
)
cd ..

REM Verificar que el directorio dist existe y no está vacío
if not exist "frontend\dist" (
    echo [ERROR] El directorio frontend\dist no existe después de la compilación
    pause
    exit /b 1
)

dir /b "frontend\dist" | findstr /r "." >nul
if errorlevel 1 (
    echo [ERROR] El directorio frontend\dist está vacío después de la compilación
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Frontend compilado

REM Paso 6: Configurar entorno de producción
echo [INFO] ⚙️ Configurando entorno de producción...

REM Ejecutar script de configuración de entorno
call configure-production-env.bat
if errorlevel 1 (
    echo [ERROR] Error configurando entorno de producción
    pause
    exit /b 1
)

REM Paso 7: Verificar base de datos
echo [INFO] 🗄️ Verificando conexión a base de datos...

cd backend
REM Verificar conexión
node -e "const { getPool } = require('./db'); require('dotenv').config(); async function testConnection() { try { const pool = await getPool(); console.log('✅ Conexión a base de datos exitosa'); process.exit(0); } catch (error) { console.error('❌ Error de conexión:', error.message); process.exit(1); } } testConnection();"
if errorlevel 1 (
    echo [ERROR] No se pudo conectar a la base de datos. Verificar configuración.
    cd ..
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] ✅ Conexión a base de datos verificada

REM Paso 8: Configurar PM2
echo [INFO] ⚙️ Configurando PM2...

REM Detener procesos existentes si están corriendo
pm2 delete all >nul 2>&1

REM Configurar PM2 para que se inicie automáticamente (Windows)
pm2 startup >nul 2>&1

echo [SUCCESS] ✅ PM2 configurado

REM Paso 9: Iniciar aplicaciones con PM2
echo [INFO] 🚀 Iniciando aplicaciones con PM2...

REM Iniciar con configuración de producción
pm2 start ecosystem.config.js --env production
if errorlevel 1 (
    echo [ERROR] Error iniciando aplicaciones con PM2
    pause
    exit /b 1
)

REM Guardar configuración de PM2
pm2 save

echo [SUCCESS] ✅ Aplicaciones iniciadas con PM2

REM Paso 10: Verificar estado de las aplicaciones
echo [INFO] 🔍 Verificando estado de las aplicaciones...

REM Esperar a que las aplicaciones se inicien
timeout /t 5 /nobreak >nul

REM Verificar backend
pm2 list | findstr "abmmcn-backend" | findstr "online" >nul
if errorlevel 1 (
    echo [ERROR] Backend no está corriendo correctamente
    pause
    exit /b 1
)

REM Verificar frontend
pm2 list | findstr "abmmcn-frontend" | findstr "online" >nul
if errorlevel 1 (
    echo [ERROR] Frontend no está corriendo correctamente
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Aplicaciones verificadas y funcionando

REM Paso 11: Mostrar información del despliegue
echo.
echo 🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ======================================
echo.
echo 📱 Aplicaciones corriendo:
pm2 list
echo.
echo 🌐 URLs de acceso:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo 📋 Comandos útiles:
echo    Ver logs:           pm2 logs
echo    Ver estado:         pm2 status
echo    Reiniciar:          pm2 restart all
echo    Detener:            pm2 stop all
echo    Monitoreo:          pm2 monit
echo.
echo 📁 Archivos de log:
echo    Backend:  logs\backend-*.log
echo    Frontend: logs\frontend-*.log
echo.

echo [SUCCESS] 🎉 ¡Despliegue a producción completado exitosamente!

REM Mostrar logs recientes
echo [INFO] 📋 Mostrando logs recientes (últimas 10 líneas):
pm2 logs --lines 10

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
