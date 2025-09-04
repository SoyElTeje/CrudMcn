-- Script para corregir la estructura de la tabla ACTIVATED_TABLES
-- Ejecutar este script en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Corrigiendo estructura de la tabla ACTIVATED_TABLES...';
PRINT '';

-- 1. Verificar estructura actual
PRINT '1️⃣ Verificando estructura actual de ACTIVATED_TABLES...';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ACTIVATED_TABLES'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- 2. Agregar columnas faltantes si no existen
PRINT '2️⃣ Agregando columnas faltantes...';

-- Agregar columna Description si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ACTIVATED_TABLES' AND COLUMN_NAME = 'Description')
BEGIN
    ALTER TABLE ACTIVATED_TABLES ADD Description NVARCHAR(500) NULL;
    PRINT '✅ Columna Description agregada';
END
ELSE
BEGIN
    PRINT '✅ Columna Description ya existe';
END

-- Agregar columna CreatedBy si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ACTIVATED_TABLES' AND COLUMN_NAME = 'CreatedBy')
BEGIN
    ALTER TABLE ACTIVATED_TABLES ADD CreatedBy INT NULL;
    PRINT '✅ Columna CreatedBy agregada';
END
ELSE
BEGIN
    PRINT '✅ Columna CreatedBy ya existe';
END

-- Agregar columna UpdatedBy si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ACTIVATED_TABLES' AND COLUMN_NAME = 'UpdatedBy')
BEGIN
    ALTER TABLE ACTIVATED_TABLES ADD UpdatedBy INT NULL;
    PRINT '✅ Columna UpdatedBy agregada';
END
ELSE
BEGIN
    PRINT '✅ Columna UpdatedBy ya existe';
END

-- Agregar columna FechaModificacion si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ACTIVATED_TABLES' AND COLUMN_NAME = 'FechaModificacion')
BEGIN
    ALTER TABLE ACTIVATED_TABLES ADD FechaModificacion DATETIME2 DEFAULT GETDATE();
    PRINT '✅ Columna FechaModificacion agregada';
END
ELSE
BEGIN
    PRINT '✅ Columna FechaModificacion ya existe';
END

PRINT '';

-- 3. Verificar estructura final
PRINT '3️⃣ Verificando estructura final de ACTIVATED_TABLES...';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ACTIVATED_TABLES'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '🎉 Estructura de ACTIVATED_TABLES corregida exitosamente!';
PRINT '';
PRINT 'Columnas esperadas:';
PRINT '- Id (INT, PRIMARY KEY)';
PRINT '- DatabaseName (NVARCHAR(128))';
PRINT '- TableName (NVARCHAR(128))';
PRINT '- IsActive (BIT)';
PRINT '- FechaCreacion (DATETIME2)';
PRINT '- Description (NVARCHAR(500)) - AGREGADA';
PRINT '- CreatedBy (INT) - AGREGADA';
PRINT '- UpdatedBy (INT) - AGREGADA';
PRINT '- FechaModificacion (DATETIME2) - AGREGADA';
PRINT '';
PRINT 'Ahora puedes activar tablas sin errores.';
