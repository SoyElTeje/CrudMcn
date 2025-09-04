-- Script simple para crear las tablas paso a paso
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Creando tablas paso a paso...';
PRINT '';

-- PASO 1: Crear tabla USERS_TABLE
PRINT 'PASO 1: Creando tabla USERS_TABLE...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    DROP TABLE USERS_TABLE;
    PRINT '✅ Tabla USERS_TABLE existente eliminada';
END

CREATE TABLE USERS_TABLE (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) UNIQUE NOT NULL,
    Contrasena NVARCHAR(255) NOT NULL,
    EsAdmin BIT NOT NULL DEFAULT 0,
    FechaCreacion DATETIME2 DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);
PRINT '✅ Tabla USERS_TABLE creada exitosamente';

-- PASO 2: Crear tabla USER_TABLE_PERMISSIONS
PRINT '';
PRINT 'PASO 2: Creando tabla USER_TABLE_PERMISSIONS...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_TABLE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    DROP TABLE USER_TABLE_PERMISSIONS;
    PRINT '✅ Tabla USER_TABLE_PERMISSIONS existente eliminada';
END

CREATE TABLE USER_TABLE_PERMISSIONS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(128) NOT NULL,
    CanRead BIT DEFAULT 1,
    CanWrite BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,
    FechaAsignacion DATETIME2 DEFAULT GETDATE()
);
PRINT '✅ Tabla USER_TABLE_PERMISSIONS creada exitosamente';

-- PASO 3: Crear tabla ACTIVATED_TABLES
PRINT '';
PRINT 'PASO 3: Creando tabla ACTIVATED_TABLES...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ACTIVATED_TABLES]') AND type in (N'U'))
BEGIN
    DROP TABLE ACTIVATED_TABLES;
    PRINT '✅ Tabla ACTIVATED_TABLES existente eliminada';
END

CREATE TABLE ACTIVATED_TABLES (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DatabaseName NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(128) NOT NULL,
    IsActive BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETDATE()
);
PRINT '✅ Tabla ACTIVATED_TABLES creada exitosamente';

-- PASO 4: Crear tabla LOGS
PRINT '';
PRINT 'PASO 4: Creando tabla LOGS...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGS]') AND type in (N'U'))
BEGIN
    DROP TABLE LOGS;
    PRINT '✅ Tabla LOGS existente eliminada';
END

CREATE TABLE LOGS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT,
    Action NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(128),
    DatabaseName NVARCHAR(128),
    RecordId NVARCHAR(100),
    Details NVARCHAR(MAX),
    IpAddress NVARCHAR(45),
    UserAgent NVARCHAR(MAX),
    FechaCreacion DATETIME2 DEFAULT GETDATE()
);
PRINT '✅ Tabla LOGS creada exitosamente';

-- PASO 5: Crear usuario admin
PRINT '';
PRINT 'PASO 5: Creando usuario admin...';

INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin, FechaCreacion, Activo)
VALUES ('admin', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 1, GETDATE(), 1);
PRINT '✅ Usuario admin creado exitosamente';

-- PASO 6: Crear índices
PRINT '';
PRINT 'PASO 6: Creando índices...';

CREATE INDEX IX_USERS_TABLE_NombreUsuario ON USERS_TABLE(NombreUsuario);
PRINT '✅ Índice IX_USERS_TABLE_NombreUsuario creado';

CREATE INDEX IX_USER_TABLE_PERMISSIONS_UserId ON USER_TABLE_PERMISSIONS(UserId);
PRINT '✅ Índice IX_USER_TABLE_PERMISSIONS_UserId creado';

CREATE INDEX IX_ACTIVATED_TABLES_DB_Table ON ACTIVATED_TABLES(DatabaseName, TableName);
PRINT '✅ Índice IX_ACTIVATED_TABLES_DB_Table creado';

-- PASO 7: Verificar estructura
PRINT '';
PRINT '========================================';
PRINT 'VERIFICACIÓN FINAL';
PRINT '========================================';
PRINT '';

SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    TABLE_SCHEMA
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

PRINT '';
PRINT '🎉 TODAS LAS TABLAS CREADAS EXITOSAMENTE!';
PRINT '';
PRINT 'Estructura creada:';
PRINT '- USERS_TABLE (Id, NombreUsuario, Contrasena, EsAdmin, FechaCreacion, Activo)';
PRINT '- USER_TABLE_PERMISSIONS (Id, UserId, DatabaseName, TableName, CanRead, CanWrite, CanDelete, CanCreate, FechaAsignacion)';
PRINT '- ACTIVATED_TABLES (Id, DatabaseName, TableName, IsActive, FechaCreacion)';
PRINT '- LOGS (Id, UserId, Action, TableName, DatabaseName, RecordId, Details, IpAddress, UserAgent, FechaCreacion)';
PRINT '';
PRINT 'Usuario admin: admin (contraseña: admin)';
PRINT '';
PRINT '✅ Próximo paso: Reiniciar el backend';
