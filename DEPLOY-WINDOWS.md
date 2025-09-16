# 🚀 Guía de Despliegue en Windows Server - AbmMcn

## 📋 Requisitos Previos

### Sistema Operativo

- Windows Server 2016 o superior
- Acceso de administrador al servidor

### Software Requerido

- Node.js 18+ (se instala automáticamente)
- Git (para clonar el repositorio)
- SQL Server (para la base de datos)

### Puertos

- **3001**: Backend API
- **1433**: SQL Server (si está en el mismo servidor)
- **5173**: Frontend (opcional, puede usar IIS)

## 🛠️ Pasos de Despliegue

### Paso 1: Preparación del Servidor

1. **Conectar al servidor Windows**

   ```cmd
   # Usar RDP o acceso directo al servidor
   ```

2. **Ejecutar configuración inicial**

   ```cmd
   # Ejecutar como Administrador
   setup-windows-server.bat
   ```

3. **Reiniciar la consola** (si se instaló Node.js)

### Paso 2: Preparar el Proyecto

1. **Clonar o copiar el proyecto**

   ```cmd
   # Opción 1: Clonar desde Git
   git clone <tu-repositorio> C:\AbmMcn\app

   # Opción 2: Copiar archivos manualmente
   # Copiar todos los archivos del proyecto a C:\AbmMcn\app
   ```

2. **Navegar al directorio del proyecto**
   ```cmd
   cd C:\AbmMcn\app
   ```

### Paso 3: Configurar Variables de Entorno

1. **Editar archivo de producción**

   ```cmd
   notepad backend\env.production
   ```

2. **Configurar variables importantes:**

   ```env
   # Base de datos
   DB_SERVER=tu-servidor-sql
   DB_USER=tu-usuario
   DB_PASSWORD=tu-contraseña
   DB_DATABASE=APPDATA

   # JWT (generar un secret seguro)
   JWT_SECRET=GENERAR_SECRET_SUPER_SEGURO_Y_LARGO_PARA_PRODUCCION

   # CORS (configurar con IPs reales)
   CORS_ORIGIN=*
   ```

### Paso 4: Ejecutar Despliegue

1. **Ejecutar script de despliegue**

   ```cmd
   deploy-production.bat
   ```

2. **Verificar despliegue**
   ```cmd
   verify-deployment.bat
   ```

## 🔧 Configuración Post-Despliegue

### Verificar Servicios

```cmd
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs

# Monitoreo en tiempo real
pm2 monit
```

### Configurar IIS (Opcional)

Si quieres usar IIS en lugar del servidor de desarrollo:

1. **Instalar IIS con Node.js**
2. **Configurar reverse proxy** para el backend
3. **Servir archivos estáticos** del frontend

### Configurar SSL/HTTPS

1. **Obtener certificado SSL**
2. **Configurar reverse proxy** con SSL
3. **Actualizar CORS_ORIGIN** con HTTPS

## 📊 Monitoreo y Mantenimiento

### Comandos Útiles

```cmd
# Ver estado de aplicaciones
pm2 status

# Reiniciar aplicaciones
pm2 restart all

# Ver logs en tiempo real
pm2 logs

# Monitoreo de recursos
pm2 monit

# Guardar configuración actual
pm2 save

# Recargar configuración
pm2 reload ecosystem.config.js --env production
```

### Logs del Sistema

Los logs se almacenan en:

- `C:\AbmMcn\logs\backend-*.log`
- `C:\AbmMcn\logs\frontend-*.log`

### Backup Automático

El sistema está configurado para hacer backup automático diario a las 2:00 AM.

## 🚨 Solución de Problemas

### Problema: Node.js no se instala

**Solución:**

```cmd
# Descargar manualmente desde nodejs.org
# Instalar como administrador
```

### Problema: PM2 no inicia

**Solución:**

```cmd
# Reinstalar PM2
npm uninstall -g pm2
npm install -g pm2

# Configurar servicio
pm2-service-install -n "AbmMcn-PM2"
```

### Problema: Puertos ocupados

**Solución:**

