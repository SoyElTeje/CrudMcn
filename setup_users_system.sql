-- Script para configurar el sistema de usuarios y permisos
-- Ejecutar en la base de datos especificada en DB_DATABASE

USE [APPDATA]; -- Reemplazar con el valor de DB_DATABASE en .env

-- Crear tabla de usuarios
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USERS_TABLE' AND xtype='U')
BEGIN
    CREATE TABLE USERS_TABLE (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NombreUsuario NVARCHAR(100) UNIQUE NOT NULL,
        Contrasena NVARCHAR(255) NOT NULL, -- Para hash bcrypt
        EsAdmin BIT NOT NULL DEFAULT 0,
        FechaCreacion DATETIME2 DEFAULT GETDATE(),
        UltimoAcceso DATETIME2 NULL,
        Activo BIT DEFAULT 1
    );
END

-- Crear tabla de permisos de usuarios sobre bases de datos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USER_DATABASE_PERMISSIONS' AND xtype='U')
BEGIN
    CREATE TABLE USER_DATABASE_PERMISSIONS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DatabaseName NVARCHAR(128) NOT NULL,
        CanRead BIT DEFAULT 1,
        CanWrite BIT DEFAULT 0,
        CanDelete BIT DEFAULT 0,
        CanCreate BIT DEFAULT 0,
        FechaAsignacion DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
        UNIQUE(UserId, DatabaseName)
    );
END

-- Crear tabla de permisos de usuarios sobre tablas específicas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USER_TABLE_PERMISSIONS' AND xtype='U')
BEGIN
    CREATE TABLE USER_TABLE_PERMISSIONS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DatabaseName NVARCHAR(128) NOT NULL,
        TableName NVARCHAR(128) NOT NULL,
        CanRead BIT DEFAULT 1,
        CanWrite BIT DEFAULT 0,
        CanDelete BIT DEFAULT 0,
        CanCreate BIT DEFAULT 0,
        FechaAsignacion DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
        UNIQUE(UserId, DatabaseName, TableName)
    );
END

-- Crear índices para mejorar el rendimiento
CREATE INDEX IX_USERS_TABLE_NombreUsuario ON USERS_TABLE(NombreUsuario);
CREATE INDEX IX_USER_DATABASE_PERMISSIONS_UserId ON USER_DATABASE_PERMISSIONS(UserId);
CREATE INDEX IX_USER_TABLE_PERMISSIONS_UserId ON USER_TABLE_PERMISSIONS(UserId);

PRINT 'Estructura de tablas de usuarios y permisos creada exitosamente.'; 