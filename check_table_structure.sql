-- Script para verificar la estructura actual de las tablas
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔍 VERIFICANDO ESTRUCTURA ACTUAL DE LAS TABLAS';
PRINT '===============================================';
PRINT '';

-- Verificar qué tablas existen
PRINT '1. TABLAS EXISTENTES:';
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    TABLE_SCHEMA
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

PRINT '';

-- Verificar estructura de la tabla de usuarios
PRINT '2. ESTRUCTURA DE LA TABLA DE USUARIOS:';
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "users" existe:';
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' 
    AND TABLE_SCHEMA = 'dbo'
    ORDER BY ORDINAL_POSITION;
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "USERS_TABLE" existe:';
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'USERS_TABLE' 
    AND TABLE_SCHEMA = 'dbo'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '   ❌ No existe ninguna tabla de usuarios';
END

PRINT '';

-- Verificar datos en la tabla de usuarios
PRINT '3. DATOS EN LA TABLA DE USUARIOS:';
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    PRINT '   Datos en tabla "users":';
    SELECT TOP 5 * FROM users;
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    PRINT '   Datos en tabla "USERS_TABLE":';
    SELECT TOP 5 * FROM USERS_TABLE;
END

PRINT '';

-- Verificar estructura de otras tablas
PRINT '4. ESTRUCTURA DE OTRAS TABLAS:';

-- Tabla de permisos
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_permissions]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "user_permissions" existe';
    SELECT COUNT(*) as total_permisos FROM user_permissions;
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_TABLE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "USER_TABLE_PERMISSIONS" existe';
    SELECT COUNT(*) as total_permisos FROM USER_TABLE_PERMISSIONS;
END
ELSE
BEGIN
    PRINT '   ❌ No existe tabla de permisos';
END

-- Tabla de tablas activadas
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activated_tables]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "activated_tables" existe';
    SELECT COUNT(*) as total_tablas FROM activated_tables;
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ACTIVATED_TABLES]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "ACTIVATED_TABLES" existe';
    SELECT COUNT(*) as total_tablas FROM ACTIVATED_TABLES;
END
ELSE
BEGIN
    PRINT '   ❌ No existe tabla de tablas activadas';
END

-- Tabla de logs
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logs]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "logs" existe';
    SELECT COUNT(*) as total_logs FROM logs;
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGS]') AND type in (N'U'))
BEGIN
    PRINT '   Tabla "LOGS" existe';
    SELECT COUNT(*) as total_logs FROM LOGS;
END
ELSE
BEGIN
    PRINT '   ❌ No existe tabla de logs';
END

PRINT '';
PRINT '===============================================';
PRINT 'DIAGNÓSTICO COMPLETADO';
PRINT '===============================================';
PRINT '';
PRINT '💡 Si las tablas tienen nombres antiguos (users, user_permissions, etc.),';
PRINT '   ejecuta el script fix_database_structure.sql para corregirlas.';
PRINT '';
PRINT '💡 Si las tablas tienen nombres nuevos pero columnas incorrectas,';
PRINT '   puede haber un problema en la migración.';
