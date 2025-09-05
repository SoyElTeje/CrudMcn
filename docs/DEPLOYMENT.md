# 🚀 Guía de Despliegue - AbmMcn

## 📋 Información General

Esta guía cubre el despliegue del sistema AbmMcn en diferentes entornos, desde desarrollo hasta producción en servidores Windows con acceso por intranet.

## 🎯 Entornos Soportados

- **Development**: Desarrollo local
- **Staging**: Pruebas pre-producción
- **Production**: Producción en servidor Windows

## 📋 Prerrequisitos

### Servidor de Producción
- **OS**: Windows Server 2019/2022
- **Node.js**: 18.x o superior
- **SQL Server**: 2019 o superior
- **PM2**: Para gestión de procesos
- **Git**: Para deployment
- **Acceso**: VPN para intranet

### Herramientas de Desarrollo
- **Node.js**: 18.x o superior
- **Git**: Para control de versiones
- **Docker**: Para SQL Server local (opcional)

---

## 🛠️ Configuración Inicial

### 1. Preparar el Servidor

```powershell
# Instalar Node.js (como administrador)
# Descargar desde https://nodejs.org/
# Verificar instalación
node --version
npm --version

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Git (si no está instalado)
# Descargar desde https://git-scm.com/
git --version
```

### 2. Configurar Variables de Entorno

```bash
# Clonar el repositorio
git clone <repository-url>
cd AbmMcn

# Configurar entorno de producción
node setup-env.js production
```

### 3. Configurar Base de Datos

```sql
-- Crear base de datos principal
CREATE DATABASE APPDATA;

-- Crear usuario para la aplicación
CREATE LOGIN abmmcn_user WITH PASSWORD = 'StrongPassword123!';
USE APPDATA;
CREATE USER abmmcn_user FOR LOGIN abmmcn_user;
ALTER ROLE db_owner ADD MEMBER abmmcn_user;

-- Crear tablas necesarias
-- (Ejecutar scripts de setup)
```

---

## 🚀 Despliegue Automatizado

### 1. Script de Despliegue Principal

```bash
# Ejecutar deployment completo
node deploy.js

# Con opciones específicas
node deploy.js --env production --skip-tests
node deploy.js --env staging --backup
```

### 2. Configuración de PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Verificar estado
pm2 status
pm2 logs

# Configurar inicio automático
pm2 startup
pm2 save
```

### 3. Scripts de Gestión

```bash
# Gestión de PM2
node pm2-manager.js start
node pm2-manager.js stop
node pm2-manager.js restart
node pm2-manager.js status

# Monitoreo
node monitor.js
```

---

## 🔧 Configuración por Entorno

### Development

```bash
# Configurar entorno de desarrollo
node setup-env.js development

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Iniciar en modo desarrollo
cd backend && npm run dev
cd frontend && npm run dev
```

**Variables de entorno:**
```env
NODE_ENV=development
PORT=3001
DB_SERVER=localhost
DB_DATABASE=APPDATA_DEV
LOG_LEVEL=debug
```

### Staging

```bash
# Configurar entorno de staging
node setup-env.js staging

# Build y deploy
cd frontend && npm run build
cd ../backend && npm run build

# Iniciar con PM2
pm2 start ecosystem.config.js --env staging
```

**Variables de entorno:**
```env
NODE_ENV=staging
PORT=3001
DB_SERVER=staging-db-server
DB_DATABASE=APPDATA_STAGING
LOG_LEVEL=info
```

### Production

```bash
# Configurar entorno de producción
node setup-env.js production

# Build optimizado
cd frontend && npm run build:production
cd ../backend && npm run build

# Deploy con PM2
pm2 start ecosystem.config.js --env production
```

**Variables de entorno:**
```env
NODE_ENV=production
PORT=3001
DB_SERVER=production-db-server
DB_DATABASE=APPDATA
LOG_LEVEL=warn
JWT_SECRET=<strong-secret-key>
```

---

## 📊 Configuración de PM2

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'abmmcn-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Configuración de logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de reinicio
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configuración de monitoreo
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // Configuración de cluster
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Variables de entorno específicas
    env_file: './.env'
  }]
};
```

### Comandos PM2 Útiles

```bash
# Gestión básica
pm2 start ecosystem.config.js
pm2 stop ecosystem.config.js
pm2 restart ecosystem.config.js
pm2 delete ecosystem.config.js

# Monitoreo
pm2 status
pm2 logs
pm2 logs --lines 100
pm2 monit

# Gestión de procesos
pm2 reload all
pm2 gracefulReload all
pm2 stop all
pm2 delete all

# Configuración
pm2 startup
pm2 save
pm2 unstartup
```

---

## 🔒 Configuración de Seguridad

### 1. Firewall

