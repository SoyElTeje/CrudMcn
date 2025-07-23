# Sistema de Usuarios y Permisos

## Descripción General

Se ha implementado un sistema completo de autenticación y gestión de usuarios con permisos granulares para el sistema de gestión de bases de datos. El sistema incluye:

- **Autenticación JWT**: Login seguro con tokens
- **Gestión de Usuarios**: CRUD completo de usuarios
- **Sistema de Permisos**: Permisos granulares por base de datos y tabla
- **Usuario Administrador**: Acceso total al sistema
- **Interfaz de Usuario**: Componentes React para gestión

## Estructura de Base de Datos

### Tabla: USERS_TABLE

```sql
CREATE TABLE USERS_TABLE (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    EsAdmin TINYINT(1) DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaModificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: USER_DATABASE_PERMISSIONS

```sql
CREATE TABLE USER_DATABASE_PERMISSIONS (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName VARCHAR(100) NOT NULL,
    CanRead TINYINT(1) DEFAULT 1,
    CanWrite TINYINT(1) DEFAULT 0,
    CanDelete TINYINT(1) DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_database (UserId, DatabaseName)
);
```

### Tabla: USER_TABLE_PERMISSIONS

```sql
CREATE TABLE USER_TABLE_PERMISSIONS (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName VARCHAR(100) NOT NULL,
    TableName VARCHAR(100) NOT NULL,
    CanRead TINYINT(1) DEFAULT 1,
    CanWrite TINYINT(1) DEFAULT 0,
    CanDelete TINYINT(1) DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_table (UserId, DatabaseName, TableName)
);
```

## Usuario Administrador por Defecto

- **Usuario**: `admin`
- **Contraseña**: `admin`
- **Permisos**: Administrador total (acceso a todo el sistema)

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en el directorio raíz:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_DATABASE=tu_base_de_datos
DB_PORT=3306

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Crear Tablas de Usuarios

```bash
cd backend
npm run setup-db
```

### 4. Iniciar Servidores

```bash
# Backend (puerto 3001)
cd backend
npm run dev

