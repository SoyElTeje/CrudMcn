# 🔧 Guía de Mantenimiento - AbmMcn

## 📋 Información General

Esta guía cubre las tareas de mantenimiento rutinarias, monitoreo, optimización y resolución de problemas del sistema AbmMcn en producción.

## 🎯 Tareas de Mantenimiento

### Diarias
- [ ] Verificar estado de la aplicación
- [ ] Revisar logs de errores
- [ ] Monitorear uso de recursos
- [ ] Verificar conectividad de base de datos

### Semanales
- [ ] Revisar logs de auditoría
- [ ] Verificar backups automáticos
- [ ] Analizar métricas de rendimiento
- [ ] Limpiar logs antiguos

### Mensuales
- [ ] Actualizar dependencias
- [ ] Revisar configuración de seguridad
- [ ] Optimizar base de datos
- [ ] Planificar actualizaciones

---

## 📊 Monitoreo Continuo

### 1. Health Checks Automatizados

```bash
#!/bin/bash
# health-check.sh

# Verificar estado de la aplicación
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)

if [ $response -ne 200 ]; then
    echo "ALERT: Application health check failed (HTTP $response)"
    # Enviar notificación
    # Reiniciar aplicación si es necesario
    pm2 restart abmmcn-backend
fi

# Verificar uso de memoria
memory_usage=$(pm2 jlist | jq '.[0].monit.memory')
if [ $memory_usage -gt 1000000000 ]; then  # 1GB
    echo "ALERT: High memory usage: $memory_usage bytes"
fi

# Verificar CPU
cpu_usage=$(pm2 jlist | jq '.[0].monit.cpu')
if [ $cpu_usage -gt 80 ]; then
    echo "ALERT: High CPU usage: $cpu_usage%"
fi
```

### 2. Monitoreo de Base de Datos

```sql
-- Verificar conexiones activas
SELECT 
    DB_NAME(dbid) as DatabaseName,
    COUNT(dbid) as NumberOfConnections,
    loginame as LoginName
FROM sys.sysprocesses 
WHERE dbid > 0 
GROUP BY dbid, loginame
ORDER BY NumberOfConnections DESC;

-- Verificar tamaño de base de datos
SELECT 
    name AS DatabaseName,
    size * 8 / 1024 AS SizeMB,
    max_size * 8 / 1024 AS MaxSizeMB
FROM sys.master_files
WHERE database_id = DB_ID('APPDATA');

-- Verificar índices fragmentados
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

### 3. Monitoreo de Logs

```bash
#!/bin/bash
# log-monitor.sh

# Verificar errores en los últimos 5 minutos
error_count=$(tail -n 1000 logs/error.log | grep "$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M')" | wc -l)

if [ $error_count -gt 10 ]; then
    echo "ALERT: High error rate: $error_count errors in last 5 minutes"
fi

# Verificar logs de autenticación
auth_failures=$(tail -n 1000 logs/combined.log | grep "auth" | grep "failed" | wc -l)

if [ $auth_failures -gt 5 ]; then
    echo "ALERT: Multiple authentication failures detected"
fi

# Verificar logs de base de datos
db_errors=$(tail -n 1000 logs/combined.log | grep "database" | grep "error" | wc -l)

if [ $db_errors -gt 0 ]; then
    echo "ALERT: Database errors detected: $db_errors"
fi
```

---

## 🧹 Limpieza y Optimización

### 1. Limpieza de Logs

```bash
#!/bin/bash
# log-cleanup.sh

# Comprimir logs antiguos (más de 7 días)
find logs/ -name "*.log" -mtime +7 -exec gzip {} \;

# Eliminar logs comprimidos antiguos (más de 30 días)
find logs/ -name "*.log.gz" -mtime +30 -delete

# Limpiar logs de PM2
pm2 flush

# Rotar logs de Winston
logrotate -f /etc/logrotate.d/abmmcn
```

### 2. Optimización de Base de Datos

```sql
-- Reorganizar índices fragmentados
DECLARE @sql NVARCHAR(MAX) = ''

