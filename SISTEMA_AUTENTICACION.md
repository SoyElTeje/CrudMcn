# Sistema de Autenticación y Autorización

## Resumen

Se ha implementado un sistema completo de autenticación y autorización para el visualizador de bases de datos, que incluye:

- **Autenticación con JWT**: Login seguro con tokens
- **Gestión de usuarios**: Creación, edición y administración de usuarios
- **Sistema de permisos**: Control granular de acceso a bases de datos y tablas
- **Roles de usuario**: Administradores y usuarios normales
- **Interfaz de gestión**: Panel administrativo para gestionar usuarios y permisos

## Estructura de la Base de Datos

### Tabla: USERS_TABLE

```sql
CREATE TABLE USERS_TABLE (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) UNIQUE NOT NULL,
    Contrasena NVARCHAR(255) NOT NULL, -- Hash bcrypt
    EsAdmin BIT NOT NULL DEFAULT 0,
    FechaCreacion DATETIME2 DEFAULT GETDATE(),
    UltimoAcceso DATETIME2 NULL,
    Activo BIT DEFAULT 1
);
```

### Tabla: USER_DATABASE_PERMISSIONS

```sql
CREATE TABLE USER_DATABASE_PERMISSIONS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName NVARCHAR(128) NOT NULL,
    CanRead BIT DEFAULT 1,
    CanWrite BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,
    FechaAsignacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
    UNIQUE(UserId, DatabaseName)
);
```

### Tabla: USER_TABLE_PERMISSIONS

```sql
CREATE TABLE USER_TABLE_PERMISSIONS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(128) NOT NULL,
    CanRead BIT DEFAULT 1,
    CanWrite BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,
    FechaAsignacion DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
    UNIQUE(UserId, DatabaseName, TableName)
);
```

## Componentes del Sistema

### Backend

#### 1. Servicio de Autenticación (`backend/services/authService.js`)

- Hash de contraseñas con bcrypt
- Generación y verificación de JWT
- Autenticación de usuarios
- Gestión de permisos

#### 2. Middleware de Autenticación (`backend/middleware/auth.js`)

- Verificación de tokens JWT
- Verificación de roles de administrador
- Verificación de permisos específicos (lectura, escritura, eliminación, creación)

#### 3. Rutas de Autenticación (`backend/routes/auth.js`)

- `/api/auth/login` - Login de usuarios
- `/api/auth/setup-admin` - Crear usuario administrador inicial
- `/api/auth/me` - Obtener información del usuario actual
- `/api/auth/users` - Gestión de usuarios (CRUD)
- `/api/auth/users/:userId/password` - Cambiar contraseñas
- `/api/auth/users/:userId/database-permissions` - Asignar permisos de BD
- `/api/auth/users/:userId/table-permissions` - Asignar permisos de tabla
- `/api/auth/users/:userId/permissions` - Obtener permisos de usuario

### Frontend

#### 1. Componente de Login (`frontend/src/components/LoginModal.tsx`)

- Modal de autenticación
- Validación de credenciales
- Manejo de errores

#### 2. Gestión de Usuarios (`frontend/src/components/UserManagement.tsx`)

- Lista de usuarios del sistema
- Creación de nuevos usuarios
- Asignación de permisos
- Cambio de contraseñas

#### 3. App Principal Actualizado (`frontend/src/App.tsx`)

- Sistema de autenticación integrado
- Navegación entre vistas
- Interceptor de axios para tokens
- Persistencia de sesión

## Flujo de Autenticación

### 1. Inicialización del Sistema

```bash
# Ejecutar script de inicialización
node setup_auth_system.js
```

### 2. Login de Usuario

1. Usuario ingresa credenciales en el modal de login
2. Frontend envía credenciales a `/api/auth/login`
3. Backend verifica credenciales y genera JWT
4. Frontend almacena token en localStorage
5. Usuario accede al sistema

### 3. Verificación de Permisos

