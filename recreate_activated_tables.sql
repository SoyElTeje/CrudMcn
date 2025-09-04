-- Script para recrear la tabla ACTIVATED_TABLES con estructura correcta
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Recreando tabla ACTIVATED_TABLES con estructura correcta...';
PRINT '';

-- 1. Eliminar tabla existente si existe
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ACTIVATED_TABLES]') AND type in (N'U'))
BEGIN
    DROP TABLE ACTIVATED_TABLES;
    PRINT '✅ Tabla ACTIVATED_TABLES existente eliminada';
END

-- 2. Crear tabla con estructura correcta
CREATE TABLE ACTIVATED_TABLES (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DatabaseName NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(128) NOT NULL,
    IsActive BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETDATE(),
    Description NVARCHAR(500) NULL,
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    FechaModificacion DATETIME2 DEFAULT GETDATE()
);
PRINT '✅ Tabla ACTIVATED_TABLES creada con estructura correcta';

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IX_ACTIVATED_TABLES_DB_Table ON ACTIVATED_TABLES(DatabaseName, TableName);
CREATE INDEX IX_ACTIVATED_TABLES_IsActive ON ACTIVATED_TABLES(IsActive);
PRINT '✅ Índices creados';

-- 4. Verificar estructura final
PRINT '';
PRINT '3️⃣ Verificando estructura final...';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ACTIVATED_TABLES'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '🎉 Tabla ACTIVATED_TABLES recreada exitosamente!';
PRINT '';
PRINT 'Estructura creada:';
PRINT '- Id (INT, PRIMARY KEY)';
PRINT '- DatabaseName (NVARCHAR(128))';
PRINT '- TableName (NVARCHAR(128))';
PRINT '- IsActive (BIT)';
PRINT '- FechaCreacion (DATETIME2)';
PRINT '- Description (NVARCHAR(500))';
PRINT '- CreatedBy (INT)';
PRINT '- UpdatedBy (INT)';
PRINT '- FechaModificacion (DATETIME2)';
PRINT '';
PRINT 'Ahora puedes activar tablas sin errores.';





