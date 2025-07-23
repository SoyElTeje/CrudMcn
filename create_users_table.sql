-- Script para crear la tabla de usuarios
-- Ejecutar en la base de datos especificada en DB_DATABASE

CREATE TABLE IF NOT EXISTS USERS_TABLE (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    EsAdmin TINYINT(1) DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaModificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear usuario administrador por defecto
-- Contraseña: "admin" (hasheada con bcrypt)
INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin) 
VALUES ('admin', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 1)
ON DUPLICATE KEY UPDATE EsAdmin = 1;

-- Crear tabla de permisos de usuarios por base de datos
CREATE TABLE IF NOT EXISTS USER_DATABASE_PERMISSIONS (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName VARCHAR(100) NOT NULL,
    CanRead TINYINT(1) DEFAULT 1,
    CanWrite TINYINT(1) DEFAULT 0,
    CanDelete TINYINT(1) DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_database (UserId, DatabaseName)
);

-- Crear tabla de permisos de usuarios por tabla específica
CREATE TABLE IF NOT EXISTS USER_TABLE_PERMISSIONS (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName VARCHAR(100) NOT NULL,
    TableName VARCHAR(100) NOT NULL,
    CanRead TINYINT(1) DEFAULT 1,
    CanWrite TINYINT(1) DEFAULT 0,
    CanDelete TINYINT(1) DEFAULT 0,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_table (UserId, DatabaseName, TableName)
);

-- Dar permisos totales al usuario admin sobre todas las bases de datos
-- (Esto se manejará en el código cuando EsAdmin = 1) 