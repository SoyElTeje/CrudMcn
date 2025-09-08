@echo off
REM ===========================================
REM VERIFICAR VARIABLES DE ENTORNO
REM AbmMcn - Sistema de Gestión de Bases de Datos
REM ===========================================

echo.
echo 🔍 VERIFICANDO VARIABLES DE ENTORNO
echo ===================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend\.env" (
    echo [ERROR] Archivo backend\.env no encontrado
    echo Ejecutar primero: configure-production-env.bat
    pause
    exit /b 1
)

echo [INFO] 📋 Verificando variables de entorno...

cd backend
node -e "
require('dotenv').config();

console.log('🔧 Variables de entorno cargadas:');
console.log('=====================================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NO CONFIGURADO');
console.log('PORT:', process.env.PORT || 'NO CONFIGURADO');
console.log('');
console.log('🗄️ Base de datos:');
console.log('DB_SERVER:', process.env.DB_SERVER || 'NO CONFIGURADO');
console.log('DB_PORT:', process.env.DB_PORT || 'NO CONFIGURADO');
console.log('DB_USER:', process.env.DB_USER || 'NO CONFIGURADO');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('DB_DATABASE:', process.env.DB_DATABASE || 'NO CONFIGURADO');
console.log('');
console.log('🔐 Seguridad:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'NO CONFIGURADO');
console.log('');
console.log('🌐 CORS:');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'NO CONFIGURADO');
console.log('');
console.log('📊 Pool de conexiones:');
console.log('DB_POOL_MAX:', process.env.DB_POOL_MAX || 'NO CONFIGURADO');
console.log('DB_POOL_MIN:', process.env.DB_POOL_MIN || 'NO CONFIGURADO');
console.log('DB_IDLE_TIMEOUT:', process.env.DB_IDLE_TIMEOUT || 'NO CONFIGURADO');
console.log('');
console.log('📧 Alertas:');
console.log('ALERT_EMAIL_ENABLED:', process.env.ALERT_EMAIL_ENABLED || 'NO CONFIGURADO');
console.log('ALERT_EMAIL_TO:', process.env.ALERT_EMAIL_TO || 'NO CONFIGURADO');
console.log('');

// Verificar variables críticas
const criticalVars = [
    'NODE_ENV',
    'DB_SERVER',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_DATABASE',
    'JWT_SECRET'
];

let missingVars = [];
criticalVars.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.log('❌ Variables críticas faltantes:');
    missingVars.forEach(varName => {
        console.log('   -', varName);
    });
    console.log('');
    console.log('🔧 Solución:');
    console.log('   1. Verificar archivo backend\\env.production');
    console.log('   2. Ejecutar: configure-production-env.bat');
    process.exit(1);
} else {
    console.log('✅ Todas las variables críticas están configuradas');
    console.log('');
    console.log('🚀 El sistema está listo para producción');
    process.exit(0);
}
"

if errorlevel 1 (
    echo [ERROR] Variables de entorno incompletas
    cd ..
    pause
    exit /b 1
)

cd ..

echo [SUCCESS] ✅ Variables de entorno verificadas correctamente

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
