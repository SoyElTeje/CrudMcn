@echo off
REM ===========================================
REM CONFIGURAR ENTORNO DE PRODUCCIÓN
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

setlocal enabledelayedexpansion

echo.
echo ⚙️ CONFIGURANDO ENTORNO DE PRODUCCIÓN
echo =====================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend\env.production" (
    echo [ERROR] Archivo backend\env.production no encontrado
    echo Asegúrate de estar en el directorio raíz del proyecto
    pause
    exit /b 1
)

REM Paso 1: Copiar archivo de producción
echo [INFO] 📋 Configurando variables de entorno de producción...

cd backend
copy env.production .env >nul
if errorlevel 1 (
    echo [ERROR] No se pudo copiar env.production a .env
    cd ..
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Archivo .env creado desde env.production

REM Paso 2: Verificar variables críticas
echo [INFO] 🔍 Verificando variables críticas...

REM Verificar DB_SERVER
findstr /C:"DB_SERVER=" .env >nul
if errorlevel 1 (
    echo [ERROR] Variable DB_SERVER no encontrada en .env
    cd ..
    pause
    exit /b 1
)

REM Verificar DB_USER
findstr /C:"DB_USER=" .env >nul
if errorlevel 1 (
    echo [ERROR] Variable DB_USER no encontrada en .env
    cd ..
    pause
    exit /b 1
)

REM Verificar DB_PASSWORD
findstr /C:"DB_PASSWORD=" .env >nul
if errorlevel 1 (
    echo [ERROR] Variable DB_PASSWORD no encontrada en .env
    cd ..
    pause
    exit /b 1
)

REM Verificar JWT_SECRET
findstr /C:"JWT_SECRET=" .env >nul
if errorlevel 1 (
    echo [ERROR] Variable JWT_SECRET no encontrada en .env
    cd ..
    pause
    exit /b 1
)

echo [SUCCESS] ✅ Variables críticas verificadas

REM Paso 3: Mostrar configuración actual (sin mostrar contraseñas)
echo [INFO] 📊 Configuración actual:

echo.
echo 🔧 Variables de entorno configuradas:
echo =====================================

for /f "tokens=1,2 delims==" %%a in (.env) do (
    set var_name=%%a
    set var_value=%%b
    
    REM Ocultar contraseñas y secrets
    if "!var_name!"=="DB_PASSWORD" (
        echo    !var_name!=***OCULTO***
    ) else if "!var_name!"=="JWT_SECRET" (
        echo    !var_name!=***OCULTO***
    ) else if "!var_name!"=="ALERT_SMTP_PASS" (
        echo    !var_name!=***OCULTO***
    ) else if "!var_name!"=="ALERT_SMS_API_SECRET" (
        echo    !var_name!=***OCULTO***
    ) else (
        echo    !var_name!=!var_value!
    )
)

cd ..

REM Paso 4: Configurar NODE_ENV
echo [INFO] 🌍 Configurando NODE_ENV=production...

set NODE_ENV=production
setx NODE_ENV "production" /M >nul 2>&1

echo [SUCCESS] ✅ NODE_ENV configurado como production

REM Paso 5: Verificar que el sistema puede leer las variables
echo [INFO] 🔍 Verificando lectura de variables de entorno...

cd backend
node -e "
require('dotenv').config();
console.log('✅ Variables de entorno cargadas:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DB_SERVER:', process.env.DB_SERVER);
console.log('   DB_DATABASE:', process.env.DB_DATABASE);
console.log('   PORT:', process.env.PORT);
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '***CONFIGURADO***' : '❌ NO CONFIGURADO');
console.log('   CORS_ORIGIN:', process.env.CORS_ORIGIN);
"
if errorlevel 1 (
    echo [ERROR] Error verificando variables de entorno
    cd ..
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] ✅ Variables de entorno verificadas

REM Paso 6: Crear script de inicio con entorno correcto
echo [INFO] 📝 Creando script de inicio con entorno de producción...

echo @echo off > start-production.bat
echo REM Script de inicio para producción >> start-production.bat
echo set NODE_ENV=production >> start-production.bat
echo cd backend >> start-production.bat
echo node server.js >> start-production.bat

echo [SUCCESS] ✅ Script de inicio creado: start-production.bat

REM Resumen final
echo.
echo 🎉 CONFIGURACIÓN COMPLETADA
echo ===========================
echo.
echo 📋 Resumen de la configuración:
echo    ✅ Archivo .env creado desde env.production
echo    ✅ Variables críticas verificadas
echo    ✅ NODE_ENV configurado como production
echo    ✅ Variables de entorno verificadas
echo    ✅ Script de inicio creado
echo.
echo 📁 Archivos creados/modificados:
echo    backend\.env (desde env.production)
echo    start-production.bat
echo.
echo 🚀 Próximos pasos:
echo    1. Verificar que las credenciales de BD sean correctas
echo    2. Ejecutar: deploy-production.bat
echo    3. Verificar: verify-deployment.bat
echo.

echo [SUCCESS] 🎉 ¡Configuración de entorno de producción completada!

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
