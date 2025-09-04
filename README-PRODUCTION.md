# 🚀 ABM MCN - Guía de Producción

## 📋 Estado del Sistema

- **Backend**: ✅ Funcionando en puerto 3001
- **Frontend**: ✅ Funcionando en puerto 5173
- **Base de datos**: ✅ Conectado a mcn-bidb-svr:1433
- **PM2**: ✅ Gestionando procesos

## 🌐 Acceso al Sistema

- **Local**: http://localhost:5173
- **Red**: http://172.31.250.6:5173
- **API**: http://localhost:3001

## 🔧 Scripts de Producción

### Instalación Completa

```bash
install-production.bat
```

- Instala dependencias necesarias
- Construye el frontend
- Inicia todos los servicios

### Configurar Inicio Automático

```bash
setup-windows-startup.bat
```

- Crea tarea programada para inicio automático
- El sistema se iniciará al reiniciar el servidor

### Monitoreo

```bash
monitor-production.bat
```

- Menú interactivo para gestionar servicios
- Ver logs, estado, memoria, etc.

## 📊 Comandos PM2 Útiles

### Gestión de Servicios

```bash
pm2 status              # Ver estado de servicios
pm2 logs                # Ver logs en tiempo real
pm2 logs abmmcn-backend # Logs solo del backend
pm2 logs abmmcn-frontend # Logs solo del frontend
pm2 restart all         # Reiniciar todos los servicios
pm2 restart abmmcn-backend # Reiniciar solo backend
pm2 stop all            # Detener todos los servicios
pm2 delete all          # Eliminar todos los servicios
```

### Monitoreo

```bash
pm2 monit               # Monitor interactivo
pm2 show abmmcn-backend # Detalles del proceso backend
pm2 show abmmcn-frontend # Detalles del proceso frontend
```

## 🔍 Verificación del Sistema

### Verificar Conectividad

```bash
# Backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:5173

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Verificar Base de Datos

```bash
cd backend
node test_db_connection.js
```

## 🛠️ Solución de Problemas

### Si el backend no responde:

1. Verificar logs: `pm2 logs abmmcn-backend`
2. Reiniciar: `pm2 restart abmmcn-backend`
3. Verificar conexión VPN a la base de datos

### Si el frontend no responde:

1. Verificar logs: `pm2 logs abmmcn-frontend`
2. Reiniciar: `pm2 restart abmmcn-frontend`
3. Verificar que el build esté actualizado

### Si hay problemas de memoria:

1. Verificar uso: `pm2 monit`
2. Reiniciar servicios: `pm2 restart all`
3. Ajustar límites en `ecosystem.config.js`

## 📁 Estructura de Archivos

```
AbmMcn/
├── backend/                 # Código del backend
│   ├── .env                # Variables de entorno
│   ├── server.js           # Servidor principal
│   └── ...
├── frontend/               # Código del frontend
│   ├── dist/               # Build de producción
│   └── ...
├── logs/                   # Logs de PM2
├── ecosystem.config.js     # Configuración de PM2
├── install-production.bat  # Script de instalación
├── monitor-production.bat  # Script de monitoreo
└── setup-windows-startup.bat # Script de inicio automático
```

## 🔐 Credenciales por Defecto

- **Usuario**: admin
- **Contraseña**: admin
- **Rol**: Administrador

## 📞 Soporte

- Verificar logs en `logs/` para errores
- Usar `monitor-production.bat` para diagnóstico
- Revisar configuración en `ecosystem.config.js`

---

**Sistema ABM MCN - Versión de Producción** 🎯