# Frontend (puerto 5173)
cd frontend
npm run dev
```

## Funcionalidades Implementadas

### Backend

#### Servicio de Autenticación (`authService.js`)

- `verifyCredentials(username, password)`: Verificar credenciales
- `generateToken(user)`: Generar token JWT
- `verifyToken(token)`: Verificar token JWT
- `createUser(username, password, isAdmin)`: Crear usuario
- `getAllUsers()`: Obtener todos los usuarios
- `updateUserPassword(userId, newPassword)`: Actualizar contraseña
- `updateAdminStatus(userId, isAdmin)`: Cambiar estado de admin
- `deleteUser(userId)`: Eliminar usuario
- `checkDatabasePermission(userId, databaseName, operation)`: Verificar permisos de BD
- `checkTablePermission(userId, databaseName, tableName, operation)`: Verificar permisos de tabla
- `assignDatabasePermission(userId, databaseName, permissions)`: Asignar permisos de BD
- `assignTablePermission(userId, databaseName, tableName, permissions)`: Asignar permisos de tabla
- `getUserPermissions(userId)`: Obtener permisos de usuario
- `createDefaultAdmin()`: Crear usuario admin por defecto

#### Rutas de Autenticación (`routes/auth.js`)

- `POST /api/auth/login`: Login de usuario
- `GET /api/auth/verify`: Verificar token
- `GET /api/auth/users`: Obtener todos los usuarios (solo admin)
- `POST /api/auth/users`: Crear usuario (solo admin)
- `PUT /api/auth/users/:userId/password`: Cambiar contraseña
- `PUT /api/auth/users/:userId/admin`: Cambiar estado de admin
- `DELETE /api/auth/users/:userId`: Eliminar usuario (solo admin)
- `GET /api/auth/users/:userId/permissions`: Obtener permisos de usuario
- `POST /api/auth/users/:userId/database-permissions`: Asignar permisos de BD
- `POST /api/auth/users/:userId/table-permissions`: Asignar permisos de tabla

### Frontend

#### Componente LoginModal

- Formulario de login con validación
- Manejo de errores
- Indicador de credenciales por defecto
- Diseño responsive y moderno

#### Componente UserManagement

- Lista de usuarios con información detallada
- Crear nuevos usuarios
- Cambiar contraseñas
- Toggle de estado de administrador
- Eliminar usuarios
- Gestión de permisos por base de datos y tabla
- Interfaz intuitiva para asignar permisos

#### Integración en App.tsx

- Sistema de autenticación completo
- Persistencia de sesión con localStorage
- Navegación entre vistas (Bases de Datos / Gestión de Usuarios)
- Verificación de permisos de administrador

## Sistema de Permisos

### Jerarquía de Permisos

1. **Administrador**: Acceso total a todo el sistema
2. **Permisos de Tabla Específica**: Permisos granulares por tabla
3. **Permisos de Base de Datos**: Permisos generales por base de datos
4. **Sin Permisos**: Sin acceso

### Tipos de Permisos

- **Lectura (CanRead)**: Ver datos de tablas
- **Escritura (CanWrite)**: Editar registros
- **Eliminación (CanDelete)**: Eliminar registros

### Verificación de Permisos

El sistema verifica permisos en este orden:

1. ¿Es administrador? → Acceso total
2. ¿Tiene permisos específicos de tabla? → Usar permisos de tabla
3. ¿Tiene permisos de base de datos? → Usar permisos de BD
4. Sin acceso

## Seguridad

### Contraseñas

- Hash con bcrypt (10 salt rounds)
- Almacenamiento seguro en base de datos
- Verificación segura de credenciales

### Tokens JWT

- Expiración de 24 horas
- Verificación en cada petición
- Middleware de autenticación

### Validación

- Validación de entrada en frontend y backend
- Sanitización de datos
- Manejo de errores seguro

## Uso del Sistema

### 1. Login

1. Acceder a la aplicación
2. Ingresar credenciales (admin/admin por defecto)
3. El sistema redirige al dashboard

### 2. Gestión de Usuarios (Solo Admin)

1. Hacer clic en "Gestión de Usuarios"
2. Ver lista de usuarios existentes
3. Crear nuevos usuarios con botón "Crear Usuario"
4. Gestionar permisos con botón "Permisos"

### 3. Asignar Permisos

1. Seleccionar usuario
2. Hacer clic en "Permisos"
3. Asignar permisos de base de datos:
   - Seleccionar base de datos
   - Marcar permisos (Lectura, Escritura, Eliminación)
   - Hacer clic en "Asignar Permisos de BD"
4. Asignar permisos de tabla específica:
   - Seleccionar base de datos y tabla
   - Marcar permisos
   - Hacer clic en "Asignar Permisos de Tabla"

### 4. Gestión de Usuarios

- **Cambiar Contraseña**: Botón para actualizar contraseña
- **Hacer/Quitar Admin**: Toggle de estado de administrador
- **Eliminar**: Eliminar usuario del sistema

## API Endpoints

### Autenticación

```
POST /api/auth/login
GET /api/auth/verify
```

### Gestión de Usuarios

```
GET /api/auth/users
POST /api/auth/users
PUT /api/auth/users/:userId/password
PUT /api/auth/users/:userId/admin
DELETE /api/auth/users/:userId
```

### Permisos

```
GET /api/auth/users/:userId/permissions
POST /api/auth/users/:userId/database-permissions
POST /api/auth/users/:userId/table-permissions
```

## Archivos Principales

### Backend

- `services/authService.js`: Lógica de autenticación y permisos
- `routes/auth.js`: Rutas de autenticación y gestión de usuarios
- `server.js`: Servidor principal con middleware de autenticación
- `setup_database.js`: Script de configuración de base de datos

### Frontend

- `components/LoginModal.tsx`: Modal de login
- `components/UserManagement.tsx`: Gestión de usuarios
- `App.tsx`: Aplicación principal con autenticación

### Base de Datos

- `create_users_table.sql`: Script SQL para crear tablas

## Consideraciones de Seguridad

1. **Contraseñas**: Siempre hasheadas con bcrypt
2. **Tokens**: JWT con expiración y verificación
3. **Permisos**: Verificación en cada operación
4. **Validación**: Entrada validada en frontend y backend
5. **CORS**: Configurado para desarrollo seguro

## Próximas Mejoras

1. **Auditoría**: Log de acciones de usuarios
2. **Roles**: Sistema de roles predefinidos
3. **Recuperación de contraseña**: Email de reset
4. **Autenticación 2FA**: Factor de autenticación adicional
5. **Sesiones**: Gestión de sesiones múltiples
6. **Backup**: Sistema de backup de usuarios y permisos
