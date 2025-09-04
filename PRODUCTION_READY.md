# 🚀 ABMMCN - LISTO PARA PRODUCCIÓN

## 📋 Resumen del Proyecto

**AbmMcn** es un sistema completo de Alta, Baja y Modificación (ABM) web para gestionar múltiples bases de datos SQL Server con interfaz moderna y sistema de permisos granular.

### 🎯 Funcionalidades Principales

- ✅ **Autenticación JWT** con gestión de usuarios
- ✅ **Sistema de permisos granular** por tabla y base de datos
- ✅ **Operaciones CRUD completas** (Crear, Leer, Actualizar, Eliminar)
- ✅ **Importación/Exportación Excel** con validación
- ✅ **Sistema de logs** de auditoría completa
- ✅ **Filtros avanzados** y búsqueda
- ✅ **Interfaz responsive** moderna con TailwindCSS
- ✅ **Modales de confirmación** para operaciones críticas

## 🏗️ Arquitectura

```
AbmMcn/
├── backend/                 # Servidor Node.js + Express
│   ├── config/             # Configuraciones
│   ├── routes/             # Rutas de la API
│   ├── services/           # Lógica de negocio
│   ├── middleware/         # Middlewares de autenticación
│   └── utils/              # Utilidades
├── frontend/               # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/      # Contextos de estado
│   │   ├── hooks/          # Hooks personalizados
│   │   └── config/         # Configuraciones
├── scripts/                # Scripts de utilidad
├── deploy-scripts/         # Scripts de despliegue PowerShell
├── nginx/                  # Configuración de nginx
└── backups/               # Directorio de backups
```

## 🔧 Configuración para Producción

### 1. Variables de Entorno (.env)

```env
# Database Configuration
DB_SERVER=TU_SERVIDOR_SQL_PRODUCCION
DB_PORT=1433
DB_USER=app_user
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_DATABASE=APPDATA

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://tu-dominio.com,http://localhost:5173

# JWT Configuration
JWT_SECRET=clave_super_secreta_y_muy_larga_para_produccion_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info

# URLs para health check
BACKEND_URL=https://tu-dominio.com/api
FRONTEND_URL=https://tu-dominio.com
```

### 2. Configuración de Base de Datos

#### 2.1 Crear usuario de aplicación

```sql
-- Ejecutar en SQL Server Management Studio
CREATE LOGIN app_user WITH PASSWORD = 'TU_PASSWORD_SEGURO_AQUI';
CREATE USER app_user FOR LOGIN app_user;
```

#### 2.2 Crear base de datos APPDATA

```sql
CREATE DATABASE APPDATA;
GO
USE APPDATA;
```

#### 2.3 Ejecutar script de configuración

```bash
# Ejecutar el script SQL
sqlcmd -S TU_SERVIDOR -U sa -P SA_PASSWORD -i setup_production_database.sql
```

### 3. Instalación de Dependencias

#### 3.1 Backend

```bash
cd backend
npm install
npm install -g pm2
```

#### 3.2 Frontend

```bash
cd frontend
npm install
npm run build
```

## 🚀 Despliegue

### Opción 1: Despliegue Automático (Recomendado)

```bash
# Ejecutar script de PowerShell como Administrador
.\deploy-scripts\deploy-app.ps1
```

### Opción 2: Despliegue Manual

#### 1. Verificar configuración

```bash
node scripts/verify-production.js
```

#### 2. Configurar aplicación

```bash
node setup_production_app.js
```

#### 3. Iniciar con PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 4. Configurar nginx (opcional)

```bash
# Copiar configuración
sudo cp nginx/abmmcn.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/abmmcn.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoreo y Mantenimiento

### Health Check

```bash
# Verificación manual
node scripts/health-check.js

# Verificación con reporte
node scripts/health-check.js --save
```

### Backups Automáticos

```bash
# Crear backup
node scripts/backup-database.js

# Restaurar backup
node scripts/backup-database.js restore /path/to/backup.bak
```

### Logs

```bash
# Ver logs de PM2
pm2 logs

