# 📡 API Documentation - AbmMcn

## 📋 Información General

La API de AbmMcn proporciona endpoints RESTful para la gestión de bases de datos, usuarios y permisos. Todos los endpoints requieren autenticación JWT excepto los endpoints de health check.

### Base URL
```
Development: http://localhost:3001
Production:  https://your-domain.com
```

### Autenticación
```http
Authorization: Bearer <jwt_token>
```

### Formato de Respuesta
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2024-12-05T10:30:00.000Z"
}
```

### Códigos de Estado HTTP
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 Autenticación

### POST /api/auth/login
Autentica un usuario y retorna un token JWT.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "isAdmin": true,
      "createdAt": "2024-12-05T10:30:00.000Z"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "code": "INVALID_CREDENTIALS"
}
```

---

## 👥 Gestión de Usuarios

### GET /api/auth/users
Lista todos los usuarios del sistema.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "isAdmin": 1,
        "createdAt": "2024-12-05T10:30:00.000Z"
      },
      {
        "id": 2,
        "username": "user1",
        "isAdmin": 0,
        "createdAt": "2024-12-05T11:00:00.000Z"
      }
    ]
  }
}
```

### POST /api/auth/users
Crea un nuevo usuario.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "isAdmin": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 3,
    "username": "newuser",
    "isAdmin": false,
    "createdAt": "2024-12-05T12:00:00.000Z"
  }
}
```

### PUT /api/auth/users/:userId/password
Actualiza la contraseña de un usuario.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 🔑 Gestión de Permisos

### POST /api/auth/users/:userId/database-permissions
Asigna permisos de base de datos a un usuario.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "databaseName": "BD_ABM1",
  "permissions": ["read", "write", "create", "delete"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permisos de base de datos asignados exitosamente"
}
```

### POST /api/auth/users/:userId/table-permissions
Asigna permisos de tabla específica a un usuario.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "databaseName": "BD_ABM1",
  "tableName": "Maquinas",
  "permissions": ["read", "write"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permisos de tabla asignados exitosamente"
}
```

### GET /api/auth/users/:userId/permissions
Obtiene los permisos de un usuario.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "databasePermissions": [
      {
        "databaseName": "BD_ABM1",
        "canRead": true,
        "canWrite": true,
        "canCreate": false,
        "canDelete": false
      }
    ],
    "tablePermissions": [
      {
        "databaseName": "BD_ABM1",
        "tableName": "Maquinas",
        "canRead": true,
        "canWrite": true,
        "canCreate": false,
        "canDelete": false
      }
    ]
  }
}
```

---

## 🏥 Health Checks

### GET /api/health
Estado básico de salud del sistema.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-05T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

### GET /api/health/detailed
Estado detallado de salud del sistema.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-05T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "used": 45.2,
    "total": 128.0,
    "external": 2.1
  },
  "database": {
    "status": "connected",
    "pools": {
      "total": 2,
      "active": 1,
      "idle": 1
    }
  }
}
```

### GET /api/health/pools
Estadísticas de los pools de conexión de base de datos.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "pools": {
    "BD_ABM1": {
      "totalConnections": 5,
      "activeConnections": 2,
      "idleConnections": 3,
      "waitingRequests": 0
    },
    "BD_ABM2": {
      "totalConnections": 3,
      "activeConnections": 1,
      "idleConnections": 2,
      "waitingRequests": 0
    }
  }
}
```

### POST /api/health/pools/:dbName/reconnect
Reconecta el pool de conexión de una base de datos específica.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pool de BD_ABM1 reconectado exitosamente"
}
```

### GET /api/health/metrics
Métricas de rendimiento del sistema.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "metrics": {
    "requests": {
      "total": 1250,
      "perMinute": 45,
      "averageResponseTime": 120
    },
    "errors": {
      "total": 12,
      "rate": 0.96
    },
    "database": {
      "queriesPerSecond": 15,
      "averageQueryTime": 85
    }
  }
}
```

---

## 📊 Gestión de Datos

### GET /api/data/databases
Lista todas las bases de datos disponibles.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "databases": [
      {
        "name": "BD_ABM1",
        "tables": 15,
        "size": "2.5 GB"
      },
      {
        "name": "BD_ABM2",
        "tables": 8,
        "size": "1.2 GB"
      }
    ]
  }
}
```