```powershell
# Configurar reglas de firewall (Windows)
New-NetFirewallRule -DisplayName "AbmMcn Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "AbmMcn Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 2. Certificados SSL (Opcional)

```bash
# Generar certificado autofirmado para desarrollo
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurar HTTPS en el servidor
# (Ver configuración en server.js)
```

### 3. Variables de Entorno Seguras

```bash
# Generar JWT secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Configurar en .env
JWT_SECRET=<generated-secret>
DB_PASSWORD=<strong-db-password>
```

---

## 📈 Monitoreo y Logs

### 1. Configuración de Logs

```javascript
// Configuración de Winston en config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'abmmcn-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 2. Health Checks

```bash
# Verificar estado de la aplicación
curl http://localhost:3001/api/health

# Verificar estado detallado
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/health/detailed

# Verificar pools de base de datos
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/health/pools
```

### 3. Monitoreo de Recursos

```bash
# Monitoreo con PM2
pm2 monit

# Monitoreo de logs en tiempo real
pm2 logs --lines 0

# Monitoreo de métricas
node monitor.js
```

---

## 🔄 Backup y Recuperación

### 1. Backup de Base de Datos

```sql
-- Backup completo
BACKUP DATABASE APPDATA TO DISK = 'C:\Backups\APPDATA_Full.bak'

-- Backup diferencial
BACKUP DATABASE APPDATA TO DISK = 'C:\Backups\APPDATA_Diff.bak' WITH DIFFERENTIAL

-- Backup de transacciones
BACKUP LOG APPDATA TO DISK = 'C:\Backups\APPDATA_Log.trn'
```

### 2. Script de Backup Automatizado

```powershell
# backup-database.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "C:\Backups\APPDATA_$timestamp.bak"

sqlcmd -S "localhost" -d "APPDATA" -Q "BACKUP DATABASE APPDATA TO DISK = '$backupPath'"

# Comprimir backup
Compress-Archive -Path $backupPath -DestinationPath "C:\Backups\APPDATA_$timestamp.zip"

# Limpiar backups antiguos (mantener últimos 7 días)
Get-ChildItem "C:\Backups\*.zip" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
```

### 3. Backup de Configuración

```bash
# Backup de archivos de configuración
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  backend/.env \
  backend/ecosystem.config.js \
  frontend/.env \
  logs/

# Backup de logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

---

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```bash
# Verificar configuración
cat backend/.env | grep DB_

# Probar conexión
node -e "require('./backend/config/database').testConnection()"

# Verificar logs
tail -f logs/error.log | grep -i database
```

#### 2. Error de Permisos

```bash
# Verificar permisos de archivos
ls -la backend/
ls -la logs/

# Corregir permisos
chmod 755 backend/
chmod 644 backend/.env
chmod 755 logs/
```

#### 3. Error de PM2

```bash
# Limpiar PM2
pm2 delete all
pm2 kill

# Reiniciar PM2
pm2 start ecosystem.config.js

# Verificar logs
pm2 logs --lines 50
```

#### 4. Error de Puerto en Uso

```bash
# Verificar puertos en uso
netstat -ano | findstr :3001

# Matar proceso
taskkill /PID <process-id> /F

# Cambiar puerto en .env
echo "PORT=3002" >> backend/.env
```

### Logs de Debugging

```bash
# Habilitar logs detallados
export LOG_LEVEL=debug
pm2 restart all

# Ver logs en tiempo real
pm2 logs --lines 0

# Filtrar logs por nivel
pm2 logs | grep ERROR
pm2 logs | grep WARN
```

---

## 🔄 Actualizaciones y Rollback

### 1. Actualización de Código

```bash
# Backup antes de actualizar
node deploy.js --backup

# Actualizar código
git pull origin main

# Instalar nuevas dependencias
cd backend && npm install
cd ../frontend && npm install

# Build y deploy
npm run build
pm2 restart all
```

### 2. Rollback

```bash
# Rollback a versión anterior
git checkout <previous-commit>
pm2 restart all

# Restaurar backup de base de datos
sqlcmd -S "localhost" -Q "RESTORE DATABASE APPDATA FROM DISK = 'C:\Backups\APPDATA_previous.bak'"
```

### 3. Zero-Downtime Deployment

```bash
# Deployment sin interrupciones
pm2 reload all

# Verificar estado
pm2 status
curl http://localhost:3001/api/health
```

---

## 📊 Métricas de Producción

### 1. Métricas de Aplicación

```bash
# Obtener métricas
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/health/metrics

# Monitoreo continuo
watch -n 5 'curl -s http://localhost:3001/api/health | jq .'
```

### 2. Métricas del Sistema

```powershell
# CPU y Memoria
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\Available MBytes"

# Disco
Get-Counter "\LogicalDisk(C:)\% Free Space"
```

### 3. Alertas

```bash
# Configurar alertas simples
# (Ver monitor.js para implementación completa)

# Alerta de CPU alta
if [ $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1) -gt 80 ]; then
  echo "ALERT: High CPU usage"
fi

# Alerta de memoria baja
if [ $(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}') -gt 90 ]; then
  echo "ALERT: High memory usage"
fi
```

---

## 📚 Referencias

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [SQL Server Backup and Restore](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/)
- [Windows Server Security](https://docs.microsoft.com/en-us/windows-server/security/)

---

_Última actualización: Diciembre 2024_  
_Versión: 1.0.0_
