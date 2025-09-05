# Configuración de Producción - ABM McN

## Requisitos Previos

- Windows Server 2016 o superior
- Node.js 18+ instalado
- SQL Server configurado y accesible
- Variables de entorno configuradas (ver `.env.production.example`)

## Instalación Automática

### Opción 1: Instalación con PM2 (Recomendada)

1. **Clonar el repositorio:**

   ```bash
   git clone <tu-repositorio>
   cd AbmMcn
   ```

2. **Configurar variables de entorno:**

   - Copiar `.env.production.example` a `.env`
   - Editar `.env` con los valores correctos de tu servidor

3. **Ejecutar instalación automática:**
   ```bash
   install-production.bat
   ```

### Opción 2: Instalación Manual

1. **Instalar dependencias:**

   ```bash
   cd backend
   npm install --production
   cd ../frontend
   npm install --production
   npm run build
   cd ..
   ```

2. **Instalar PM2:**

   ```bash
   npm install -g pm2
   ```

3. **Configurar inicio automático:**
   ```bash
   pm2 startup
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Gestión de la Aplicación

### Script de Gestión

Usar `manage-production.bat` para:

- Ver estado de las aplicaciones
- Ver logs en tiempo real
- Reiniciar aplicaciones
- Monitorear uso de memoria
- Ver logs de errores

### Comandos PM2 Útiles

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs

# Reiniciar todo
pm2 restart all

# Reiniciar solo backend
pm2 restart abmmcn-backend

# Reiniciar solo frontend
pm2 restart abmmcn-frontend

# Ver uso de memoria
pm2 monit

# Detener todo
pm2 stop all

# Eliminar todo
pm2 delete all
```

## Configuración de Firewall

Asegúrate de abrir los puertos necesarios:

- **Puerto 3001**: Backend API
- **Puerto 4173**: Frontend (Vite Preview)

## Configuración de Base de Datos

1. **Crear base de datos APPDATA** si no existe
2. **Ejecutar scripts de setup:**

   ```bash
   # Conectar a SQL Server y ejecutar:
   setup_production_database.sql
   ```

3. **Verificar permisos de usuario:**
   - El usuario `app_user` debe tener acceso a `APPDATA` y `BI_Editor`
   - Ver archivo `setup_sql_server_user.sql`

## Monitoreo y Logs

### Ubicación de Logs

- **Backend**: `logs/backend-error.log`, `logs/backend-out.log`
- **Frontend**: `logs/frontend-error.log`, `logs/frontend-out.log`

### Health Checks

- **Backend**: `http://localhost:3001/api/health`
- **Frontend**: `http://localhost:4173`

## Actualizaciones

### Actualización Automática

```bash
# Detener aplicaciones
pm2 stop all

# Actualizar código
git pull

# Reinstalar dependencias
cd backend && npm install --production && cd ..
cd frontend && npm install --production && npm run build && cd ..

# Reiniciar aplicaciones
pm2 start ecosystem.config.js
pm2 save
```

### Rollback

```bash
# Volver a versión anterior
git checkout <tag-anterior>

# Reinstalar y reiniciar
pm2 restart all
```

## Desinstalación

Para desinstalar completamente:

```bash
uninstall-production.bat
```

## Troubleshooting

### Problemas Comunes

1. **Aplicación no inicia:**

   - Verificar variables de entorno
   - Verificar conexión a base de datos
   - Revisar logs en `logs/`

2. **Error de permisos:**

   - Verificar permisos de SQL Server
   - Ejecutar `setup_sql_server_user.sql`

3. **Puertos ocupados:**

   - Cambiar puertos en `ecosystem.config.js`
   - Verificar firewall

4. **PM2 no inicia con Windows:**
   - Ejecutar `pm2 startup` como administrador
   - Verificar que PM2 esté en PATH

### Logs de Debug

```bash
# Ver logs detallados
pm2 logs --lines 100

# Ver logs de una aplicación específica
pm2 logs abmmcn-backend
```

## Seguridad

1. **Cambiar contraseñas por defecto:**

   - Usuario admin: `admin/admin`
   - Usuario SQL Server: `app_user`

2. **Configurar HTTPS** (recomendado para producción)

3. **Configurar backup automático** de la base de datos

4. **Monitorear logs** regularmente para detectar problemas

## Soporte

Para problemas técnicos:

1. Revisar logs en `logs/`
2. Verificar estado con `pm2 status`
3. Consultar documentación técnica
4. Contactar al equipo de desarrollo





