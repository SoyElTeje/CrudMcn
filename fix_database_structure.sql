-- Script para corregir la estructura de la base de datos
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Corrigiendo estructura de la base de datos...';
PRINT '';

-- 1. Renombrar la tabla 'users' a 'USERS_TABLE' para que coincida con el código
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    -- Crear tabla temporal con la estructura correcta
    CREATE TABLE USERS_TABLE (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
        Contrasena VARCHAR(255) NOT NULL,
        EsAdmin BIT DEFAULT 0,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        Activo BIT DEFAULT 1
    );
    
    -- Copiar datos de la tabla users a USERS_TABLE
    INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin, FechaCreacion, Activo)
    SELECT 
        username as NombreUsuario,
        password_hash as Contrasena,
        is_admin as EsAdmin,
        created_at as FechaCreacion,
        1 as Activo
    FROM users;
    
    -- Eliminar la tabla users original
    DROP TABLE users;
    
    PRINT '✅ Tabla users renombrada a USERS_TABLE y datos migrados';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla USERS_TABLE ya existe';
END
ELSE
BEGIN
    -- Crear tabla USERS_TABLE si no existe
    CREATE TABLE USERS_TABLE (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
        Contrasena VARCHAR(255) NOT NULL,
        EsAdmin BIT DEFAULT 0,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        Activo BIT DEFAULT 1
    );
    PRINT '✅ Tabla USERS_TABLE creada';
END

-- 2. Renombrar la tabla 'user_permissions' a 'USER_TABLE_PERMISSIONS'
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_permissions]') AND type in (N'U'))
BEGIN
    -- Crear tabla temporal con la estructura correcta
    CREATE TABLE USER_TABLE_PERMISSIONS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DatabaseName VARCHAR(128) NOT NULL,
        TableName VARCHAR(128) NOT NULL,
        CanRead BIT DEFAULT 0,
        CanCreate BIT DEFAULT 0,
        CanUpdate BIT DEFAULT 0,
        CanDelete BIT DEFAULT 0,
        CanListTables BIT DEFAULT 0,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        FechaModificacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Copiar datos
    INSERT INTO USER_TABLE_PERMISSIONS (UserId, DatabaseName, TableName, CanRead, CanCreate, CanUpdate, CanDelete, CanListTables, FechaCreacion, FechaModificacion)
    SELECT 
        user_id as UserId,
        database_name as DatabaseName,
        table_name as TableName,
        can_read as CanRead,
        can_create as CanCreate,
        can_update as CanUpdate,
        can_delete as CanDelete,
        can_list_tables as CanListTables,
        created_at as FechaCreacion,
        updated_at as FechaModificacion
    FROM user_permissions;
    
    -- Eliminar tabla original
    DROP TABLE user_permissions;
    
    PRINT '✅ Tabla user_permissions renombrada a USER_TABLE_PERMISSIONS y datos migrados';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_TABLE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla USER_TABLE_PERMISSIONS ya existe';
END
ELSE
BEGIN
    -- Crear tabla si no existe
    CREATE TABLE USER_TABLE_PERMISSIONS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DatabaseName VARCHAR(128) NOT NULL,
        TableName VARCHAR(128) NOT NULL,
        CanRead BIT DEFAULT 0,
        CanCreate BIT DEFAULT 0,
        CanUpdate BIT DEFAULT 0,
        CanDelete BIT DEFAULT 0,
        CanListTables BIT DEFAULT 0,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        FechaModificacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla USER_TABLE_PERMISSIONS creada';
END