SELECT @sql = @sql + 
    'ALTER INDEX ' + QUOTENAME(i.name) + ' ON ' + QUOTENAME(OBJECT_SCHEMA_NAME(ips.object_id)) + '.' + QUOTENAME(OBJECT_NAME(ips.object_id)) + 
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN ' REBUILD'
        ELSE ' REORGANIZE'
    END + ';' + CHAR(13)
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10

EXEC sp_executesql @sql

-- Actualizar estadísticas
EXEC sp_updatestats

-- Limpiar cache de procedimientos
DBCC FREEPROCCACHE

-- Limpiar cache de buffers
DBCC DROPCLEANBUFFERS
```

### 3. Limpieza de Archivos Temporales

```bash
#!/bin/bash
# cleanup-temp.sh

# Limpiar archivos temporales de Node.js
find /tmp -name "node-*" -mtime +1 -delete

# Limpiar archivos de upload temporal
find uploads/ -name "*.tmp" -mtime +1 -delete

# Limpiar archivos de Excel temporal
find temp/ -name "*.xlsx" -mtime +1 -delete

# Limpiar cache de npm
npm cache clean --force
```

---

## 🔄 Actualizaciones y Parches

### 1. Actualización de Dependencias

```bash
#!/bin/bash
# update-dependencies.sh

# Backup antes de actualizar
node deploy.js --backup

# Verificar dependencias desactualizadas
cd backend
npm outdated

# Actualizar dependencias menores
npm update

# Actualizar dependencias mayores (con cuidado)
npm install package@latest

# Verificar vulnerabilidades
npm audit
npm audit fix

# Ejecutar tests
npm test

# Si todo está bien, reiniciar
pm2 restart abmmcn-backend
```

### 2. Actualización de Código

```bash
#!/bin/bash
# update-code.sh

# Backup completo
node deploy.js --backup

# Obtener última versión
git fetch origin
git checkout main
git pull origin main

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Ejecutar tests
cd ../backend && npm test

# Build de producción
cd ../frontend && npm run build:production
cd ../backend && npm run build

# Deploy con zero-downtime
pm2 reload abmmcn-backend

# Verificar estado
sleep 10
curl -f http://localhost:3001/api/health || exit 1
```

### 3. Rollback de Emergencia

```bash
#!/bin/bash
# emergency-rollback.sh

# Detener aplicación
pm2 stop abmmcn-backend

# Rollback de código
git checkout HEAD~1

# Rollback de base de datos (si es necesario)
# sqlcmd -S "localhost" -Q "RESTORE DATABASE APPDATA FROM DISK = 'C:\Backups\APPDATA_previous.bak'"

# Reinstalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Build
cd ../frontend && npm run build
cd ../backend && npm run build

# Reiniciar
pm2 start ecosystem.config.js

# Verificar
sleep 10
curl -f http://localhost:3001/api/health || exit 1
```

---

## 🚨 Resolución de Problemas

### 1. Problemas de Rendimiento

#### Alta CPU
```bash
# Identificar procesos que consumen CPU
top -p $(pgrep -f "node.*server.js")

# Analizar stack trace
pm2 logs --lines 100 | grep -A 10 -B 10 "high cpu"

# Verificar queries lentas
tail -f logs/combined.log | grep "slow query"
```

#### Alta Memoria
```bash
# Verificar uso de memoria por proceso
pm2 monit

# Analizar heap dump
node --inspect server.js
# Abrir chrome://inspect en el navegador

# Verificar memory leaks
node --expose-gc --max-old-space-size=4096 server.js
```

#### Conexiones de Base de Datos
```sql
-- Verificar conexiones activas
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    cpu_time,
    memory_usage,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
ORDER BY cpu_time DESC;

-- Verificar queries bloqueadas
SELECT 
    blocking_session_id,
    session_id,
    wait_type,
    wait_time,
    wait_resource
