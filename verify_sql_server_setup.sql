-- Script de verificación para confirmar la configuración de SQL Server
-- Ejecutar este script para verificar que todo esté configurado correctamente

USE APPDATA;
GO

PRINT '========================================';
PRINT 'VERIFICACION DE CONFIGURACION SQL SERVER';
PRINT '========================================';
PRINT '';

-- Verificar que el login existe
PRINT '1. Verificando login del servidor...';
IF EXISTS (SELECT * FROM sys.server_principals WHERE name = 'app_user')
BEGIN
    PRINT '   ✅ Login app_user existe en el servidor';
    
    -- Verificar tipo de autenticación
    SELECT 
        name,
        type_desc,
        is_disabled,
        create_date
    FROM sys.server_principals 
    WHERE name = 'app_user';
END
ELSE
BEGIN
    PRINT '   ❌ Login app_user NO existe en el servidor';
END

PRINT '';

-- Verificar que el usuario existe en APPDATA
PRINT '2. Verificando usuario en base de datos APPDATA...';
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    PRINT '   ✅ Usuario app_user existe en APPDATA';
    
    -- Verificar tipo de usuario
    SELECT 
        name,
        type_desc,
        create_date
    FROM sys.database_principals 
    WHERE name = 'app_user';
END
ELSE
BEGIN
    PRINT '   ❌ Usuario app_user NO existe en APPDATA';
END

PRINT '';

-- Verificar que el rol existe
PRINT '3. Verificando rol app_role...';
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_role' AND type = 'R')
BEGIN
    PRINT '   ✅ Rol app_role existe';
    
    -- Verificar miembros del rol
    SELECT 
        r.name as role_name,
        m.name as member_name,
        m.type_desc as member_type
    FROM sys.database_role_members rm
    JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
    JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
    WHERE r.name = 'app_role';
END
ELSE
BEGIN
    PRINT '   ❌ Rol app_role NO existe';
END

PRINT '';

-- Verificar permisos en la base de datos
PRINT '4. Verificando permisos en APPDATA...';
SELECT 
    dp.name as principal_name,
    dp.type_desc as principal_type,
    sp.permission_name,
    sp.state_desc,
    so.name as object_name,
    s.name as schema_name
FROM sys.database_permissions sp
JOIN sys.database_principals dp ON sp.grantee_principal_id = dp.principal_id
LEFT JOIN sys.objects so ON sp.major_id = so.object_id
LEFT JOIN sys.schemas s ON sp.major_id = s.schema_id
WHERE dp.name IN ('app_user', 'app_role')
ORDER BY dp.name, sp.permission_name;

PRINT '';

-- Verificar permisos de servidor
PRINT '5. Verificando permisos de servidor...';
USE master;
GO

SELECT 
    sp.name as principal_name,
    sp.type_desc as principal_type,
    ssp.permission_name,
    ssp.state_desc
FROM sys.server_permissions ssp
JOIN sys.server_principals sp ON ssp.grantee_principal_id = sp.principal_id
WHERE sp.name = 'app_user'
ORDER BY ssp.permission_name;

PRINT '';

-- Volver a APPDATA para verificar tablas
USE APPDATA;
GO

PRINT '6. Verificando estructura de tablas en APPDATA...';
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    TABLE_SCHEMA
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

PRINT '';
PRINT '========================================';
PRINT 'VERIFICACION COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT 'Si todos los puntos muestran ✅, la configuración está correcta.';
PRINT 'Si hay ❌, revisa los scripts de configuración.';
PRINT '';
PRINT 'Próximo paso: Ejecutar setup_production_database.sql en APPDATA';
