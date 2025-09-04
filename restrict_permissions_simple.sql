-- Script simplificado para restringir permisos del app_user
-- Solo acceso a APPDATA y BI_Editor

USE master;
GO

PRINT '🔒 Restringiendo permisos del usuario app_user...';
PRINT '';

-- 1. Revocar permisos de servidor (acceso a todas las bases de datos)
PRINT '1️⃣ Revocando permisos de servidor...';

-- Revocar VIEW SERVER STATE
REVOKE VIEW SERVER STATE FROM [app_user];
PRINT '✅ VIEW SERVER STATE revocado';

-- Revocar VIEW ANY DEFINITION
REVOKE VIEW ANY DEFINITION FROM [app_user];
PRINT '✅ VIEW ANY DEFINITION revocado';

-- Revocar VIEW ANY DATABASE
REVOKE VIEW ANY DATABASE FROM [app_user];
PRINT '✅ VIEW ANY DATABASE revocado';

PRINT '';

-- 2. Configurar permisos específicos para APPDATA
PRINT '2️⃣ Configurando permisos para APPDATA...';

USE APPDATA;
GO

-- Verificar que el usuario existe en APPDATA
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    CREATE USER [app_user] FOR LOGIN [app_user];
    PRINT '✅ Usuario app_user creado en APPDATA';
END
ELSE
BEGIN
    PRINT '✅ Usuario app_user ya existe en APPDATA';
END

-- Dar permisos completos en APPDATA (es la base de datos de la aplicación)
GRANT CONTROL ON DATABASE::APPDATA TO [app_user];
PRINT '✅ Permisos CONTROL concedidos en APPDATA';

PRINT '';

-- 3. Configurar permisos específicos para BI_Editor
PRINT '3️⃣ Configurando permisos para BI_Editor...';

USE BI_Editor;
GO

-- Verificar que el usuario existe en BI_Editor
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    CREATE USER [app_user] FOR LOGIN [app_user];
    PRINT '✅ Usuario app_user creado en BI_Editor';
END
ELSE
BEGIN
    PRINT '✅ Usuario app_user ya existe en BI_Editor';
END

-- Dar permisos completos en BI_Editor
GRANT CONTROL ON DATABASE::BI_Editor TO [app_user];
PRINT '✅ Permisos CONTROL concedidos en BI_Editor';

-- Dar permisos específicos en el esquema dbo
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [app_user];
GRANT VIEW DEFINITION ON SCHEMA::dbo TO [app_user];
PRINT '✅ Permisos específicos concedidos en esquema dbo de BI_Editor';

PRINT '';

-- 4. Verificar configuración final
PRINT '4️⃣ Verificando configuración final...';

USE master;
GO

-- Verificar permisos de servidor
PRINT '📋 Permisos de servidor del app_user:';
SELECT 
    pr.name,
    pr.type_desc,
    pe.permission_name,
    pe.state_desc
FROM sys.server_principals pr
LEFT JOIN sys.server_permissions pe ON pr.principal_id = pe.grantee_principal_id
WHERE pr.name = 'app_user'
ORDER BY pe.permission_name;

PRINT '';

-- Verificar que el usuario existe en las bases de datos
PRINT '📋 Verificando acceso a bases de datos:';

USE APPDATA;
GO
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    PRINT '✅ app_user tiene acceso a APPDATA';
END
ELSE
BEGIN
    PRINT '❌ app_user NO tiene acceso a APPDATA';
END

USE BI_Editor;
GO
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    PRINT '✅ app_user tiene acceso a BI_Editor';
END
ELSE
BEGIN
    PRINT '❌ app_user NO tiene acceso a BI_Editor';
END

PRINT '';
PRINT '🎉 ¡Permisos restringidos exitosamente!';
PRINT '';
PRINT 'Resumen de permisos:';
PRINT '✅ APPDATA: Acceso completo (base de datos de la aplicación)';
PRINT '✅ BI_Editor: Acceso completo (base de datos de trabajo)';
PRINT '❌ Otras bases de datos: Sin acceso';
PRINT '';
PRINT 'El usuario app_user ahora solo puede acceder a APPDATA y BI_Editor.';
