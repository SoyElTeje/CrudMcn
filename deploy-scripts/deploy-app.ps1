# Script para desplegar la aplicación AbmMcn
# Ejecutar como Administrador

param(
    [string]$RepositoryUrl = "",
    [string]$Domain = "tu-dominio.com",
    [string]$JwtSecret = ""
)

Write-Host "🚀 Desplegando aplicación AbmMcn..." -ForegroundColor Green

# Verificar parámetros
if ([string]::IsNullOrEmpty($RepositoryUrl)) {
    $RepositoryUrl = Read-Host "Ingresa la URL del repositorio Git"
}

if ([string]::IsNullOrEmpty($Domain)) {
    $Domain = Read-Host "Ingresa el dominio de producción"
}

if ([string]::IsNullOrEmpty($JwtSecret)) {
    $JwtSecret = Read-Host "Ingresa el JWT_SECRET para producción"
}

# Configuración
$appDir = "C:\apps\AbmMcn"
$backupDir = "C:\backups"

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   Repositorio: $RepositoryUrl" -ForegroundColor White
Write-Host "   Dominio: $Domain" -ForegroundColor White
Write-Host "   Directorio: $appDir" -ForegroundColor White

# Crear backup si existe instalación previa
if (Test-Path $appDir) {
    Write-Host "📦 Creando backup de instalación previa..." -ForegroundColor Yellow
    $date = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$backupDir\code\AbmMcn_backup_$date.zip"
    
    try {
        Compress-Archive -Path $appDir -DestinationPath $backupFile -Force
        Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ No se pudo crear backup: $_" -ForegroundColor Yellow
    }
}

# Detener aplicación si está corriendo
Write-Host "🛑 Deteniendo aplicación si está corriendo..." -ForegroundColor Yellow
try {
    pm2 stop abmmcn-backend 2>$null
    pm2 delete abmmcn-backend 2>$null
    Write-Host "✅ Aplicación detenida" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No había aplicación corriendo" -ForegroundColor Cyan
}

# Limpiar directorio de aplicación
if (Test-Path $appDir) {
    Write-Host "🧹 Limpiando directorio de aplicación..." -ForegroundColor Yellow
    Remove-Item "$appDir\*" -Recurse -Force
}

# Clonar repositorio
Write-Host "📥 Clonando repositorio..." -ForegroundColor Yellow
try {
    Set-Location $appDir
    git clone $RepositoryUrl .
    Write-Host "✅ Repositorio clonado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error clonando repositorio: $_" -ForegroundColor Red
    exit 1
}

# Configurar variables de entorno
Write-Host "⚙️ Configurando variables de entorno..." -ForegroundColor Yellow
$envContent = @"
# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_USER=appuser
DB_PASSWORD=TuContraseñaSegura123!
DB_DATABASE=APPDATA

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://$Domain

# JWT Configuration
JWT_SECRET=$JwtSecret
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info
"@

$envContent | Out-File -FilePath "$appDir\backend\.env" -Encoding UTF8
Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green

# Instalar dependencias del backend
Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
try {
    Set-Location "$appDir\backend"
    npm install --production
    Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando dependencias del backend: $_" -ForegroundColor Red
    exit 1
}

# Instalar dependencias del frontend
Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Yellow
try {
    Set-Location "$appDir\frontend"
    npm install --production
    Write-Host "✅ Dependencias del frontend instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando dependencias del frontend: $_" -ForegroundColor Red
    exit 1
}

# Construir frontend
Write-Host "🔨 Construyendo frontend..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Frontend construido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error construyendo frontend: $_" -ForegroundColor Red
    exit 1
}

# Crear archivo de configuración PM2
Write-Host "⚙️ Configurando PM2..." -ForegroundColor Yellow
$pm2Config = @"
module.exports = {
  apps: [{
    name: 'abmmcn-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
"@

$pm2Config | Out-File -FilePath "$appDir\ecosystem.config.js" -Encoding UTF8
Write-Host "✅ Configuración PM2 creada" -ForegroundColor Green

# Crear directorio de logs si no existe
if (!(Test-Path "$appDir\logs")) {
    New-Item -ItemType Directory -Path "$appDir\logs" -Force
}

# Iniciar aplicación con PM2
Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Yellow
try {
    Set-Location $appDir
    pm2 start ecosystem.config.js
    pm2 save
    Write-Host "✅ Aplicación iniciada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error iniciando aplicación: $_" -ForegroundColor Red
    exit 1
}

# Configurar inicio automático
Write-Host "⚙️ Configurando inicio automático..." -ForegroundColor Yellow
try {
    pm2 startup
    Write-Host "✅ Inicio automático configurado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se pudo configurar inicio automático: $_" -ForegroundColor Yellow
}

# Verificar estado de la aplicación
Write-Host "🔍 Verificando estado de la aplicación..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $status = pm2 status
    Write-Host "✅ Estado de la aplicación:" -ForegroundColor Green
    Write-Host $status -ForegroundColor White
} catch {
    Write-Host "❌ Error verificando estado: $_" -ForegroundColor Red
}

# Configurar firewall
Write-Host "🔥 Configurando firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "AbmMcn Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Regla de firewall creada" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se pudo crear regla de firewall: $_" -ForegroundColor Yellow
}

Write-Host "✅ Despliegue completado exitosamente!" -ForegroundColor Green
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Configurar IIS como proxy reverso (opcional)" -ForegroundColor White
Write-Host "   2. Configurar certificado SSL" -ForegroundColor White
Write-Host "   3. Crear usuario admin inicial" -ForegroundColor White
Write-Host "   4. Probar la aplicación" -ForegroundColor White

Write-Host "🌐 La aplicación debería estar disponible en: http://localhost:3001" -ForegroundColor Green