```cmd
# Verificar puertos en uso
netstat -an | findstr ":3001"
netstat -an | findstr ":5173"

# Cambiar puertos en ecosystem.config.js si es necesario
```

### Problema: Error de base de datos

**Solución:**

1. Verificar conexión a SQL Server
2. Verificar credenciales en `env.production`
3. Verificar que la base de datos existe

### Problema: Frontend no carga

**Solución:**

```cmd
# Verificar que el build se completó
dir frontend\dist

# Recompilar si es necesario
cd frontend
npm run build
cd ..
pm2 restart abmmcn-frontend
```

## 🔒 Seguridad

### Configuraciones Recomendadas

1. **Cambiar JWT_SECRET** por uno único y seguro
2. **Configurar CORS_ORIGIN** con IPs específicas
3. **Usar HTTPS** en producción
4. **Configurar firewall** correctamente
5. **Mantener Node.js actualizado**

### Variables de Entorno Sensibles

```env
# Generar secret único
JWT_SECRET=tu-secret-super-seguro-y-largo

# Configurar CORS específico
CORS_ORIGIN=https://tu-dominio.com,https://admin.tu-dominio.com

# Configurar alertas
ALERT_EMAIL_TO=admin@tu-empresa.com
```

## 📞 Soporte

### Comandos de Diagnóstico

```cmd
# Verificar estado completo
verify-deployment.bat

# Ver logs de error
pm2 logs --err

# Verificar recursos
pm2 monit

# Verificar conexión a BD
cd backend
node -e "const { getPool } = require('./db'); require('dotenv').config(); getPool().then(() => console.log('OK')).catch(console.error)"
```

### Información del Sistema

```cmd
# Versión de Node.js
node --version

# Versión de PM2
pm2 --version

# Estado de servicios
sc query AbmMcn-PM2

# Espacio en disco
dir C:\ /-c
```

## 🎯 URLs de Acceso

Después del despliegue exitoso:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Status**: http://localhost:3001/api/status

## 📝 Notas Importantes

1. **Ejecutar siempre como Administrador** los scripts de configuración
2. **Verificar firewall** permite los puertos necesarios
3. **Mantener backups** regulares de la base de datos
4. **Monitorear logs** regularmente
5. **Actualizar dependencias** periódicamente

## 🔧 Configuración de Variables de Entorno

### Cómo Funciona el Sistema de Variables

El sistema AbmMcn utiliza un sistema de variables de entorno por ambiente:

1. **`backend/env.production`** - Archivo de configuración de producción
2. **`backend/.env`** - Archivo que se lee en tiempo de ejecución
3. **`configure-production-env.bat`** - Script que copia la configuración

### Configuración Automática

```cmd
# 1. Configurar entorno de producción
configure-production-env.bat

# 2. Verificar variables
test-env.bat

# 3. Desplegar
deploy-production.bat
```

### Variables Críticas Requeridas

```env
# Base de datos (OBLIGATORIO)
DB_SERVER=tu-servidor-sql
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_DATABASE=APPDATA

# Seguridad (OBLIGATORIO)
JWT_SECRET=tu-secret-super-seguro-y-largo

# Servidor (OBLIGATORIO)
NODE_ENV=production
PORT=3001

# CORS (RECOMENDADO)
CORS_ORIGIN=*
```

### Verificación de Variables

El script `test-env.bat` verifica que todas las variables críticas estén configuradas:

```cmd
test-env.bat
```

**Salida esperada:**

```
✅ Todas las variables críticas están configuradas
🚀 El sistema está listo para producción
```

### Solución de Problemas de Variables

**Problema: Variables no se cargan**

```cmd
# Verificar que el archivo .env existe
dir backend\.env

# Reconfigurar entorno
configure-production-env.bat
```

**Problema: Error de conexión a BD**

```cmd
# Verificar variables de BD
test-env.bat

# Verificar conexión manual
cd backend
node -e "require('dotenv').config(); console.log('DB_SERVER:', process.env.DB_SERVER)"
```

---

**¡Despliegue completado!** 🎉

El sistema AbmMcn debería estar funcionando correctamente en tu servidor Windows.
