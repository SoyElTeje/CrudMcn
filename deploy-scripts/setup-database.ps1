# Script para configurar la base de datos en SQL Server
# Ejecutar como Administrador

Write-Host "🗄️ Configurando base de datos para AbmMcn..." -ForegroundColor Green

# Parámetros de configuración
$serverName = "localhost"
$databaseName = "APPDATA"
$appUser = "appuser"
$appPassword = "TuContraseñaSegura123!"

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   Servidor: $serverName" -ForegroundColor White
Write-Host "   Base de datos: $databaseName" -ForegroundColor White
Write-Host "   Usuario: $appUser" -ForegroundColor White

# Crear script SQL
$sqlScript = @"
-- Crear base de datos APPDATA si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '$databaseName')
BEGIN
    CREATE DATABASE [$databaseName];
    PRINT 'Base de datos $databaseName creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Base de datos $databaseName ya existe.';
END
GO

USE [$databaseName];
GO

-- Crear usuario de aplicación si no existe
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = '$appUser')
BEGIN
    CREATE LOGIN [$appUser] WITH PASSWORD = '$appPassword';
    PRINT 'Usuario $appUser creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'Usuario $appUser ya existe.';
END
GO

-- Crear usuario en la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = '$appUser')
BEGIN
    CREATE USER [$appUser] FOR LOGIN [$appUser];
    PRINT 'Usuario de base de datos $appUser creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'Usuario de base de datos $appUser ya existe.';
END
GO

-- Dar permisos al usuario
EXEC sp_addrolemember 'db_owner', '$appUser';
PRINT 'Permisos asignados al usuario $appUser.';
GO

-- Crear tabla de usuarios si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USERS_TABLE]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[USERS_TABLE](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [NombreUsuario] [nvarchar](50) NOT NULL,
        [Contrasena] [nvarchar](255) NOT NULL,
        [EsAdmin] [bit] NOT NULL DEFAULT 0,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_USERS_TABLE] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_USERS_TABLE_NombreUsuario] UNIQUE NONCLUSTERED ([NombreUsuario] ASC)
    );
    PRINT 'Tabla USERS_TABLE creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla USERS_TABLE ya existe.';
END
GO

-- Crear tabla de permisos de base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_DATABASE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[USER_DATABASE_PERMISSIONS](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [UserId] [int] NOT NULL,
        [DatabaseName] [nvarchar](100) NOT NULL,
        [CanRead] [bit] NOT NULL DEFAULT 0,
        [CanWrite] [bit] NOT NULL DEFAULT 0,
        [CanDelete] [bit] NOT NULL DEFAULT 0,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_USER_DATABASE_PERMISSIONS] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_USER_DATABASE_PERMISSIONS_UserId] FOREIGN KEY([UserId]) REFERENCES [dbo].[USERS_TABLE] ([Id]) ON DELETE CASCADE
    );
    PRINT 'Tabla USER_DATABASE_PERMISSIONS creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla USER_DATABASE_PERMISSIONS ya existe.';
END
GO

-- Crear tabla de permisos de tabla si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_TABLE_PERMISSIONS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[USER_TABLE_PERMISSIONS](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [UserId] [int] NOT NULL,
        [DatabaseName] [nvarchar](100) NOT NULL,
        [TableName] [nvarchar](100) NOT NULL,
        [CanRead] [bit] NOT NULL DEFAULT 0,
        [CanWrite] [bit] NOT NULL DEFAULT 0,
        [CanDelete] [bit] NOT NULL DEFAULT 0,
        [CanCreate] [bit] NOT NULL DEFAULT 0,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_USER_TABLE_PERMISSIONS] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_USER_TABLE_PERMISSIONS_UserId] FOREIGN KEY([UserId]) REFERENCES [dbo].[USERS_TABLE] ([Id]) ON DELETE CASCADE
    );
    PRINT 'Tabla USER_TABLE_PERMISSIONS creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla USER_TABLE_PERMISSIONS ya existe.';
END
GO

-- Crear tabla de logs si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGS_TABLE]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[LOGS_TABLE](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [UserId] [int] NULL,
        [Action] [nvarchar](100) NOT NULL,
        [Details] [nvarchar](max) NULL,
        [IpAddress] [nvarchar](45) NULL,
        [UserAgent] [nvarchar](500) NULL,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_LOGS_TABLE] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_LOGS_TABLE_UserId] FOREIGN KEY([UserId]) REFERENCES [dbo].[USERS_TABLE] ([Id]) ON DELETE SET NULL
    );
    PRINT 'Tabla LOGS_TABLE creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla LOGS_TABLE ya existe.';
END
GO

PRINT 'Configuración de base de datos completada exitosamente.';
"@

# Guardar script SQL
$sqlFile = "C:\temp\setup_database.sql"
$sqlScript | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "📝 Script SQL guardado en: $sqlFile" -ForegroundColor Yellow

# Ejecutar script SQL
Write-Host "🔧 Ejecutando script SQL..." -ForegroundColor Yellow
try {
    sqlcmd -S $serverName -i $sqlFile
    Write-Host "✅ Base de datos configurada exitosamente!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando script SQL: $_" -ForegroundColor Red
    Write-Host "💡 Asegúrate de que SQL Server esté ejecutándose y sqlcmd esté disponible" -ForegroundColor Yellow
    exit 1
}

# Limpiar archivo temporal
if (Test-Path $sqlFile) {
    Remove-Item $sqlFile
}

Write-Host "✅ Configuración de base de datos completada!" -ForegroundColor Green
Write-Host "📝 Próximo paso: Configurar variables de entorno en el archivo .env" -ForegroundColor Cyan
