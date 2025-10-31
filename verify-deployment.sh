#!/bin/bash

# ===========================================
# SCRIPT DE VERIFICACIÓN POST-DESPLIEGUE
# ===========================================

set -e

echo "🔍 VERIFICACIÓN POST-DESPLIEGUE - AbmMcn"
echo "========================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Función para hacer petición HTTP
check_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    log "Verificando $description: $url"
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            success "✅ $description: HTTP $response"
            return 0
        else
            error "❌ $description: Esperado HTTP $expected_status, recibido HTTP $response"
            return 1
        fi
    else
        error "❌ $description: No se pudo conectar"
        return 1
    fi
}

# Verificar estado de PM2
log "🔍 Verificando estado de PM2..."

if ! pm2 list | grep -q "abmmcn-backend.*online"; then
    error "Backend no está corriendo"
fi

if ! pm2 list | grep -q "abmmcn-frontend.*online"; then
    error "Frontend no está corriendo"
fi

success "✅ PM2: Aplicaciones corriendo"

# Verificar puertos
log "🔍 Verificando puertos..."

if ! netstat -tuln | grep -q ":3001"; then
    error "Puerto 3001 (backend) no está abierto"
fi

if ! netstat -tuln | grep -q ":5173"; then
    error "Puerto 5173 (frontend) no está abierto"
fi

success "✅ Puertos: 3001 y 5173 abiertos"

# Verificar endpoints del backend
log "🔍 Verificando endpoints del backend..."

# Health check
check_endpoint "http://localhost:3001/health" "200" "Health Check"

# API status
check_endpoint "http://localhost:3001/api/status" "200" "API Status"

# Verificar endpoints del frontend
log "🔍 Verificando endpoints del frontend..."

# Frontend principal
check_endpoint "http://localhost:5173" "200" "Frontend Principal"

# Verificar base de datos
log "🔍 Verificando conexión a base de datos..."

cd backend
if node -e "
const { getPool } = require('./db');
require('dotenv').config();

async function testDB() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 as test');
    if (result.recordset[0].test === 1) {
      console.log('✅ Base de datos: Conexión exitosa');
      process.exit(0);
    } else {
      console.log('❌ Base de datos: Respuesta inesperada');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Base de datos: Error de conexión');
    process.exit(1);
  }
}

testDB();
"; then
    success "✅ Base de datos: Conexión verificada"
else
    error "Base de datos: Error de conexión"
fi
cd ..

# Verificar archivos de log
log "🔍 Verificando archivos de log..."

if [ ! -d "logs" ]; then
    warning "Directorio logs no existe"
else
    if [ -f "logs/backend-combined.log" ]; then
        success "✅ Log backend existe"
    else
        warning "Log backend no encontrado"
    fi
    
    if [ -f "logs/frontend-combined.log" ]; then
        success "✅ Log frontend existe"
    else
        warning "Log frontend no encontrado"
    fi
fi

# Verificar directorio de uploads
log "🔍 Verificando directorio de uploads..."

if [ ! -d "uploads" ]; then
    warning "Directorio uploads no existe"
else
    success "✅ Directorio uploads existe"
fi

# Verificar memoria y CPU
log "🔍 Verificando recursos del sistema..."

# Mostrar uso de memoria de PM2
pm2 list

# Verificar espacio en disco
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    warning "Uso de disco alto: ${DISK_USAGE}%"
else
    success "✅ Uso de disco: ${DISK_USAGE}%"
fi

# Resumen final
echo ""
echo "🎉 VERIFICACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "📊 Estado de las aplicaciones:"
pm2 list
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:           pm2 logs"
echo "   Ver estado:         pm2 status"
echo "   Monitoreo:          pm2 monit"
echo "   Reiniciar:          pm2 restart all"
echo ""

success "🎉 ¡Verificación completada exitosamente!"
