-- 3. Renombrar la tabla 'activated_tables' a 'ACTIVATED_TABLES'
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activated_tables]') AND type in (N'U'))
BEGIN
    -- Crear tabla temporal
    CREATE TABLE ACTIVATED_TABLES (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DatabaseName VARCHAR(128) NOT NULL,
        TableName VARCHAR(128) NOT NULL,
        IsActive BIT DEFAULT 1,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        FechaModificacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Copiar datos
    INSERT INTO ACTIVATED_TABLES (DatabaseName, TableName, IsActive, FechaCreacion, FechaModificacion)
    SELECT 
        database_name as DatabaseName,
        table_name as TableName,
        is_active as IsActive,
        created_at as FechaCreacion,
        updated_at as FechaModificacion
    FROM activated_tables;
    
    -- Eliminar tabla original
    DROP TABLE activated_tables;
    
    PRINT '✅ Tabla activated_tables renombrada a ACTIVATED_TABLES y datos migrados';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ACTIVATED_TABLES]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla ACTIVATED_TABLES ya existe';
END
ELSE
BEGIN
    -- Crear tabla si no existe
    CREATE TABLE ACTIVATED_TABLES (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DatabaseName VARCHAR(128) NOT NULL,
        TableName VARCHAR(128) NOT NULL,
        IsActive BIT DEFAULT 1,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        FechaModificacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla ACTIVATED_TABLES creada';
END

-- 4. Renombrar la tabla 'logs' a 'LOGS'
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logs]') AND type in (N'U'))
BEGIN
    -- Crear tabla temporal
    CREATE TABLE LOGS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT,
        Action VARCHAR(100) NOT NULL,
        TableName VARCHAR(128),
        DatabaseName VARCHAR(128),
        RecordId VARCHAR(100),
        Details TEXT,
        IpAddress VARCHAR(45),
        UserAgent TEXT,
        FechaCreacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Copiar datos
    INSERT INTO LOGS (UserId, Action, TableName, DatabaseName, RecordId, Details, IpAddress, UserAgent, FechaCreacion)
    SELECT 
        user_id as UserId,
        action as Action,
        table_name as TableName,
        database_name as DatabaseName,
        record_id as RecordId,
        details as Details,
        ip_address as IpAddress,
        user_agent as UserAgent,
        created_at as FechaCreacion
    FROM logs;
    
    -- Eliminar tabla original
    DROP TABLE logs;
    
    PRINT '✅ Tabla logs renombrada a LOGS y datos migrados';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGS]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla LOGS ya existe';
END
ELSE
BEGIN
    -- Crear tabla si no existe
    CREATE TABLE LOGS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT,
        Action VARCHAR(100) NOT NULL,
        TableName VARCHAR(128),
        DatabaseName VARCHAR(128),
        RecordId VARCHAR(100),
        Details TEXT,
        IpAddress VARCHAR(45),
        UserAgent TEXT,
        FechaCreacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla LOGS creada';
END

-- 5. Crear índices para mejorar el rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USERS_TABLE_NombreUsuario')
BEGIN
    CREATE INDEX IX_USERS_TABLE_NombreUsuario ON USERS_TABLE(NombreUsuario);
    PRINT '✅ Índice IX_USERS_TABLE_NombreUsuario creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_TABLE_PERMISSIONS_UserId')
BEGIN
    CREATE INDEX IX_USER_TABLE_PERMISSIONS_UserId ON USER_TABLE_PERMISSIONS(UserId);
    PRINT '✅ Índice IX_USER_TABLE_PERMISSIONS_UserId creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ACTIVATED_TABLES_DB_Table')
BEGIN
    CREATE INDEX IX_ACTIVATED_TABLES_DB_Table ON ACTIVATED_TABLES(DatabaseName, TableName);
    PRINT '✅ Índice IX_ACTIVATED_TABLES_DB_Table creado';
END

-- 6. Verificar estructura final
PRINT '';
PRINT '========================================';
PRINT 'ESTRUCTURA DE BASE DE DATOS CORREGIDA';
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
PRINT '🎉 Estructura de base de datos corregida exitosamente!';
PRINT 'Ahora las tablas coinciden con lo que espera el código del backend.';
PRINT '';
PRINT 'Tablas creadas/renombradas:';
PRINT '- USERS_TABLE (usuarios del sistema)';
PRINT '- USER_TABLE_PERMISSIONS (permisos de usuarios)';
PRINT '- ACTIVATED_TABLES (tablas activadas)';
PRINT '- LOGS (registro de actividades)';