FROM sys.dm_exec_requests
WHERE blocking_session_id <> 0;
```

### 2. Problemas de Autenticación

```bash
# Verificar configuración JWT
grep JWT_SECRET backend/.env

# Verificar logs de autenticación
tail -f logs/combined.log | grep -i auth

# Probar autenticación manualmente
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Problemas de Base de Datos

```bash
# Verificar conectividad
node -e "require('./backend/config/database').testConnection()"

# Verificar logs de base de datos
tail -f logs/error.log | grep -i database

# Verificar espacio en disco
df -h

# Verificar logs de SQL Server
tail -f /var/opt/mssql/log/errorlog
```

---

## 📈 Optimización de Rendimiento

### 1. Optimización de Base de Datos

```sql
-- Crear índices para queries frecuentes
CREATE INDEX IX_user_permissions_user_database 
ON user_permissions (user_id, database_name);

CREATE INDEX IX_audit_logs_timestamp 
ON audit_logs (timestamp);

-- Optimizar queries lentas
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Ejecutar query problemática
-- Analizar resultados y optimizar

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
```

### 2. Optimización de Aplicación

```javascript
// Configuración de pool de conexiones optimizada
const poolConfig = {
  max: 20,                    // Aumentar según carga
  min: 5,                     // Mantener conexiones activas
  idleTimeoutMillis: 30000,   // Reducir timeout
  acquireTimeoutMillis: 60000, // Aumentar timeout de adquisición
  createTimeoutMillis: 30000,  // Timeout de creación
  destroyTimeoutMillis: 5000,  // Timeout de destrucción
  reapIntervalMillis: 1000,    // Intervalo de limpieza
  createRetryIntervalMillis: 200 // Intervalo de reintento
};

// Configuración de cache
const cacheConfig = {
  ttl: 300, // 5 minutos
  max: 1000 // Máximo 1000 entradas
};
```

### 3. Optimización de Frontend

```javascript
// Lazy loading de componentes
const LazyComponent = React.lazy(() => import('./Component'));

// Memoización de componentes
const MemoizedComponent = React.memo(Component);

// Optimización de bundle
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

---

## 🔒 Mantenimiento de Seguridad

### 1. Auditoría de Seguridad

```bash
#!/bin/bash
# security-audit.sh

# Verificar vulnerabilidades en dependencias
cd backend && npm audit
cd ../frontend && npm audit

# Verificar permisos de archivos
find . -name "*.env" -exec ls -la {} \;
find . -name "*.key" -exec ls -la {} \;

# Verificar logs de seguridad
grep -i "security\|auth\|permission" logs/combined.log | tail -20

# Verificar configuración de firewall
netstat -tulpn | grep :3001
```

### 2. Rotación de Secretos

```bash
#!/bin/bash
# rotate-secrets.sh

# Generar nuevo JWT secret
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Actualizar .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" backend/.env

# Reiniciar aplicación
pm2 restart abmmcn-backend

# Notificar a usuarios (todos necesitarán re-login)
echo "JWT secret rotated. Users will need to re-login."
```

### 3. Backup de Seguridad

```bash
#!/bin/bash
# security-backup.sh

# Backup de configuración sensible
tar -czf security-backup-$(date +%Y%m%d).tar.gz \
  backend/.env \
  backend/ecosystem.config.js \
  logs/audit.log

# Encriptar backup
gpg --symmetric --cipher-algo AES256 security-backup-$(date +%Y%m%d).tar.gz

# Eliminar backup sin encriptar
rm security-backup-$(date +%Y%m%d).tar.gz
```

---

## 📊 Reportes y Métricas

### 1. Reporte Diario

```bash
#!/bin/bash
# daily-report.sh

echo "=== AbmMcn Daily Report - $(date) ==="
echo

# Estado de la aplicación
echo "Application Status:"
pm2 status
echo

# Métricas de rendimiento
echo "Performance Metrics:"
curl -s http://localhost:3001/api/health/metrics | jq .
echo

