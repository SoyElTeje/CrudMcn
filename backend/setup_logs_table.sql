-- Crear tabla de logs del sistema
USE APPDATA;

-- Tabla para registrar todas las acciones de los usuarios
CREATE TABLE LOGS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Username NVARCHAR(100) NOT NULL,
    Action NVARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'EXPORT'
    DatabaseName NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100) NOT NULL,
    RecordId NVARCHAR(100) NULL, -- ID del registro afectado (si aplica)
    OldData NVARCHAR(MAX) NULL, -- Datos anteriores (para UPDATE/DELETE)
    NewData NVARCHAR(MAX) NULL, -- Datos nuevos (para INSERT/UPDATE)
    AffectedRows INT DEFAULT 1, -- Número de registros afectados
    Timestamp DATETIME2 DEFAULT GETDATE(),
    IPAddress NVARCHAR(45) NULL, -- Para futuras implementaciones
    UserAgent NVARCHAR(500) NULL -- Para futuras implementaciones
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IX_LOGS_UserId ON LOGS(UserId);
CREATE INDEX IX_LOGS_Action ON LOGS(Action);
CREATE INDEX IX_LOGS_FechaCreacion ON LOGS(FechaCreacion);
CREATE INDEX IX_LOGS_DatabaseTable ON LOGS(DatabaseName, TableName);

-- Comentarios sobre la tabla
EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Tabla para registrar todas las acciones de los usuarios en el sistema',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'ID único del log',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'Id';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'ID del usuario que realizó la acción',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'UserId';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Nombre de usuario que realizó la acción',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'Username';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Tipo de acción: INSERT, UPDATE, DELETE, EXPORT',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'Action';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Nombre de la base de datos afectada',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'DatabaseName';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Nombre de la tabla afectada',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'TableName';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'ID del registro afectado (si aplica)',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'RecordId';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Datos anteriores en formato JSON (para UPDATE/DELETE)',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'OldData';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Datos nuevos en formato JSON (para INSERT/UPDATE)',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'NewData';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Número de registros afectados',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'AffectedRows';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Fecha y hora de la acción',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'LOGS',
    @level2type = N'COLUMN',
    @level2name = N'Timestamp';

PRINT 'Tabla LOGS creada exitosamente'; 