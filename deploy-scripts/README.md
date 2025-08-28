# Scripts de Despliegue - AbmMcn

Esta carpeta contiene scripts de PowerShell para automatizar el despliegue y mantenimiento de la aplicación AbmMcn en un Windows Server.

## Scripts Disponibles

### 1. `install-dependencies.ps1`

**Propósito**: Instalar todas las dependencias necesarias en el servidor.

**Qué hace**:

- Verifica que Node.js esté instalado
- Instala PM2 globalmente
- Verifica que Git esté instalado
- Crea directorios necesarios (aplicación, logs, backups)

**Uso**:

```powershell
# Ejecutar como Administrador
.\install-dependencies.ps1
```

### 2. `setup-database.ps1`

**Propósito**: Configurar la base de datos SQL Server.

**Qué hace**:

- Crea la base de datos APPDATA
- Crea el usuario de aplicación
- Crea todas las tablas necesarias
- Asigna permisos correctos

**Uso**:

```powershell
# Ejecutar como Administrador
.\setup-database.ps1
```

### 3. `deploy-app.ps1`

**Propósito**: Desplegar la aplicación completa.

**Parámetros**:

- `RepositoryUrl`: URL del repositorio Git
- `Domain`: Dominio de producción
- `JwtSecret`: Clave secreta para JWT

**Qué hace**:

- Crea backup de instalación previa
- Clona el repositorio
- Configura variables de entorno
- Instala dependencias
- Construye el frontend
- Configura PM2
- Inicia la aplicación
- Configura firewall

**Uso**:

```powershell
# Ejecutar como Administrador
.\deploy-app.ps1

# O con parámetros
.\deploy-app.ps1 -RepositoryUrl "https://github.com/tu-usuario/AbmMcn.git" -Domain "tu-dominio.com" -JwtSecret "tu-clave-secreta"
```

### 4. `update-app.ps1`

**Propósito**: Actualizar la aplicación existente.

**Qué hace**:

- Crea backup antes de actualizar
- Actualiza código desde Git
- Actualiza dependencias
- Reconstruye frontend
- Reinicia aplicación
- Limpia backups antiguos

**Uso**:

```powershell
# Ejecutar como Administrador
.\update-app.ps1
```

### 5. `check-status.ps1`

**Propósito**: Verificar el estado completo de la aplicación.

**Qué hace**:

- Verifica estado de PM2
- Verifica puertos en uso
- Muestra logs recientes
- Verifica uso de recursos
- Verifica archivos de configuración
- Verifica conexión a base de datos
- Verifica reglas de firewall
- Verifica servicios de Windows
- Verifica espacio en disco

**Uso**:

```powershell
# Ejecutar como Administrador
.\check-status.ps1
```

## Orden de Ejecución

Para un despliegue completo, ejecuta los scripts en este orden:

1. **Instalar dependencias**:

   ```powershell
   .\install-dependencies.ps1
   ```

2. **Configurar base de datos**:

   ```powershell
   .\setup-database.ps1
   ```

3. **Desplegar aplicación**:

   ```powershell
   .\deploy-app.ps1
   ```

4. **Verificar estado**:
   ```powershell
   .\check-status.ps1
   ```

## Comandos Útiles de PM2

### Ver estado de la aplicación

```powershell
pm2 status
```

### Ver logs en tiempo real

```powershell
pm2 logs abmmcn-backend
```

### Reiniciar aplicación

```powershell
pm2 restart abmmcn-backend
```

### Detener aplicación

```powershell
pm2 stop abmmcn-backend
```

### Monitorear recursos

```powershell
pm2 monit
```

## Configuración de Variables de Entorno

El archivo `.env` se crea automáticamente durante el despliegue, pero puedes editarlo manualmente:

```env
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
CORS_ORIGIN=https://tu-dominio.com

# JWT Configuration
JWT_SECRET=tu-super-secret-jwt-key-muy-seguro-y-unico-para-produccion
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info
```

## Troubleshooting

### Problema: Script no se ejecuta

- Asegúrate de ejecutar PowerShell como Administrador
- Verifica que la política de ejecución permita scripts:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### Problema: Error de permisos

- Ejecuta todos los scripts como Administrador
- Verifica que el usuario tenga permisos en SQL Server

### Problema: Aplicación no inicia

- Verifica logs con: `pm2 logs abmmcn-backend`
- Verifica variables de entorno en el archivo `.env`
- Verifica que el puerto 3001 esté libre

### Problema: Error de base de datos

- Verifica que SQL Server esté ejecutándose
- Verifica credenciales en el archivo `.env`
- Ejecuta `.\check-status.ps1` para diagnóstico completo

## Seguridad

### Contraseñas

- Cambia la contraseña por defecto del usuario de base de datos
- Usa un JWT_SECRET único y seguro
- No compartas archivos `.env`

### Firewall

- Solo abre los puertos necesarios (3001, 80, 443)
- Considera restringir acceso por IP si es posible

### Logs

- Revisa logs regularmente
- Configura rotación de logs
- Monitorea errores críticos

## Mantenimiento

### Actualizaciones

- Ejecuta `.\update-app.ps1` para actualizar la aplicación
- Revisa logs después de cada actualización
- Verifica que la aplicación funcione correctamente

### Backups

- Los backups se crean automáticamente
- Se mantienen los últimos 5 backups
- Considera configurar backups de base de datos adicionales

### Monitoreo

- Ejecuta `.\check-status.ps1` regularmente
- Configura alertas para errores críticos
- Monitorea uso de recursos

## Soporte

Si encuentras problemas:

1. Ejecuta `.\check-status.ps1` para diagnóstico
2. Revisa logs con `pm2 logs abmmcn-backend`
3. Verifica la documentación principal en `GUIA_DEPLOY_PRODUCTION.md`
4. Consulta los logs de Windows Event Viewer

## Notas Importantes

- Todos los scripts deben ejecutarse como Administrador
- Asegúrate de tener SQL Server instalado y configurado
- Verifica que Node.js esté instalado antes de ejecutar los scripts
- Los scripts crean backups automáticamente para mayor seguridad
- Considera probar en un ambiente de staging antes de producción