# Logs de errores del día
echo "Errors Today:"
grep "$(date '+%Y-%m-%d')" logs/error.log | wc -l
echo

# Uso de recursos
echo "Resource Usage:"
pm2 jlist | jq '.[0].monit'
echo

# Estado de base de datos
echo "Database Status:"
curl -s -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3001/api/health/pools | jq .
```

### 2. Reporte Semanal

```bash
#!/bin/bash
# weekly-report.sh

echo "=== AbmMcn Weekly Report - $(date) ==="
echo

# Estadísticas de uso
echo "Usage Statistics:"
grep "login" logs/combined.log | grep "$(date -d '7 days ago' '+%Y-%m-%d')" | wc -l
echo

# Errores de la semana
echo "Weekly Errors:"
find logs/ -name "*.log" -newermt "7 days ago" -exec grep -l "ERROR" {} \; | wc -l
echo

# Tamaño de logs
echo "Log Sizes:"
du -sh logs/
echo

# Espacio en disco
echo "Disk Usage:"
df -h
echo

# Backup status
echo "Backup Status:"
ls -la /backups/ | tail -5
```

---

## 📚 Documentación de Cambios

### 1. Log de Cambios

```markdown
# CHANGELOG.md

## [1.0.1] - 2024-12-05
### Fixed
- Corregido problema de memoria en pool de conexiones
- Mejorado manejo de errores en autenticación

### Changed
- Optimizado rendimiento de queries de permisos
- Actualizado logging de auditoría

## [1.0.0] - 2024-12-01
### Added
- Sistema completo de ABM
- Autenticación JWT
- Permisos granulares
- Importación/Exportación Excel
```

### 2. Documentación de Incidentes

```markdown
# INCIDENTS.md

## Incident #001 - 2024-12-05
**Severity**: High
**Duration**: 2 hours
**Root Cause**: Memory leak in connection pool
**Resolution**: Restarted application and optimized pool configuration
**Prevention**: Added monitoring for memory usage

## Incident #002 - 2024-12-03
**Severity**: Medium
**Duration**: 30 minutes
**Root Cause**: Database connection timeout
**Resolution**: Increased connection timeout and retry logic
**Prevention**: Added connection health checks
```

---

## 🔧 Herramientas de Mantenimiento

### 1. Scripts de Utilidad

```bash
# Verificar estado completo del sistema
./scripts/system-check.sh

# Limpiar sistema
./scripts/cleanup.sh

# Backup completo
./scripts/backup.sh

# Restaurar desde backup
./scripts/restore.sh backup-file.tar.gz

# Actualizar sistema
./scripts/update.sh

# Monitoreo en tiempo real
./scripts/monitor.sh
```

### 2. Configuración de Cron

```bash
# Crontab para tareas automáticas
# Limpiar logs diariamente a las 2 AM
0 2 * * * /path/to/scripts/log-cleanup.sh

# Backup diario a las 3 AM
0 3 * * * /path/to/scripts/backup.sh

# Health check cada 5 minutos
*/5 * * * * /path/to/scripts/health-check.sh

# Reporte diario a las 8 AM
0 8 * * * /path/to/scripts/daily-report.sh

# Reporte semanal los lunes a las 9 AM
0 9 * * 1 /path/to/scripts/weekly-report.sh
```

---

## 📞 Contacto y Soporte

### Escalación de Problemas

1. **Nivel 1**: Problemas básicos (logs, reinicio)
2. **Nivel 2**: Problemas de configuración (base de datos, red)
3. **Nivel 3**: Problemas de código (desarrolladores)

### Contactos

- **Administrador del Sistema**: admin@company.com
- **Desarrollador Principal**: dev@company.com
- **DBA**: dba@company.com

### Recursos

- **Documentación**: `/docs/`
- **Logs**: `/logs/`
- **Backups**: `/backups/`
- **Scripts**: `/scripts/`

---

_Última actualización: Diciembre 2024_  
_Versión: 1.0.0_
