-- Script genérico para otorgar permisos totales sobre cualquier base de datos
-- Ejecutar este script como administrador en SQL Server
-- CAMBIAR EL NOMBRE DE LA BASE DE DATOS EN LA PRIMERA LÍNEA

-- ⚠️ IMPORTANTE: Cambiar 'NOMBRE_BASE_DATOS' por el nombre real de la base de datos
USE NOMBRE_BASE_DATOS;
GO

-- Crear usuario en la base de datos especificada (si no existe)
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    CREATE USER app_user FOR LOGIN app_user;
    PRINT 'Usuario app_user creado en ' + DB_NAME();
END
ELSE
BEGIN
    PRINT 'Usuario app_user ya existe en ' + DB_NAME();
END

-- Otorgar permisos totales sobre el esquema dbo
GRANT CONTROL ON SCHEMA::dbo TO app_user;
PRINT 'Permiso CONTROL otorgado sobre esquema dbo';

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

-- Otorgar permisos sobre vistas
SELECT @sql = @sql + 
    'GRANT SELECT ON [' + SCHEMA_NAME(schema_id) + '].[' + name + '] TO app_user;' + CHAR(13)
FROM sys.views 
WHERE type = 'V';

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Permisos otorgados sobre todas las vistas existentes';
END

-- Otorgar permisos sobre procedimientos almacenados
SELECT @sql = @sql + 
    'GRANT EXECUTE ON [' + SCHEMA_NAME(schema_id) + '].[' + name + '] TO app_user;' + CHAR(13)
FROM sys.procedures 
WHERE type = 'P';

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Permisos otorgados sobre todos los procedimientos almacenados';
END

-- Otorgar permisos sobre funciones
SELECT @sql = @sql + 
    'GRANT EXECUTE ON [' + SCHEMA_NAME(schema_id) + '].[' + name + '] TO app_user;' + CHAR(13)
FROM sys.objects 
WHERE type IN ('FN', 'IF', 'TF');

IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Permisos otorgados sobre todas las funciones';
END

-- Otorgar permisos para crear nuevos objetos
GRANT CREATE TABLE TO app_user;
GRANT CREATE VIEW TO app_user;
GRANT CREATE PROCEDURE TO app_user;
GRANT CREATE FUNCTION TO app_user;
GRANT CREATE SCHEMA TO app_user;
PRINT 'Permisos de creación otorgados';

-- Otorgar permisos para modificar objetos existentes
GRANT ALTER ON SCHEMA::dbo TO app_user;
GRANT ALTER ANY TABLE TO app_user;
GRANT ALTER ANY VIEW TO app_user;
GRANT ALTER ANY PROCEDURE TO app_user;
GRANT ALTER ANY FUNCTION TO app_user;
PRINT 'Permisos de modificación otorgados';

-- Otorgar permisos para eliminar objetos
GRANT DROP ON SCHEMA::dbo TO app_user;
PRINT 'Permisos de eliminación otorgados';

-- Otorgar permisos para ver definiciones
GRANT VIEW DEFINITION ON SCHEMA::dbo TO app_user;
GRANT VIEW DEFINITION ON DATABASE::[NOMBRE_BASE_DATOS] TO app_user;
PRINT 'Permisos de visualización de definiciones otorgados';

-- Crear un rol específico para la base de datos si no existe
DECLARE @roleName NVARCHAR(128) = LOWER(DB_NAME()) + '_role';
DECLARE @createRoleSQL NVARCHAR(MAX) = 'IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = ''' + @roleName + ''' AND type = ''R'') BEGIN CREATE ROLE [' + @roleName + ']; PRINT ''Rol ' + @roleName + ' creado en ' + DB_NAME() + '''; END';

EXEC sp_executesql @createRoleSQL;

-- Agregar usuario al rol
DECLARE @addMemberSQL NVARCHAR(MAX) = 'EXEC sp_addrolemember ''' + @roleName + ''', ''app_user''; PRINT ''Usuario app_user agregado al rol ' + @roleName + ''';';
EXEC sp_executesql @addMemberSQL;

-- Otorgar permisos al rol
GRANT CONTROL ON SCHEMA::dbo TO [NOMBRE_BASE_DATOS_role];
GRANT CREATE TABLE TO [NOMBRE_BASE_DATOS_role];
GRANT CREATE VIEW TO [NOMBRE_BASE_DATOS_role];
GRANT CREATE PROCEDURE TO [NOMBRE_BASE_DATOS_role];
GRANT CREATE FUNCTION TO [NOMBRE_BASE_DATOS_role];
GRANT ALTER ON SCHEMA::dbo TO [NOMBRE_BASE_DATOS_role];
PRINT 'Permisos otorgados al rol ' + @roleName;

-- Verificar permisos otorgados
PRINT '';
PRINT '========================================';
PRINT 'PERMISOS CONFIGURADOS EN ' + DB_NAME();
PRINT '========================================';
PRINT '';

SELECT 
    dp.name as principal_name,
    dp.type_desc as principal_type,
    sp.permission_name,
    sp.state_desc,
    CASE 
        WHEN sp.major_id = 0 THEN 'DATABASE'
        WHEN sp.major_id = 1 THEN 'DATABASE'
        ELSE 'OBJECT'
    END as scope
FROM sys.database_permissions sp
JOIN sys.database_principals dp ON sp.grantee_principal_id = dp.principal_id
WHERE dp.name IN ('app_user', @roleName)
ORDER BY dp.name, sp.permission_name;

PRINT '';
PRINT '✅ Configuración de permisos para ' + DB_NAME() + ' completada exitosamente!';
PRINT 'El usuario app_user ahora tiene acceso total a la base de datos ' + DB_NAME() + '.';
PRINT '';
PRINT 'Permisos otorgados:';
PRINT '- SELECT, INSERT, UPDATE, DELETE en todas las tablas';
PRINT '- EXECUTE en procedimientos y funciones';
PRINT '- CREATE, ALTER, DROP en esquemas y objetos';
PRINT '- VIEW DEFINITION en todos los objetos';
PRINT '- CONTROL total sobre el esquema dbo';
PRINT '';
PRINT '⚠️  RECUERDA: Cambiar NOMBRE_BASE_DATOS por el nombre real de la base de datos';
PRINT '   en la primera línea del script antes de ejecutarlo.';