# Ver logs específicos
pm2 logs abmmcn-backend
pm2 logs abmmcn-frontend
```

## 🔒 Seguridad

### Configuraciones Implementadas

- ✅ **Rate Limiting** para prevenir ataques de fuerza bruta
- ✅ **Helmet** para headers de seguridad
- ✅ **CORS** configurado para dominios específicos
- ✅ **JWT** con expiración configurable
- ✅ **Validación de entrada** en todos los endpoints
- ✅ **Logs de auditoría** para todas las operaciones
- ✅ **Permisos granulares** por tabla y usuario

### Recomendaciones Adicionales

- 🔐 Usar HTTPS en producción
- 🔐 Configurar firewall para limitar acceso
- 🔐 Implementar backup automático diario
- 🔐 Monitorear logs regularmente
- 🔐 Actualizar dependencias periódicamente

## 🛠️ Comandos Útiles

### Gestión de PM2

```bash
# Ver estado
pm2 status

# Reiniciar aplicación
pm2 restart abmmcn-backend
pm2 restart abmmcn-frontend

# Ver logs en tiempo real
pm2 logs --lines 100

# Monitoreo
pm2 monit
```

### Gestión de Base de Datos

```bash
# Verificar conexión
node test_db.js

# Verificar permisos
node test_user_permissions.js

# Verificar tablas activadas
node test_activated_tables.js
```

### Desarrollo

```bash
# Modo desarrollo
cd backend && npm run dev
cd frontend && npm run dev

# Construir frontend
cd frontend && npm run build

# Linting
cd frontend && npm run lint
```

## 📈 Escalabilidad

### Configuraciones de Rendimiento

- **PM2 Cluster Mode**: Múltiples instancias del backend
- **Connection Pooling**: Configurado para SQL Server
- **Static File Caching**: Configurado en nginx
- **Gzip Compression**: Habilitado
- **Memory Management**: Límites configurados

### Monitoreo de Recursos

- **CPU**: Monitoreo automático con PM2
- **Memoria**: Límites de 1GB por instancia
- **Disco**: Verificación automática de espacio
- **Red**: Timeouts configurados

## 🆘 Solución de Problemas

### Problemas Comunes

#### 1. Error de conexión a base de datos

```bash
# Verificar variables de entorno
node check_env_config.js

# Verificar conectividad
node test_db.js
```

#### 2. Error de permisos

```bash
# Verificar permisos de usuario
node test_user_permissions.js

# Verificar permisos de tabla
node test_table_permissions.js
```

#### 3. Error de autenticación

```bash
# Verificar configuración JWT
node test_auth.js

# Verificar usuario admin
node fix_admin_password.js
```

#### 4. Error de frontend

```bash
# Verificar build
cd frontend && npm run build

# Verificar configuración de Vite
cat frontend/vite.config.ts
```

### Logs de Error

```bash
# Ver logs de error
pm2 logs --err

# Ver logs específicos
tail -f logs/err.log
tail -f logs/out.log
```

## 📞 Soporte

### Información de Contacto

- **Documentación**: Ver archivos README.md en cada directorio
- **Logs**: Directorio `logs/` para debugging
- **Scripts**: Directorio `scripts/` para utilidades
- **Configuración**: Archivos en `backend/config/`

### Recursos Adicionales

- 📖 [Guía de Despliegue Completa](GUIA_DESPLIEGUE_PRODUCCION_COMPLETA.md)
- 📖 [Sistema de Autenticación](SISTEMA_AUTENTICACION.md)
- 📖 [Sistema de Permisos](SISTEMA_USUARIOS_PERMISOS.md)
- 📖 [Sistema de Logs](SISTEMA_LOGS.md)

---

## ✅ Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] Base de datos configurada y accesible
- [ ] Usuario admin creado y configurado
- [ ] Dependencias instaladas
- [ ] Frontend construido
- [ ] PM2 configurado y funcionando
- [ ] Logs configurados y funcionando
- [ ] Backups configurados
- [ ] Monitoreo configurado
- [ ] Seguridad implementada
- [ ] Documentación actualizada

**¡La aplicación está lista para producción! 🎉**




