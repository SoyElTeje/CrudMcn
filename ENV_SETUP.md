# Configuración de Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

## Variables Requeridas

```env
# Configuración de la base de datos principal
DB_SERVER=localhost
DB_DATABASE=AbmMcnApp
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Tabla de usuarios
USERS_TABLE=Usuario

# Usuario administrador
ADMIN_USER=admin
ADMIN_PASS=SA6ey^MQ67

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173

# Puerto del servidor
PORT=3001
```

## Descripción de Variables

### Base de Datos

- `DB_SERVER`: Servidor SQL Server
- `DB_DATABASE`: Base de datos donde se guardarán los usuarios de la aplicación
- `DB_USER`: Usuario de SQL Server
- `DB_PASSWORD`: Contraseña de SQL Server
- `DB_ENCRYPT`: Habilitar encriptación (true/false)
- `DB_TRUST_SERVER_CERTIFICATE`: Confiar en certificado del servidor (true/false)

### Aplicación

- `USERS_TABLE`: Nombre de la tabla donde se guardarán los usuarios (debe ser "Usuario")
- `ADMIN_USER`: Nombre de usuario del administrador
- `ADMIN_PASS`: Contraseña del administrador (se hasheará automáticamente)
- `CORS_ORIGIN`: Origen permitido para CORS
- `PORT`: Puerto donde correrá el servidor

## Estructura de la Tabla Usuario

La tabla debe tener la siguiente estructura:

```sql
CREATE TABLE Usuario (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) NOT NULL,
    Contrasena NVARCHAR(255) NOT NULL,
    EsAdmin BIT NOT NULL DEFAULT 0
)
```

## Instalación

1. Copia el contenido anterior a un archivo `.env` en `backend/`
2. Ajusta los valores según tu configuración
3. Asegúrate de que la tabla `Usuario` existe con la estructura correcta
4. Ejecuta `npm install` en la carpeta `backend/`
5. Ejecuta `node initAppDb.js` para crear el usuario administrador
6. Ejecuta `npm start` para iniciar el servidor

## Usuario Administrador

El sistema creará automáticamente un usuario administrador con:

- **Usuario**: El valor de `ADMIN_USER`
- **Contraseña**: El valor de `ADMIN_PASS`
- **Permisos**: Acceso completo a todas las bases de datos y tablas (EsAdmin = 1)

## Endpoints de Autenticación

### Login

- **POST** `/api/auth/login`
- **Body**: `{ "username": "admin", "password": "SA6ey^MQ67" }`
- **Response**: `{ "success": true, "user": { "userId": 1, "username": "admin", "isAdmin": true } }`

### Obtener Bases de Datos (Solo Admin)

- **GET** `/api/databases`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "databases": ["db1", "db2", ...] }`

### Obtener Tablas (Solo Admin)

- **GET** `/api/databases/:dbName/tables`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "tables": [{ "schema": "dbo", "name": "table1" }, ...] }`

## Endpoints de Gestión de Usuarios (Solo Admin)

### Obtener Usuarios

- **GET** `/api/users`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "users": [...] }`

### Crear Usuario

- **POST** `/api/users`
- **Headers**: `Authorization: Bearer admin`
- **Body**: `{ "username": "usuario1", "password": "password123", "isAdmin": false }`
- **Response**: `{ "success": true, "message": "Usuario creado exitosamente", "user": {...} }`

### Actualizar Contraseña

- **PUT** `/api/users/:userId/password`
- **Headers**: `Authorization: Bearer admin`
- **Body**: `{ "newPassword": "nueva123" }`
- **Response**: `{ "success": true, "message": "Contraseña actualizada exitosamente" }`

### Eliminar Usuario

- **DELETE** `/api/users/:userId`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "message": "Usuario eliminado exitosamente" }`

### Obtener Permisos de Usuario

- **GET** `/api/users/:userId/permissions`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "permissions": { "databases": [...], "tables": [...] } }`

### Asignar Permiso de Base de Datos

- **POST** `/api/users/:userId/permissions/databases`
- **Headers**: `Authorization: Bearer admin`
- **Body**: `{ "databaseName": "BD_ABM1" }`
- **Response**: `{ "success": true, "message": "Permiso asignado correctamente" }`

### Asignar Permiso de Tabla

- **POST** `/api/users/:userId/permissions/tables`
- **Headers**: `Authorization: Bearer admin`
- **Body**: `{ "databaseName": "BD_ABM1", "tableName": "Usuarios", "schemaName": "dbo" }`
- **Response**: `{ "success": true, "message": "Permiso asignado correctamente" }`

### Remover Permiso de Base de Datos

- **DELETE** `/api/users/:userId/permissions/databases/:databaseName`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "message": "Permiso removido correctamente" }`

### Remover Permiso de Tabla

- **DELETE** `/api/users/:userId/permissions/tables/:databaseName/:tableName`
- **Headers**: `Authorization: Bearer admin`
- **Response**: `{ "success": true, "message": "Permiso removido correctamente" }`

## Sistema de Permisos

### Tipos de Usuario

- **Administrador**: Acceso completo a todas las bases de datos y tablas
- **Usuario Normal**: Acceso solo a las bases de datos y tablas específicamente asignadas

### Estructura de Permisos

- **PermisosBasesDatos**: Almacena permisos de acceso a bases de datos específicas
- **PermisosTablas**: Almacena permisos de acceso a tablas específicas

### Jerarquía de Permisos

1. Los administradores tienen acceso completo automáticamente
2. Los usuarios normales solo ven las bases de datos y tablas asignadas
3. Los permisos se pueden asignar a nivel de base de datos o tabla específica
