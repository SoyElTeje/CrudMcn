# 🚀 GUÍA COMPLETA DE DESPLIEGUE EN PRODUCCIÓN

## 📋 Requisitos Previos

- ✅ Windows Server con Node.js instalado
- ✅ Git instalado y configurado
- ✅ Repositorio clonado en el servidor
- ✅ SQL Server accesible desde el servidor
- ✅ Base de datos APPDATA creada (sin tablas)

## 🔧 PASO 1: Configurar Variables de Entorno

### 1.1 Crear archivo `.env` en la raíz del proyecto

```bash
# Database Configuration - PRODUCCION
DB_SERVER=TU_SERVIDOR_SQL_PRODUCCION
DB_PORT=1433
DB_USER=app_user
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_DATABASE=APPDATA

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# JWT Configuration
JWT_SECRET=clave_super_secreta_y_muy_larga_para_produccion_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info
```

**⚠️ IMPORTANTE**:

- Reemplaza `TU_SERVIDOR_SQL_PRODUCCION` con el nombre real del servidor SQL
- Reemplaza `TU_PASSWORD_SEGURO_AQUI` con una contraseña segura
- Cambia `JWT_SECRET` por una clave secreta única y segura

## 🗄️ PASO 2: Configurar SQL Server

### 2.1 Ejecutar script de configuración de usuario

1. Abre SQL Server Management Studio
2. Conéctate como administrador
3. Ejecuta el script `setup_sql_server_user.sql`
4. **IMPORTANTE**: Cambia `TU_PASSWORD_SEGURO_AQUI` por la misma contraseña del archivo `.env`

### 2.2 Ejecutar script de configuración de base de datos

1. En SQL Server Management Studio
2. Conéctate a la base de datos APPDATA
3. Ejecuta el script `setup_production_database.sql`

## 📦 PASO 3: Instalar Dependencias

### 3.1 Instalar dependencias del backend

```bash
cd backend
npm install
cd ..
```

### 3.2 Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

## ⚙️ PASO 4: Configurar la Aplicación

### 4.1 Ejecutar script de inicialización

```bash
node setup_production_app.js
```

Este script:

- ✅ Verifica la conexión a la base de datos
- ✅ Configura la contraseña hasheada del usuario admin
- ✅ Verifica la estructura de la base de datos
- ✅ Proporciona instrucciones para los siguientes pasos

## 🚀 PASO 5: Iniciar la Aplicación

### 5.1 Opción 1: Usar script automático (Recomendado)

```bash
start-production-app.bat
```

### 5.2 Opción 2: Inicio manual

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

## 🌐 PASO 6: Acceder a la Aplicación

1. **Frontend**: http://localhost:5173
2. **Backend**: http://localhost:3001
3. **Credenciales iniciales**:
   - Usuario: `admin`
   - Contraseña: `admin`

## ⚠️ PASO 7: Configuración Post-Despliegue

### 7.1 Configurar permisos de usuarios

1. Inicia sesión como admin
2. Ve a la sección de usuarios
3. Crea usuarios y asigna permisos específicos a bases de datos/tablas

### 7.2 Activar tablas para administración

1. Ve a la sección de tablas activadas
2. Selecciona las bases de datos y tablas que quieres administrar
3. Activa las tablas necesarias

## 🔍 PASO 8: Verificación y Testing

### 8.1 Verificar conexión a base de datos

```bash
node test_db.js
```

### 8.2 Verificar autenticación

```bash
node test_auth_system.js
```

### 8.3 Verificar permisos

```bash
node test_user_permissions.js
```

## 🛠️ Solución de Problemas Comunes

### Error de conexión a SQL Server

**Síntoma**: `ELOGIN` o `ENOTFOUND`
**Solución**:

- Verificar credenciales en `.env`
- Verificar que el servidor SQL esté accesible
- Verificar configuración de red
- Ejecutar `setup_sql_server_user.sql` como administrador

### Error de permisos

**Síntoma**: `Access denied` o `Permission denied`
**Solución**:

- Verificar que el usuario `app_user` tenga permisos en SQL Server
- Verificar que el usuario tenga acceso a la base de datos APPDATA
- Ejecutar `setup_sql_server_user.sql` como administrador

### Error de puerto en uso

**Síntoma**: `EADDRINUSE`
**Solución**:

- Cambiar puerto en `.env` (PORT=3002)
- Verificar que no haya otros servicios usando los puertos
- Usar `netstat -an | findstr :3001` para verificar

### Error de CORS

**Síntoma**: Error de CORS en el navegador
**Solución**:

- Verificar `CORS_ORIGIN` en `.env`
- Asegurar que coincida con la URL del frontend
- Reiniciar el backend después de cambios

## 📝 Comandos Útiles

### Verificar estado de la aplicación

```bash
netstat -an | findstr :3001
netstat -an | findstr :5173
```

### Ver logs del backend

```bash
cd backend
npm start
```

### Ver logs del frontend

```bash
cd frontend
npm run dev
```

### Reiniciar aplicación

```bash
# Detener procesos (Ctrl+C en cada terminal)
# Luego ejecutar nuevamente start-production-app.bat
```

## 🔒 Consideraciones de Seguridad

1. **Cambiar contraseñas por defecto**:

   - Cambiar `JWT_SECRET` por una clave única
   - Cambiar contraseña del usuario admin después del primer login
   - Usar contraseñas fuertes para usuarios de base de datos

2. **Configurar firewall**:

   - Solo permitir acceso desde IPs autorizadas
   - Restringir puertos 3001 y 5173 si es necesario

3. **Monitoreo**:
   - Revisar logs regularmente
   - Monitorear acceso a la aplicación
   - Verificar permisos de usuarios periódicamente

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de la aplicación
2. Verifica la configuración del archivo `.env`
3. Ejecuta los scripts de testing
4. Verifica la conectividad a SQL Server
5. Revisa los permisos del usuario de la base de datos

---

## 🎯 Resumen de Archivos Importantes

- `.env` - Configuración de entorno
- `setup_sql_server_user.sql` - Configuración de usuario SQL Server
- `setup_production_database.sql` - Estructura de base de datos
- `setup_production_app.js` - Inicialización de la aplicación
- `start-production-app.bat` - Script de inicio automático

---

**¡La aplicación está lista para producción! 🎉**






