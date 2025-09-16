-- Script simplificado para otorgar permisos en BI_Editor
-- Ejecutar este script como administrador en SQL Server

USE BI_Editor;
GO

-- Crear usuario en la base de datos BI_Editor (si no existe)
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    CREATE USER app_user FOR LOGIN app_user;
    PRINT 'Usuario app_user creado en BI_Editor';
END
ELSE
BEGIN
    PRINT 'Usuario app_user ya existe en BI_Editor';
END

-- Otorgar permisos básicos sobre el esquema dbo
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO app_user;
GRANT EXECUTE ON SCHEMA::dbo TO app_user;
GRANT VIEW DEFINITION ON SCHEMA::dbo TO app_user;
PRINT 'Permisos básicos otorgados sobre esquema dbo';

-- Otorgar permisos para crear objetos
GRANT CREATE TABLE TO app_user;
GRANT CREATE VIEW TO app_user;
GRANT CREATE PROCEDURE TO app_user;
GRANT CREATE FUNCTION TO app_user;
PRINT 'Permisos de creación otorgados';

-- Otorgar permisos para modificar esquema
GRANT ALTER ON SCHEMA::dbo TO app_user;
PRINT 'Permisos de modificación otorgados';

-- Otorgar permisos para ver definiciones de base de datos
GRANT VIEW DEFINITION ON DATABASE::BI_Editor TO app_user;
PRINT 'Permisos de visualización de definiciones otorgados';

-- Crear un rol específico para BI_Editor si no existe
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'bi_editor_role' AND type = 'R')
BEGIN
    CREATE ROLE bi_editor_role;
    PRINT 'Rol bi_editor_role creado en BI_Editor';
END

-- Agregar usuario al rol
EXEC sp_addrolemember 'bi_editor_role', 'app_user';
PRINT 'Usuario app_user agregado al rol bi_editor_role';

-- Otorgar permisos al rol
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO bi_editor_role;
GRANT EXECUTE ON SCHEMA::dbo TO bi_editor_role;
GRANT CREATE TABLE TO bi_editor_role;
GRANT CREATE VIEW TO bi_editor_role;
GRANT CREATE PROCEDURE TO bi_editor_role;
GRANT CREATE FUNCTION TO bi_editor_role;
GRANT ALTER ON SCHEMA::dbo TO bi_editor_role;
PRINT 'Permisos otorgados al rol bi_editor_role';

-- Otorgar permisos específicos sobre todas las tablas existentes
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql = @sql + 
    'GRANT SELECT, INSERT, UPDATE, DELETE ON [' + SCHEMA_NAME(schema_id) + '].[' + name + '] TO app_user;' + CHAR(13)
FROM sys.tables 
WHERE type = 'U';

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Permisos otorgados sobre todas las tablas existentes';
END

-- Otorgar permisos sobre vistas existentes
SELECT @sql = @sql + 
    'GRANT SELECT ON [' + SCHEMA_NAME(schema_id) + '].[' + name + '] TO app_user;' + CHAR(13)
FROM sys.views 
WHERE type = 'V';

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Permisos otorgados sobre todas las vistas existentes';
END

-- Otorgar permisos sobre procedimientos almacenados existentes
SELECT @sql = @sql + 
    'GRANT EXECUTE ON [' + SCHEMA_NAME(schema_id) + '].[' + name + '] TO app_user;' + CHAR(13)
FROM sys.procedures 
WHERE type = 'P';

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Permisos otorgados sobre todos los procedimientos almacenados';
END

-- Verificar permisos otorgados
PRINT '';
PRINT '========================================';
PRINT 'PERMISOS CONFIGURADOS EN BI_Editor';
PRINT '========================================';
PRINT '';

SELECT 
    dp.name as principal_name,
    dp.type_desc as principal_type,
    sp.permission_name,
    sp.state_desc
FROM sys.database_permissions sp
JOIN sys.database_principals dp ON sp.grantee_principal_id = dp.principal_id
WHERE dp.name IN ('app_user', 'bi_editor_role')
ORDER BY dp.name, sp.permission_name;

PRINT '';
PRINT '✅ Configuración de permisos para BI_Editor completada exitosamente!';
PRINT 'El usuario app_user ahora tiene acceso completo a la base de datos BI_Editor.';
PRINT '';
PRINT 'Permisos otorgados:';
PRINT '- SELECT, INSERT, UPDATE, DELETE en todas las tablas y esquema dbo';
PRINT '- EXECUTE en procedimientos y funciones';
PRINT '- CREATE de nuevas tablas, vistas, procedimientos, funciones';
PRINT '- ALTER en esquema dbo';
PRINT '- VIEW DEFINITION en base de datos y esquema';















