-- Script para configurar la base de datos APPDATA en producción
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

-- Crear tabla de usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Tabla users creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla users ya existe';
END

-- Crear tabla de permisos de usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_permissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE user_permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        database_name VARCHAR(128) NOT NULL,
        table_name VARCHAR(128) NOT NULL,
        can_read BIT DEFAULT 0,
        can_create BIT DEFAULT 0,
        can_update BIT DEFAULT 0,
        can_delete BIT DEFAULT 0,
        can_list_tables BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, database_name, table_name)
    );
    PRINT 'Tabla user_permissions creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla user_permissions ya existe';
END

-- Crear tabla de logs
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(128),
        database_name VARCHAR(128),
        record_id VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    PRINT 'Tabla logs creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla logs ya existe';
END

-- Crear tabla de tablas activadas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activated_tables]') AND type in (N'U'))
BEGIN
    CREATE TABLE activated_tables (
        id INT IDENTITY(1,1) PRIMARY KEY,
        database_name VARCHAR(128) NOT NULL,
        table_name VARCHAR(128) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        UNIQUE(database_name, table_name)
    );
    PRINT 'Tabla activated_tables creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla activated_tables ya existe';
END

-- Crear usuario admin por defecto (password: admin)
-- NOTA: La contraseña se hasheará desde la aplicación
IF NOT EXISTS (SELECT * FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, password_hash, is_admin) 
    VALUES ('admin', 'admin', 1); -- La contraseña se actualizará desde la aplicación
    PRINT 'Usuario admin creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Usuario admin ya existe';
END

-- Crear índices para mejorar el rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_permissions_user_db_table')
BEGIN
    CREATE INDEX IX_user_permissions_user_db_table ON user_permissions(user_id, database_name, table_name);
    PRINT 'Índice IX_user_permissions_user_db_table creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_logs_user_created')
BEGIN
    CREATE INDEX IX_logs_user_created ON logs(user_id, created_at);
    PRINT 'Índice IX_logs_user_created creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_activated_tables_db_table')
BEGIN
    CREATE INDEX IX_activated_tables_db_table ON activated_tables(database_name, table_name);
    PRINT 'Índice IX_activated_tables_db_table creado';
END

PRINT 'Configuración de la base de datos APPDATA completada exitosamente';
GO
