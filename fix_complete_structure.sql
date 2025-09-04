-- Script completo para corregir estructura de base de datos
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Corrigiendo estructura completa de la base de datos...';
PRINT '';

-- 1. Crear tabla USERS_TABLE con la estructura correcta
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    DROP TABLE USERS_TABLE;
    PRINT '✅ Tabla USERS_TABLE existente eliminada';
END

CREATE TABLE USERS_TABLE (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    EsAdmin BIT DEFAULT 0,
    FechaCreacion DATETIME2 DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);
PRINT '✅ Tabla USERS_TABLE creada con estructura correcta';

-- 2. Migrar datos de users_table a USERS_TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users_table]') AND type in (N'U'))
BEGIN
    INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin, FechaCreacion, Activo)
    SELECT 
        username as NombreUsuario,
        password_hash as Contrasena,
        is_admin as EsAdmin,
        created_at as FechaCreacion,
        1 as Activo
    FROM users_table;
    
    PRINT '✅ Datos migrados de users_table a USERS_TABLE';
    
    -- Eliminar tabla antigua
    DROP TABLE users_table;
    PRINT '✅ Tabla users_table eliminada';
END

-- 3. Crear tabla USER_TABLE_PERMISSIONS con estructura correcta
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_TABLE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    DROP TABLE USER_TABLE_PERMISSIONS;
    PRINT '✅ Tabla USER_TABLE_PERMISSIONS existente eliminada';
END

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
PRINT '✅ Tabla USER_TABLE_PERMISSIONS creada con estructura correcta';

-- 4. Migrar datos de user_permissions a USER_TABLE_PERMISSIONS
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_permissions]') AND type in (N'U'))
BEGIN
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
    
    PRINT '✅ Datos migrados de user_permissions a USER_TABLE_PERMISSIONS';
    
    -- Eliminar tabla antigua
    DROP TABLE user_permissions;
    PRINT '✅ Tabla user_permissions eliminada';
END

-- 5. Crear tabla ACTIVATED_TABLES con estructura correcta
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ACTIVATED_TABLES]') AND type in (N'U'))
BEGIN
    DROP TABLE ACTIVATED_TABLES;
    PRINT '✅ Tabla ACTIVATED_TABLES existente eliminada';
END

CREATE TABLE ACTIVATED_TABLES (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DatabaseName VARCHAR(128) NOT NULL,
    TableName VARCHAR(128) NOT NULL,
    IsActive BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETDATE(),
    FechaModificacion DATETIME2 DEFAULT GETDATE()
);
PRINT '✅ Tabla ACTIVATED_TABLES creada con estructura correcta';

-- 6. Migrar datos de activated_tables a ACTIVATED_TABLES
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activated_tables]') AND type in (N'U'))
BEGIN
    INSERT INTO ACTIVATED_TABLES (DatabaseName, TableName, IsActive, FechaCreacion, FechaModificacion)
    SELECT 
        database_name as DatabaseName,
        table_name as TableName,
        is_active as IsActive,
        created_at as FechaCreacion,
        updated_at as FechaModificacion
    FROM activated_tables;
    
    PRINT '✅ Datos migrados de activated_tables a ACTIVATED_TABLES';
    
    -- Eliminar tabla antigua
    DROP TABLE activated_tables;
    PRINT '✅ Tabla activated_tables eliminada';
END

-- 7. Crear tabla LOGS con estructura correcta
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGS]') AND type in (N'U'))
BEGIN
    DROP TABLE LOGS;
    PRINT '✅ Tabla LOGS existente eliminada';
END

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
PRINT '✅ Tabla LOGS creada con estructura correcta';

-- 8. Migrar datos de logs a LOGS
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logs]') AND type in (N'U'))
BEGIN
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
    
    PRINT '✅ Datos migrados de logs a LOGS';
    
    -- Eliminar tabla antigua
    DROP TABLE logs;
    PRINT '✅ Tabla logs eliminada';
END

-- 9. Crear índices para mejorar el rendimiento
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

-- 10. Verificar estructura final
PRINT '';
PRINT '========================================';
PRINT 'ESTRUCTURA COMPLETA CORREGIDA';
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
PRINT 'Ahora las tablas Y columnas coinciden con lo que espera el código del backend.';
PRINT '';
PRINT 'Tablas creadas con estructura correcta:';
PRINT '- USERS_TABLE (con columnas: Id, NombreUsuario, Contrasena, EsAdmin, FechaCreacion, Activo)';
PRINT '- USER_TABLE_PERMISSIONS (con columnas: Id, UserId, DatabaseName, TableName, CanRead, CanCreate, CanUpdate, CanDelete, CanListTables, FechaCreacion, FechaModificacion)';
PRINT '- ACTIVATED_TABLES (con columnas: Id, DatabaseName, TableName, IsActive, FechaCreacion, FechaModificacion)';
PRINT '- LOGS (con columnas: Id, UserId, Action, TableName, DatabaseName, RecordId, Details, IpAddress, UserAgent, FechaCreacion)';
PRINT '';
PRINT 'Próximo paso: Reiniciar el backend para que funcione correctamente.';
