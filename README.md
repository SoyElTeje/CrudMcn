# 🔄 AbmMcn - Sistema ABM de Tablas

**Sistema web de Alta, Baja y Modificación (ABM)** para gestionar múltiples bases de datos SQL Server desde una interfaz web moderna con autenticación, permisos granulares y auditoría completa.

## 🚀 Características Principales

### 🔐 **Autenticación y Seguridad**
- **Sistema de login JWT** con roles (administrador/usuario)
- **Permisos granulares** a nivel de base de datos y tabla
- **Sanitización de entrada** para prevenir XSS y SQL injection
- **Rate limiting** y headers de seguridad con Helmet
- **Validación robusta** con Joi para todos los endpoints

### 📊 **Gestión de Datos**
- **CRUD completo** con interfaz web moderna
- **Múltiples bases de datos** SQL Server simultáneas
- **Importación/Exportación Excel** con ExcelJS
- **Validación de fechas** en formato DD/MM/AAAA
- **Operaciones granulares**: Lectura, Escritura, Creación, Eliminación

### 👥 **Gestión de Usuarios**
- **Creación de usuarios** por administradores
- **Asignación de permisos** específicos por base de datos/tabla
- **Escalación de permisos** (tabla → base de datos)
- **Auditoría completa** de todas las operaciones

### 🏗️ **Arquitectura Moderna**
- **Backend**: Node.js + Express + SQL Server + JWT
- **Frontend**: React + TypeScript + TailwindCSS + ShadCN/UI
- **Base de Datos**: SQL Server con pool de conexiones optimizado
- **Despliegue**: PM2 + Windows Server + Intranet
- **Testing**: Jest con 82% de cobertura de tests

## 📋 Prerrequisitos

- **Node.js 18+**
- **SQL Server** (local o remoto)
- **Git**
- **PM2** (para producción)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd AbmMcn
```

### 2. Configurar variables de entorno
```bash
# Ejecutar script de configuración automática
node setup-env.js

# O configurar manualmente
cp backend/env.development backend/.env
cp frontend/env.development frontend/.env
```

### 3. Instalar dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Configurar base de datos
```bash
# Opción 1: Docker (desarrollo)
docker-compose up -d

# Opción 2: SQL Server local/remoto
# Configurar credenciales en backend/.env
```

## 🚀 Ejecución

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Producción con PM2
```bash
# Configurar entorno
node setup-env.js production

# Iniciar con PM2
cd backend
pm2 start ecosystem.config.js --env production

# Monitorear
pm2 monit
```

### Scripts de Gestión
```bash
# Gestión PM2
node pm2-manager.js start
node pm2-manager.js stop
node pm2-manager.js restart

# Deployment automatizado
node deploy.js

# Monitoreo y health checks
node monitor.js
```

## 🌐 URLs y Endpoints

### Frontend
- **Desarrollo**: http://localhost:5173
- **Producción**: http://localhost:3000

### Backend API
- **Base URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **API Docs**: http://localhost:3001/api/docs

### Endpoints Principales
```
POST /api/auth/login              # Autenticación
GET  /api/auth/users              # Listar usuarios
POST /api/auth/users              # Crear usuario
PUT  /api/auth/users/:id/password # Actualizar contraseña

GET  /api/health                  # Estado del sistema
GET  /api/health/detailed         # Estado detallado
GET  /api/health/pools            # Estadísticas de pools

POST /api/auth/users/:id/database-permissions # Asignar permisos BD
POST /api/auth/users/:id/table-permissions    # Asignar permisos tabla
```

## 📁 Estructura del Proyecto

```
AbmMcn/
├── backend/                    # Servidor Node.js + Express
│   ├── config/                # Configuración (database, logger, security)
│   ├── middleware/            # Middlewares (auth, validation, sanitization)
│   ├── routes/                # Rutas de la API
│   ├── services/              # Servicios de negocio
│   ├── utils/                 # Utilidades (dateUtils, queryBuilder)
│   ├── __tests__/             # Tests unitarios e integración
│   ├── ecosystem.config.js    # Configuración PM2
│   ├── pm2-manager.js         # Gestión PM2
│   ├── deploy.js              # Deployment automatizado
│   └── monitor.js             # Monitoreo y health checks
├── frontend/                   # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas principales
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Servicios de API
│   │   └── utils/             # Utilidades frontend
│   └── public/
├── docker-compose.yml          # Configuración Docker para SQL Server
├── setupTestDbs.sql           # Script de datos de prueba
├── setup-env.js               # Script de configuración de entornos
└── refactor_general.md        # Plan de refactor y documentación
```

## 🔧 Configuración

### Variables de Entorno Backend

```env
# Base de datos
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=simpleDev!
DB_DATABASE=APPDATA

