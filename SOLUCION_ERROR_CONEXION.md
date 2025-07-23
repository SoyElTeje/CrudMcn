# Solución al Error de Conexión Cerrada

## Problema Identificado

El error `ConnectionError: Connection is closed` ocurre porque:

1. **Configuración inconsistente**: Las configuraciones de conexión entre archivos no eran consistentes
2. **Manejo de conexiones**: No se manejaban correctamente las conexiones a la base de datos
3. **Variables de entorno faltantes**: Faltaban variables importantes en el archivo `.env`

## Soluciones Implementadas

### 1. Configuración de Conexión Consistente

Se actualizaron los archivos `initPermissions.js` e `initAppDb.js` para usar:

- Configuración de pool consistente
- Manejo seguro de conexiones con `try/catch/finally`
- Cierre apropiado de conexiones

### 2. Variables de Entorno

Se agregaron las siguientes variables al archivo `env.example`:

```env
# Database Security Settings
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Application Tables
USERS_TABLE=Usuarios
ADMIN_USER=admin
ADMIN_PASS=admin123
```

### 3. Script de Prueba

Se creó `testDbConnections.js` para verificar la conectividad.

## Pasos para Solucionar

### Paso 1: Crear archivo .env

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=simpleDev!
DB_DATABASE=APPDATA

# Trial Database and Table (for testing)
TRIAL_DB=BD_ABM1
TRIAL_TABLE=Maquinas

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Configuration (for future authentication)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info

# Database Security Settings
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Application Tables
USERS_TABLE=Usuarios
ADMIN_USER=admin
ADMIN_PASS=admin123
```

### Paso 2: Configurar la Base de Datos

Ejecuta el script SQL `setupTestDbs.sql` en tu SQL Server para crear la tabla de usuarios:

```sql
USE APPDATA;
GO

-- Crear tabla de usuarios si no existe
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' AND xtype='U')
BEGIN
    CREATE TABLE Usuarios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NombreUsuario NVARCHAR(50) NOT NULL UNIQUE,
        Contrasena NVARCHAR(255) NOT NULL,
        EsAdmin BIT DEFAULT 0,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        Activo BIT DEFAULT 1
    );
END
```

### Paso 3: Probar la Conexión

Ejecuta el script de prueba:

```bash
cd backend
node testDbConnections.js
```

### Paso 4: Ejecutar el Servidor

Una vez que la prueba de conexión sea exitosa, ejecuta el servidor:

```bash
cd backend
npm start
```

## Verificación

El servidor debería iniciar sin errores y mostrar:

```
🔧 Inicializando base de datos de la aplicación...
✅ Tabla Usuarios encontrada
ℹ️ Usuario administrador 'admin' ya existe
🎉 Base de datos de la aplicación inicializada correctamente
🔧 Inicializando sistema de permisos...
✅ Tabla PermisosBasesDatos creada/verificada
✅ Tabla PermisosTablas creada/verificada
✅ Índices creados/verificados
🎉 Sistema de permisos inicializado correctamente
🚀 Server running on port 3001
```

## Credenciales por Defecto

- **Usuario**: admin
- **Contraseña**: admin123

## Notas Importantes

1. **Seguridad**: Cambia las credenciales por defecto en producción
2. **Base de Datos**: Asegúrate de que SQL Server esté ejecutándose y accesible
3. **Puerto**: Verifica que el puerto 1433 esté disponible para SQL Server
4. **Firewall**: Asegúrate de que el firewall permita conexiones al puerto de SQL Server