1. Cada petición incluye token JWT en header Authorization
2. Middleware verifica token y extrae información del usuario
3. Se verifica si el usuario tiene permisos para la operación solicitada
4. Si tiene permisos, se permite la operación; si no, se rechaza

## Tipos de Permisos

### Permisos de Base de Datos

- **CanRead**: Ver bases de datos y listar tablas
- **CanWrite**: Editar registros existentes
- **CanDelete**: Eliminar registros
- **CanCreate**: Crear nuevos registros

### Permisos de Tabla Específica

- Permisos granulares por tabla dentro de una base de datos
- Sobrescribe permisos de base de datos para esa tabla específica

### Roles de Usuario

- **Administrador**: Acceso total a todas las funcionalidades
- **Usuario Normal**: Acceso limitado según permisos asignados

## API Endpoints Protegidos

Todas las rutas de la API ahora requieren autenticación:

- `GET /api/databases` - Listar bases de datos
- `GET /api/databases/:dbName/tables` - Listar tablas (requiere permiso de lectura)
- `GET /api/databases/:dbName/tables/:tableName/structure` - Estructura de tabla (requiere permiso de lectura)
- `GET /api/databases/:dbName/tables/:tableName/records` - Datos de tabla (requiere permiso de lectura)
- `PUT /api/databases/:dbName/tables/:tableName/records` - Editar registro (requiere permiso de escritura)
- `DELETE /api/databases/:dbName/tables/:tableName/records` - Eliminar registro (requiere permiso de eliminación)
- `DELETE /api/databases/:dbName/tables/:tableName/records/bulk` - Eliminar múltiples registros (requiere permiso de eliminación)

## Configuración

### Variables de Entorno

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Database Configuration
DB_DATABASE=APPDATA  # Base de datos donde se almacenan las tablas de usuarios
```

### Credenciales por Defecto

- **Usuario**: admin
- **Contraseña**: admin
- **Rol**: Administrador

⚠️ **IMPORTANTE**: Cambiar la contraseña del administrador después del primer inicio de sesión.

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

## Seguridad

### Medidas Implementadas

- **Hash de contraseñas**: bcrypt con salt rounds de 12
- **Tokens JWT**: Con expiración configurable
- **Validación de permisos**: En cada operación
- **Sanitización de datos**: Prevención de inyección SQL
- **Headers de seguridad**: CORS configurado

### Buenas Prácticas

- Cambiar contraseña de administrador por defecto
- Usar contraseñas fuertes
- Revisar permisos regularmente
- Monitorear accesos de usuarios

## Pruebas

### Script de Pruebas Automatizadas

```bash
# Ejecutar pruebas del sistema de autenticación
node test_auth_system.js
```

### Pruebas Manuales

1. Login con diferentes usuarios
2. Verificar permisos de acceso
3. Probar creación y gestión de usuarios
4. Verificar asignación de permisos

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**

   - Verificar configuración en `.env`
   - Asegurar que la base de datos `DB_DATABASE` existe

2. **Token expirado**

   - El usuario debe volver a iniciar sesión
   - Verificar configuración de `JWT_EXPIRES_IN`

3. **Permisos insuficientes**

   - Verificar permisos asignados al usuario
   - Contactar al administrador para asignar permisos

4. **Error de hash de contraseña**
   - Verificar que bcrypt esté instalado correctamente
   - Revisar logs del servidor

### Logs y Debugging

- Los errores se registran en la consola del servidor
- Usar herramientas de desarrollo del navegador para debug del frontend
- Verificar Network tab para errores de API

## Mantenimiento

### Tareas Regulares

- Revisar logs de acceso
- Actualizar contraseñas de usuarios
- Revisar y ajustar permisos
- Backup de tablas de usuarios y permisos

### Actualizaciones

- Mantener dependencias actualizadas
- Revisar vulnerabilidades de seguridad
- Actualizar JWT_SECRET periódicamente