### GET /api/data/databases/:dbName/tables
Lista las tablas de una base de datos específica.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "Maquinas",
        "rows": 1250,
        "columns": 8
      },
      {
        "name": "Usuarios",
        "rows": 45,
        "columns": 5
      }
    ]
  }
}
```

### GET /api/data/databases/:dbName/tables/:tableName
Obtiene los datos de una tabla específica.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 50)
- `sort` (optional): Campo de ordenamiento
- `order` (optional): Dirección de ordenamiento (asc/desc)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "nombre": "Máquina 1",
        "tipo": "Producción",
        "estado": "Activa"
      },
      {
        "id": 2,
        "nombre": "Máquina 2",
        "tipo": "Mantenimiento",
        "estado": "Inactiva"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "pages": 25
    }
  }
}
```

### POST /api/data/databases/:dbName/tables/:tableName
Inserta un nuevo registro en la tabla.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "data": {
    "nombre": "Máquina Nueva",
    "tipo": "Producción",
    "estado": "Activa"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registro creado exitosamente",
  "data": {
    "id": 1251,
    "nombre": "Máquina Nueva",
    "tipo": "Producción",
    "estado": "Activa"
  }
}
```

### PUT /api/data/databases/:dbName/tables/:tableName/:id
Actualiza un registro existente.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "data": {
    "nombre": "Máquina Actualizada",
    "estado": "Mantenimiento"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registro actualizado exitosamente",
  "data": {
    "id": 1251,
    "nombre": "Máquina Actualizada",
    "tipo": "Producción",
    "estado": "Mantenimiento"
  }
}
```

### DELETE /api/data/databases/:dbName/tables/:tableName/:id
Elimina un registro.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registro eliminado exitosamente"
}
```

---

## 📋 Logs y Auditoría

### GET /api/logs
Obtiene los logs del sistema.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `level` (optional): Nivel de log (debug, info, warn, error)
- `startDate` (optional): Fecha de inicio (YYYY-MM-DD)
- `endDate` (optional): Fecha de fin (YYYY-MM-DD)
- `page` (optional): Número de página
- `limit` (optional): Elementos por página

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "level": "info",
        "message": "Usuario admin inició sesión",
        "timestamp": "2024-12-05T10:30:00.000Z",
        "userId": 1,
        "category": "auth"
      },
      {
        "id": 2,
        "level": "info",
        "message": "Registro creado en BD_ABM1.Maquinas",
        "timestamp": "2024-12-05T10:35:00.000Z",
        "userId": 1,
        "category": "crud"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "pages": 25
    }
  }
}
```

---

## 📁 Importación/Exportación

### POST /api/export/databases/:dbName/tables/:tableName
Exporta los datos de una tabla a Excel.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `format` (optional): Formato de exportación (excel, csv)

**Response (200):**
```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="tabla_export.xlsx"

[Binary Excel file content]
```

### POST /api/import/databases/:dbName/tables/:tableName
Importa datos desde un archivo Excel.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```form-data
file: [Excel file]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Archivo importado exitosamente",
  "data": {
    "importedRows": 150,
    "errors": 0,
    "warnings": 2
  }
}
```

---

## ⚠️ Códigos de Error

### Errores de Validación (400)
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "username",
      "message": "El nombre de usuario es requerido"
    }
  ]
}
```

### Errores de Autenticación (401)
```json
{
  "success": false,
  "message": "Token JWT inválido o expirado",
  "code": "JWT_ERROR"
}
```

### Errores de Autorización (403)
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción",
  "code": "PERMISSION_DENIED"
}
```

### Errores de Base de Datos (500)
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "code": "DATABASE_ERROR",
  "details": "Connection timeout"
}
```

---

## 🔧 Rate Limiting

La API implementa rate limiting para prevenir abuso:

- **Autenticación**: 5 requests por minuto por IP
- **API General**: 100 requests por minuto por usuario
- **Exportación**: 10 requests por minuto por usuario

**Headers de Rate Limit:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📚 Ejemplos de Uso

### Ejemplo: Flujo completo de autenticación y operación

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { data: { token } } = await loginResponse.json();

// 2. Obtener datos con autenticación
const dataResponse = await fetch('/api/data/databases/BD_ABM1/tables/Maquinas', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await dataResponse.json();
console.log(data);
```

### Ejemplo: Crear usuario y asignar permisos

```javascript
// 1. Crear usuario
const createUserResponse = await fetch('/api/auth/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    username: 'newuser',
    password: 'password123',
    isAdmin: false
  })
});

const { data: { id: userId } } = await createUserResponse.json();

// 2. Asignar permisos de base de datos
await fetch(`/api/auth/users/${userId}/database-permissions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    databaseName: 'BD_ABM1',
    permissions: ['read', 'write']
  })
});
```

---

_Última actualización: Diciembre 2024_  
_Versión: 1.0.0_
