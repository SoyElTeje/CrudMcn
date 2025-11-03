-- Script para eliminar la restricción única que impide múltiples condiciones por campo
-- Ejecutar en la base de datos APPDATA

USE APPDATA;
GO

PRINT '🔧 Eliminando restricción única para permitir múltiples condiciones por campo...';

-- Verificar si la restricción existe
IF EXISTS (
    SELECT * FROM sys.objects 
    WHERE object_id = OBJECT_ID(N'[dbo].[UQ_TABLE_CONDITIONS]') 
    AND type = 'UQ'
)
BEGIN
    -- Eliminar la restricción única
    ALTER TABLE TABLE_CONDITIONS 
    DROP CONSTRAINT UQ_TABLE_CONDITIONS;
    
    PRINT '✅ Restricción única UQ_TABLE_CONDITIONS eliminada';
END
ELSE
BEGIN
    PRINT '⚠️ La restricción única UQ_TABLE_CONDITIONS no existe';
END

-- Crear un nuevo índice que permita múltiples condiciones por campo
-- pero mantenga un orden lógico
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_TABLE_CONDITIONS_FIELD_ORDER'
)
BEGIN
    CREATE INDEX IX_TABLE_CONDITIONS_FIELD_ORDER 
    ON TABLE_CONDITIONS(ActivatedTableId, ColumnName, ConditionType);
    
    PRINT '✅ Nuevo índice IX_TABLE_CONDITIONS_FIELD_ORDER creado';
END
ELSE
BEGIN
    PRINT 'ℹ️ El índice IX_TABLE_CONDITIONS_FIELD_ORDER ya existe';
END

PRINT '';
PRINT '🎉 Ahora se pueden crear múltiples condiciones para el mismo campo';
PRINT '📋 Ejemplo de condiciones permitidas:';
PRINT '   - Campo ID: condición min > 0';
PRINT '   - Campo ID: condición max < 1000';
PRINT '   - Campo ID: condición required = true';
PRINT '';
PRINT '💡 Las condiciones se aplicarán en secuencia durante la validación';






















