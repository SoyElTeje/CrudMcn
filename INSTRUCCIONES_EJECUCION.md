# Instrucciones de Ejecución - Sistema de Gestión de Bases de Datos

## Requisitos Previos

1. **Node.js** (versión 18 o superior)
2. **SQL Server** configurado y funcionando
3. **Variables de entorno** configuradas en `.env`

## Configuración del Entorno

1. **Copiar el archivo de ejemplo:**

   ```bash
   cp env.example .env
   ```

2. **Configurar las variables en `.env`:**

   ```env
   # Database Configuration
   DB_SERVER=tu_servidor_sql
   DB_PORT=1433
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_DATABASE=APPDATA  # Base de datos donde se crearán las tablas de usuarios

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```

## Instalación y Configuración

### 1. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 2. Instalar Dependencias del Frontend

```bash
cd frontend
npm install
```

### 3. Inicializar el Sistema de Autenticación

```bash
# Desde la raíz del proyecto
node setup_auth_system.js
```

Este script:

- Crea las tablas necesarias para usuarios y permisos
- Crea el usuario administrador inicial
- Configura índices para optimizar el rendimiento

### 4. Verificar la Configuración

```bash
# Probar el sistema de autenticación
node test_auth_system.js
```

## Ejecución

### 1. Ejecutar el Backend

```bash
cd backend
npm run dev
```

El servidor se ejecutará en `http://localhost:3001`

### 2. Ejecutar el Frontend

```bash
cd frontend
npm run dev
```

La aplicación se ejecutará en `http://localhost:5173`

### 3. Acceder a la Aplicación

1. Abrir `http://localhost:5173`
2. Iniciar sesión con las credenciales por defecto:
   - **Usuario**: `admin`
   - **Contraseña**: `admin`

⚠️ **IMPORTANTE**: Cambiar la contraseña del administrador después del primer inicio de sesión.

## Funcionalidades del Sistema

### Sistema de Autenticación

- ✅ **Login seguro** con JWT tokens
- ✅ **Gestión de usuarios** (solo administradores)
- ✅ **Sistema de permisos** granular por base de datos y tabla
- ✅ **Roles de usuario** (Administrador y Usuario normal)
- ✅ **Persistencia de sesión** con localStorage

### Gestión de Bases de Datos

- ✅ **Visualización** de bases de datos y tablas
- ✅ **Edición de registros** con permisos
- ✅ **Eliminación individual** con confirmación
- ✅ **Eliminación múltiple** con selección por checkboxes
- ✅ **Control de acceso** basado en permisos

### Panel de Administración

- ✅ **Creación de usuarios** con roles específicos
- ✅ **Asignación de permisos** por base de datos
- ✅ **Gestión de contraseñas** de usuarios
- ✅ **Vista de permisos** por usuario

## Verificación de Funcionalidades

### 1. Verificar Conexión

- Abrir `http://localhost:3001/api/health` en el navegador
- Debería mostrar un JSON con status "OK"

### 2. Probar Sistema de Autenticación

```bash
# Pruebas completas del sistema de auth
node test_auth_system.js
```

### 3. Probar Operaciones CRUD

```bash
# Pruebas básicas de CRUD (requiere autenticación)
node test_crud_operations.js

# Pruebas de eliminación múltiple (requiere autenticación)
node test_bulk_delete_operations.js
```

### 4. Usar la Interfaz Web

1. **Iniciar sesión** con credenciales de administrador
2. **Navegar entre vistas** usando los botones del menú
3. **Gestionar usuarios** desde la vista de administración
4. **Explorar bases de datos** desde la vista principal

## Uso del Sistema

### Para Administradores

1. **Iniciar sesión** con credenciales de administrador
2. **Navegar a "Gestión de Usuarios"** desde el menú principal
3. **Crear usuarios** con roles específicos
4. **Asignar permisos** por base de datos o tabla específica
5. **Gestionar contraseñas** de usuarios

