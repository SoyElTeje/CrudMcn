# Script para instalar dependencias en Windows Server
# Ejecutar como Administrador

Write-Host "🚀 Instalando dependencias para AbmMcn..." -ForegroundColor Green

# Verificar si Node.js está instalado
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Por favor instalar desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar si npm está instalado
Write-Host "📋 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar PM2 globalmente
Write-Host "📦 Instalando PM2..." -ForegroundColor Yellow
try {
    npm install -g pm2
    Write-Host "✅ PM2 instalado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando PM2" -ForegroundColor Red
    exit 1
}

# Verificar si Git está instalado
Write-Host "📋 Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git no encontrado. Por favor instalar desde https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Crear directorio de la aplicación si no existe
$appDir = "C:\apps\AbmMcn"
if (!(Test-Path $appDir)) {
    Write-Host "📁 Creando directorio de aplicación..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $appDir -Force
    Write-Host "✅ Directorio creado: $appDir" -ForegroundColor Green
}

# Crear directorio de logs
$logsDir = "$appDir\logs"
if (!(Test-Path $logsDir)) {
    Write-Host "📁 Creando directorio de logs..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $logsDir -Force
    Write-Host "✅ Directorio de logs creado: $logsDir" -ForegroundColor Green
}

# Crear directorio de backups
$backupDir = "C:\backups"
if (!(Test-Path $backupDir)) {
    Write-Host "📁 Creando directorio de backups..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backupDir -Force
    New-Item -ItemType Directory -Path "$backupDir\code" -Force
    New-Item -ItemType Directory -Path "$backupDir\database" -Force
    Write-Host "✅ Directorio de backups creado: $backupDir" -ForegroundColor Green
}

Write-Host "✅ Todas las dependencias instaladas correctamente!" -ForegroundColor Green
Write-Host "📝 Próximo paso: Clonar el repositorio y configurar variables de entorno" -ForegroundColor Cyan
