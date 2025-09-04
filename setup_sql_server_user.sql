-- Script para configurar el usuario de la aplicación en SQL Server
-- Ejecutar este script como administrador en SQL Server

-- Crear login para la aplicación (si no existe)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'app_user')
BEGIN
    CREATE LOGIN app_user WITH PASSWORD = 'TU_PASSWORD_SEGURO_AQUI';
    PRINT 'Login app_user creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Login app_user ya existe';
END

-- Crear usuario en la base de datos APPDATA
USE APPDATA;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_user')
BEGIN
    CREATE USER app_user FOR LOGIN app_user;
    PRINT 'Usuario app_user creado en APPDATA';
END
ELSE
BEGIN
    PRINT 'Usuario app_user ya existe en APPDATA';
END

-- Otorgar permisos en la base de datos APPDATA
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO app_user;
GRANT EXECUTE ON SCHEMA::dbo TO app_user;
GRANT VIEW DEFINITION ON SCHEMA::dbo TO app_user;

-- Otorgar permisos para crear tablas (si es necesario)
GRANT CREATE TABLE TO app_user;
GRANT ALTER ON SCHEMA::dbo TO app_user;

-- Crear rol personalizado para permisos granulares
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_role' AND type = 'R')
BEGIN
    CREATE ROLE app_role;
    PRINT 'Rol app_role creado';
END

-- Agregar usuario al rol
EXEC sp_addrolemember 'app_role', 'app_user';

-- Otorgar permisos al rol
GRANT SELECT ON SCHEMA::dbo TO app_role;
GRANT INSERT ON SCHEMA::dbo TO app_role;
GRANT UPDATE ON SCHEMA::dbo TO app_role;
GRANT DELETE ON SCHEMA::dbo TO app_role;

PRINT 'Permisos configurados exitosamente para app_user en APPDATA';
GO

-- Ahora configurar permisos de servidor desde master
USE master;
GO

-- Otorgar permisos para ver información del sistema (solo desde master)
IF NOT EXISTS (SELECT * FROM sys.server_permissions WHERE grantee_principal_id = USER_ID('app_user') AND permission_name = 'VIEW SERVER STATE')
BEGIN
    GRANT VIEW SERVER STATE TO app_user;
    PRINT 'Permiso VIEW SERVER STATE otorgado a app_user';
END

IF NOT EXISTS (SELECT * FROM sys.server_permissions WHERE grantee_principal_id = USER_ID('app_user') AND permission_name = 'VIEW ANY DEFINITION')
BEGIN
    GRANT VIEW ANY DEFINITION TO app_user;
    PRINT 'Permiso VIEW ANY DEFINITION otorgado a app_user';
END

PRINT 'Configuración completa de permisos finalizada exitosamente';
GO

-- NOTA: Reemplazar 'TU_PASSWORD_SEGURO_AQUI' con una contraseña segura real
-- Esta contraseña debe coincidir con la configurada en el archivo .env
