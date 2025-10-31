-- Script para crear las tablas del sistema de activación de tablas
-- Ejecutar en la base de datos APPDATA

-- Tabla para almacenar las tablas activadas
CREATE TABLE ACTIVATED_TABLES (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DatabaseName NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(128) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    UpdatedBy INT,
    Description NVARCHAR(500),
    -- Índice único para evitar duplicados
    CONSTRAINT UQ_ACTIVATED_TABLES UNIQUE (DatabaseName, TableName)
);

-- Tabla para almacenar las condiciones por atributo
CREATE TABLE TABLE_CONDITIONS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ActivatedTableId INT NOT NULL,
    ColumnName NVARCHAR(128) NOT NULL,
    DataType NVARCHAR(50) NOT NULL, -- 'string', 'numeric', 'date', 'boolean'
    ConditionType NVARCHAR(50) NOT NULL, -- 'contains', 'length', 'regex', 'range', 'min', 'max', etc.
    ConditionValue NVARCHAR(MAX), -- Valor de la condición (JSON para condiciones complejas)
    IsRequired BIT DEFAULT 0, -- Si el campo es obligatorio
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    UpdatedBy INT,
    -- Clave foránea a ACTIVATED_TABLES
    CONSTRAINT FK_TABLE_CONDITIONS_ACTIVATED_TABLES 
        FOREIGN KEY (ActivatedTableId) REFERENCES ACTIVATED_TABLES(Id) ON DELETE CASCADE,
    -- Índice único para evitar condiciones duplicadas por columna
    CONSTRAINT UQ_TABLE_CONDITIONS UNIQUE (ActivatedTableId, ColumnName, ConditionType)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IX_ACTIVATED_TABLES_DATABASE ON ACTIVATED_TABLES(DatabaseName);
CREATE INDEX IX_ACTIVATED_TABLES_ACTIVE ON ACTIVATED_TABLES(IsActive);
CREATE INDEX IX_TABLE_CONDITIONS_TABLE ON TABLE_CONDITIONS(ActivatedTableId);
CREATE INDEX IX_TABLE_CONDITIONS_ACTIVE ON TABLE_CONDITIONS(IsActive);

-- Insertar algunas tablas de ejemplo activadas (opcional)
-- INSERT INTO ACTIVATED_TABLES (DatabaseName, TableName, Description, CreatedBy) 
-- VALUES ('APPDATA', 'USERS', 'Tabla de usuarios del sistema', 1);

PRINT '✅ Tablas del sistema de activación creadas exitosamente';



