# Autenticación
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Pool de conexiones
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=30000
```

### Variables de Entorno Frontend

```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=AbmMcn
VITE_APP_VERSION=1.0.0
```

## 📊 Uso del Sistema

### 1. **Autenticación**
- Acceder a la aplicación
- Login con credenciales de administrador
- El sistema creará automáticamente un admin por defecto si no existe

### 2. **Gestión de Usuarios**
- Crear nuevos usuarios desde el panel de administración
- Asignar permisos específicos por base de datos o tabla
- Gestionar roles y accesos

### 3. **Exploración de Datos**
- Seleccionar base de datos desde el dropdown
- Elegir tabla para visualizar
- Realizar operaciones CRUD según permisos
- Exportar datos a Excel

### 4. **Auditoría**
- Revisar logs de operaciones
- Monitorear accesos y cambios
- Exportar reportes de auditoría

## 🧪 Testing

### Ejecutar Tests
```bash
# Todos los tests
cd backend
npm test

# Tests específicos
npm test -- --testPathPattern="auth"
npm test -- --testPathPattern="validation"

# Con coverage
npm test -- --coverage
```

### Cobertura Actual
- **Total**: 82% (129/157 tests pasando)
- **Sanitización**: 100% (29/29)
- **Error Handler**: 100% (15/15)
- **Validación**: 100% (27/27)
- **Permisos**: 100% (19/19)
- **PermissionService**: 100% (14/14)

## 🔍 Monitoreo y Logs

### Health Checks
```bash
# Estado básico
curl http://localhost:3001/api/health

# Estado detallado
curl http://localhost:3001/api/health/detailed

# Estadísticas de pools
curl http://localhost:3001/api/health/pools
```

### Logs
```bash
# Ver logs en tiempo real
pm2 logs

# Logs específicos
tail -f logs/app.log
tail -f logs/error.log
```

### Monitoreo PM2
```bash
# Dashboard
pm2 monit

# Estado de procesos
pm2 status

# Reiniciar aplicación
pm2 restart all
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. **Error de conexión a base de datos**
```bash
# Verificar configuración
cat backend/.env | grep DB_

# Probar conexión
node -e "require('./backend/config/database').testConnection()"
```

#### 2. **Error de autenticación JWT**
```bash
# Verificar JWT_SECRET
echo $JWT_SECRET

# Regenerar secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3. **Problemas de permisos**
```bash
# Verificar logs de permisos
grep "permission" logs/app.log

# Recrear usuario admin
node -e "require('./backend/services/authServiceRefactored').createDefaultAdmin()"
```

#### 4. **Problemas de PM2**
```bash
# Limpiar PM2
pm2 delete all
pm2 kill

# Reiniciar
pm2 start ecosystem.config.js
```

## 🔮 Roadmap

### ✅ **Completado (Fases 1-4)**
- [x] Configuración crítica y limpieza
- [x] Mejoras de código y arquitectura
- [x] Optimización y configuración
- [x] Testing y documentación (82% cobertura)

### 🚧 **En Progreso (Fase 5)**
- [ ] **Despliegue y Monitoreo**
  - [ ] Configurar entorno de producción
  - [ ] Scripts de despliegue automatizado
  - [ ] Monitoreo avanzado
  - [ ] Backup automático

### 📋 **Próximas Funcionalidades**
- [ ] **Dashboard de métricas** en tiempo real
- [ ] **Notificaciones** por email/SMS
- [ ] **API REST** completa con documentación
- [ ] **Modo offline** con sincronización
- [ ] **Integración** con sistemas externos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `test:` Tests
- `refactor:` Refactorización
- `chore:` Tareas de mantenimiento

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 📞 Soporte

Para soporte técnico o consultas:
- **Issues**: Crear un issue en GitHub
- **Documentación**: Ver `refactor_general.md`
- **Logs**: Revisar `logs/` para debugging

---

_Última actualización: Diciembre 2024_  
_Estado: Fase 4.2 - Documentación en progreso_  
_Versión: 1.0.0_