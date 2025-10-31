-- Script para crear las tablas faltantes del sistema de permisos
-- Ejecutar en la base de datos APPDATA

USE [APPDATA];

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
    PRINT '✅ Tabla USER_DATABASE_PERMISSIONS creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Tabla USER_DATABASE_PERMISSIONS ya existe.';
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
    PRINT '✅ Tabla USER_TABLE_PERMISSIONS creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Tabla USER_TABLE_PERMISSIONS ya existe.';
END

-- Crear índices para mejorar el rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_DATABASE_PERMISSIONS_UserId')
BEGIN
    CREATE INDEX IX_USER_DATABASE_PERMISSIONS_UserId ON USER_DATABASE_PERMISSIONS(UserId);
    PRINT '✅ Índice IX_USER_DATABASE_PERMISSIONS_UserId creado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_TABLE_PERMISSIONS_UserId')
BEGIN
    CREATE INDEX IX_USER_TABLE_PERMISSIONS_UserId ON USER_TABLE_PERMISSIONS(UserId);
    PRINT '✅ Índice IX_USER_TABLE_PERMISSIONS_UserId creado.';
END

-- Asignar permisos totales al usuario admin (ID = 1) para las bases de datos permitidas
-- APPDATA
IF NOT EXISTS (SELECT * FROM USER_DATABASE_PERMISSIONS WHERE UserId = 1 AND DatabaseName = 'APPDATA')
BEGIN
    INSERT INTO USER_DATABASE_PERMISSIONS (UserId, DatabaseName, CanRead, CanWrite, CanDelete, CanCreate)
    VALUES (1, 'APPDATA', 1, 1, 1, 1);
    PRINT '✅ Permisos de APPDATA asignados al admin.';
END

-- BI_Editor
IF NOT EXISTS (SELECT * FROM USER_DATABASE_PERMISSIONS WHERE UserId = 1 AND DatabaseName = 'BI_Editor')
BEGIN
    INSERT INTO USER_DATABASE_PERMISSIONS (UserId, DatabaseName, CanRead, CanWrite, CanDelete, CanCreate)
    VALUES (1, 'BI_Editor', 1, 1, 1, 1);
    PRINT '✅ Permisos de BI_Editor asignados al admin.';
END

PRINT '🎉 Sistema de permisos configurado exitosamente.';
