### Para Usuarios Normales

1. **Iniciar sesión** con credenciales asignadas
2. **Acceder solo a bases de datos y tablas** con permisos asignados
3. **Realizar operaciones** según permisos (lectura, escritura, eliminación)

## Solución de Problemas

### Error de Conexión a Base de Datos

1. Verificar que SQL Server esté ejecutándose
2. Verificar las credenciales en `.env`
3. Verificar que el puerto esté abierto
4. Ejecutar `node testDbConnections.js` para diagnosticar

### Error de Autenticación

1. Verificar que se haya ejecutado `setup_auth_system.js`
2. Verificar que las tablas de usuarios existan en la base de datos
3. Verificar configuración de JWT en `.env`
4. Ejecutar `node test_auth_system.js` para diagnosticar

### Error de Permisos

1. Verificar que el usuario tenga permisos asignados
2. Contactar al administrador para asignar permisos
3. Verificar que el token JWT no haya expirado

### Error de CORS

1. Verificar que `CORS_ORIGIN` esté configurado correctamente
2. Verificar que el frontend esté ejecutándose en el puerto correcto

### Error en Operaciones CRUD

1. Verificar que la tabla tenga registros
2. Verificar que los permisos de usuario permitan la operación
3. Revisar los logs del servidor para errores específicos

## Estructura de Archivos

```
AbmMcn/
├── backend/
│   ├── server.js              # Servidor principal con autenticación
│   ├── db.js                  # Configuración de base de datos
│   ├── routes/
│   │   └── auth.js            # Rutas de autenticación
│   ├── services/
│   │   └── authService.js     # Servicio de autenticación
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticación
│   └── package.json           # Dependencias del backend
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Componente principal con auth
│   │   └── components/
│   │       ├── LoginModal.tsx           # Modal de login
│   │       ├── UserManagement.tsx       # Gestión de usuarios
│   │       ├── EditRecordModal.tsx      # Modal de edición
│   │       ├── DeleteConfirmationModal.tsx   # Modal de confirmación individual
│   │       ├── BulkDeleteConfirmationModal.tsx # Modal de confirmación múltiple
│   │       └── ui/            # Componentes de UI
│   └── package.json           # Dependencias del frontend
├── setup_auth_system.js       # Script de inicialización del sistema
├── test_auth_system.js        # Script de prueba del sistema de auth
├── test_crud_operations.js    # Script de prueba básico
├── test_bulk_delete_operations.js # Script de prueba de eliminación múltiple
├── SISTEMA_AUTENTICACION.md   # Documentación del sistema de auth
└── FUNCIONALIDADES_CRUD.md    # Documentación de funcionalidades
```

## Comandos Útiles

### Backend

```bash
cd backend
npm start          # Iniciar servidor
npm run dev        # Iniciar en modo desarrollo con nodemon
```

### Frontend

```bash
cd frontend
npm run dev        # Iniciar servidor de desarrollo
npm run build      # Construir para producción
npm run preview    # Previsualizar build de producción
```

### Sistema de Autenticación

```bash
# Inicializar sistema
node setup_auth_system.js

# Probar sistema
node test_auth_system.js
```

### Base de datos

```bash
# Ejecutar script de configuración
sqlcmd -S localhost -U sa -P simpleDev! -i setupTestDbs.sql
```

## Notas Importantes

- **El servidor backend debe estar ejecutándose antes que el frontend**
- **Las credenciales de SQL Server deben tener permisos suficientes**
- **El archivo `.env` no debe subirse al repositorio** (está en .gitignore)
- **Para producción, cambiar las credenciales por defecto**
- **Cambiar JWT_SECRET en producción**
- **Revisar y ajustar permisos de usuarios regularmente**
- **Hacer backup de las tablas de usuarios y permisos**
- **Las operaciones de edición y eliminación usan claves primarias**
- **El sistema de permisos es granular por base de datos y tabla**
- **Los tokens JWT tienen expiración configurable**
