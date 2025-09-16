-- Script simple para renombrar las tablas existentes
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Renombrando tablas para que coincidan con el código del backend...';
PRINT '';

-- 1. Renombrar users_table a USERS_TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users_table]') AND type in (N'U'))
BEGIN
    EXEC sp_rename 'users_table', 'USERS_TABLE';
    PRINT '✅ Tabla users_table renombrada a USERS_TABLE';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla USERS_TABLE ya existe';
END
ELSE
BEGIN
    PRINT '❌ No se encontró la tabla users_table';
END

-- 2. Renombrar user_permissions a USER_TABLE_PERMISSIONS
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_permissions]') AND type in (N'U'))
BEGIN
    EXEC sp_rename 'user_permissions', 'USER_TABLE_PERMISSIONS';
    PRINT '✅ Tabla user_permissions renombrada a USER_TABLE_PERMISSIONS';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_TABLE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla USER_TABLE_PERMISSIONS ya existe';
END
ELSE
BEGIN
    PRINT '❌ No se encontró la tabla user_permissions';
END

-- 3. Renombrar activated_tables a ACTIVATED_TABLES
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activated_tables]') AND type in (N'U'))
BEGIN
    EXEC sp_rename 'activated_tables', 'ACTIVATED_TABLES';
    PRINT '✅ Tabla activated_tables renombrada a ACTIVATED_TABLES';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ACTIVATED_TABLES]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla ACTIVATED_TABLES ya existe';
END
ELSE
BEGIN
    PRINT '❌ No se encontró la tabla activated_tables';
END

-- 4. Renombrar logs a LOGS
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logs]') AND type in (N'U'))
BEGIN
    EXEC sp_rename 'logs', 'LOGS';
    PRINT '✅ Tabla logs renombrada a LOGS';
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGS]') AND type in (N'U'))
BEGIN
    PRINT '✅ Tabla LOGS ya existe';
END
ELSE
BEGIN
    PRINT '❌ No se encontró la tabla logs';
END

-- 5. Verificar estructura final
PRINT '';
PRINT '========================================';
PRINT 'TABLAS RENOMBRADAS EXITOSAMENTE';
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
PRINT '🎉 Renombrado completado!';
PRINT 'Ahora las tablas coinciden con lo que espera el código del backend.';
PRINT '';
PRINT 'Próximo paso: Reiniciar el backend para que funcione correctamente.';















