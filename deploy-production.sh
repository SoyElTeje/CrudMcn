#!/bin/bash

# ===========================================
# SCRIPT DE DESPLIEGUE A PRODUCCIÓN - AbmMcn
# ===========================================

set -e  # Salir si hay algún error

echo "🚀 INICIANDO DESPLIEGUE A PRODUCCIÓN - AbmMcn"
echo "=============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecutar desde el directorio raíz del proyecto."
fi

# Paso 1: Verificar dependencias del sistema
log "🔍 Verificando dependencias del sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Instalar Node.js 18+ antes de continuar."
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versión $NODE_VERSION detectada. Se requiere Node.js 18 o superior."
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    warning "PM2 no está instalado. Instalando PM2 globalmente..."
    npm install -g pm2
fi

# Verificar Git
if ! command -v git &> /dev/null; then
    error "Git no está instalado."
fi

success "✅ Dependencias del sistema verificadas"

# Paso 2: Verificar configuración de producción
log "🔧 Verificando configuración de producción..."

if [ ! -f "backend/env.production" ]; then
    error "Archivo backend/env.production no encontrado. Configurar variables de entorno."
fi

if [ ! -f "ecosystem.config.js" ]; then
    error "Archivo ecosystem.config.js no encontrado."
fi

success "✅ Configuración de producción verificada"

# Paso 3: Crear directorios necesarios
log "📁 Creando directorios necesarios..."

mkdir -p logs
mkdir -p uploads
mkdir -p backend/uploads
mkdir -p frontend/dist

success "✅ Directorios creados"

# Paso 4: Instalar dependencias
log "📦 Instalando dependencias..."

# Backend
log "Instalando dependencias del backend..."
cd backend
npm ci --production
cd ..

# Frontend
log "Instalando dependencias del frontend..."
cd frontend
npm ci
cd ..

success "✅ Dependencias instaladas"

# Paso 5: Compilar frontend
log "🏗️ Compilando frontend para producción..."

cd frontend
npm run build
cd ..

if [ ! -d "frontend/dist" ] || [ -z "$(ls -A frontend/dist)" ]; then
    error "La compilación del frontend falló o el directorio dist está vacío."
fi

success "✅ Frontend compilado"

# Paso 6: Verificar base de datos
log "🗄️ Verificando conexión a base de datos..."

cd backend
# Copiar archivo de producción
cp env.production .env

# Verificar conexión (esto ejecutará el script de verificación)
if ! node -e "
const { getPool } = require('./db');
require('dotenv').config();

async function testConnection() {
  try {
    const pool = await getPool();
    console.log('✅ Conexión a base de datos exitosa');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
}

testConnection();
"; then
    error "No se pudo conectar a la base de datos. Verificar configuración."
fi

cd ..

success "✅ Conexión a base de datos verificada"

# Paso 7: Configurar PM2
log "⚙️ Configurando PM2..."

# Detener procesos existentes si están corriendo
pm2 delete all 2>/dev/null || true

# Configurar PM2 para que se inicie automáticamente
pm2 startup 2>/dev/null || warning "No se pudo configurar PM2 startup automático"

success "✅ PM2 configurado"

# Paso 8: Iniciar aplicaciones con PM2
log "🚀 Iniciando aplicaciones con PM2..."

# Iniciar con configuración de producción
pm2 start ecosystem.config.js --env production

# Guardar configuración de PM2
pm2 save

success "✅ Aplicaciones iniciadas con PM2"

# Paso 9: Verificar estado de las aplicaciones
log "🔍 Verificando estado de las aplicaciones..."

sleep 5  # Esperar a que las aplicaciones se inicien

# Verificar backend
if ! pm2 list | grep -q "abmmcn-backend.*online"; then
    error "Backend no está corriendo correctamente"
fi

# Verificar frontend
if ! pm2 list | grep -q "abmmcn-frontend.*online"; then
    error "Frontend no está corriendo correctamente"
fi

success "✅ Aplicaciones verificadas y funcionando"

# Paso 10: Mostrar información del despliegue
log "📊 Información del despliegue:"

echo ""
echo "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE"
echo "======================================"
echo ""
echo "📱 Aplicaciones corriendo:"
pm2 list
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:           pm2 logs"
echo "   Ver estado:         pm2 status"
echo "   Reiniciar:          pm2 restart all"
echo "   Detener:            pm2 stop all"
echo "   Monitoreo:          pm2 monit"
echo ""
echo "📁 Archivos de log:"
echo "   Backend:  logs/backend-*.log"
echo "   Frontend: logs/frontend-*.log"
echo ""

success "🎉 ¡Despliegue a producción completado exitosamente!"

# Mostrar logs recientes
log "📋 Mostrando logs recientes (últimas 10 líneas):"
pm2 logs --lines 10







