# Sistema de Logs - Documentación

## Descripción General

El sistema de logs implementado registra automáticamente todas las acciones realizadas por los usuarios en la aplicación, proporcionando un historial completo de auditoría para mantener la trazabilidad de los cambios en las bases de datos.

## Características Principales

### ✅ Acciones Registradas

1. **INSERT** - Inserción de registros (manual o por Excel)
2. **UPDATE** - Actualización de registros existentes
3. **DELETE** - Eliminación de registros (individual o múltiple)
4. **EXPORT** - Exportación de datos a Excel

### 📊 Información Capturada

Para cada acción se registra:

- **Usuario**: ID y nombre del usuario que realizó la acción
- **Acción**: Tipo de operación (INSERT, UPDATE, DELETE, EXPORT)
- **Base de Datos**: Nombre de la base de datos afectada
- **Tabla**: Nombre de la tabla afectada
- **Registro**: ID del registro afectado (cuando aplica)
- **Datos Anteriores**: Estado del registro antes de la modificación (UPDATE/DELETE)
- **Datos Nuevos**: Estado del registro después de la modificación (INSERT/UPDATE)
- **Registros Afectados**: Número de registros impactados
- **Fecha y Hora**: Timestamp exacto de la acción
- **IP Address**: Dirección IP del usuario (para futuras implementaciones)
- **User Agent**: Información del navegador (para futuras implementaciones)

## Estructura de la Base de Datos

### Tabla: SYSTEM_LOGS

```sql
CREATE TABLE SYSTEM_LOGS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Username NVARCHAR(100) NOT NULL,
    Action NVARCHAR(50) NOT NULL,
    DatabaseName NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100) NOT NULL,
    RecordId NVARCHAR(100) NULL,
    OldData NVARCHAR(MAX) NULL,
    NewData NVARCHAR(MAX) NULL,
    AffectedRows INT DEFAULT 1,
    Timestamp DATETIME2 DEFAULT GETDATE(),
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL
);
```

### Índices Optimizados

- `IX_SYSTEM_LOGS_UserId` - Para consultas por usuario
- `IX_SYSTEM_LOGS_Action` - Para filtros por tipo de acción
- `IX_SYSTEM_LOGS_Timestamp` - Para consultas por fecha
- `IX_SYSTEM_LOGS_DatabaseTable` - Para consultas por base de datos/tabla

## Implementación Backend

### Servicio de Logs (`services/logService.js`)

```javascript
// Métodos principales:
- logAction(logData) - Registro genérico de acción
- logInsert(userId, username, databaseName, tableName, newData, ...)
- logUpdate(userId, username, databaseName, tableName, oldData, newData, ...)
- logDelete(userId, username, databaseName, tableName, oldData, ...)
- logExport(userId, username, databaseName, tableName, affectedRows, ...)
- getUserLogs(userId, limit, offset) - Logs de usuario específico
- getAllLogs(limit, offset, filters) - Todos los logs (solo admin)
- getLogStats() - Estadísticas de actividad
```

### Rutas API (`routes/logs.js`)

```
GET /api/logs/my-logs - Logs del usuario actual
GET /api/logs/all - Todos los logs (solo admin)
GET /api/logs/stats - Estadísticas de logs (solo admin)
GET /api/logs/user/:userId - Logs de usuario específico (solo admin)
```

### Integración en Operaciones CRUD

El sistema está integrado en todas las rutas principales:

- **POST** `/api/databases/:dbName/tables/:tableName/records` - INSERT
- **PUT** `/api/databases/:dbName/tables/:tableName/records` - UPDATE
- **DELETE** `/api/databases/:dbName/tables/:tableName/records` - DELETE
- **DELETE** `/api/databases/:dbName/tables/:tableName/records/bulk` - BULK DELETE
- **POST** `/api/databases/:dbName/tables/:tableName/import-excel` - IMPORT
- **GET** `/api/databases/:dbName/tables/:tableName/export-excel` - EXPORT

## Implementación Frontend

### Componente LogsViewer (`components/LogsViewer.tsx`)

Características principales:

- **Vista de Logs**: Tabla con todos los logs del sistema
- **Vista de Estadísticas**: Dashboard con métricas de actividad
- **Filtros Avanzados**: Por acción, base de datos, tabla, usuario, fechas
- **Detalles Expandibles**: Información completa de cada log
- **Formato de Fechas**: Formateo localizado en español
- **Responsive Design**: Adaptable a diferentes tamaños de pantalla

### Navegación

- **Acceso**: Solo para usuarios administradores
- **Botón**: "📋 Logs del Sistema" en la barra de navegación
- **Ubicación**: Junto al botón de "Gestión de Usuarios"

## Configuración y Instalación

### 1. Crear Tabla de Logs

```bash
cd backend
node setup_logs.js
```

### 2. Instalar Dependencias Frontend

```bash
cd frontend
npm install date-fns
```

### 3. Reiniciar Servidor

```bash
cd backend
npm start
```

## Uso del Sistema

### Para Administradores

1. **Acceder a Logs**: Hacer clic en "📋 Logs del Sistema"
2. **Ver Logs**: Revisar la tabla de logs con todas las acciones
3. **Filtrar**: Usar los filtros para encontrar acciones específicas
4. **Ver Estadísticas**: Cambiar a la vista de estadísticas
5. **Exportar**: Los logs se pueden exportar manualmente desde la base de datos

### Para Usuarios Regulares

- Los usuarios pueden ver sus propios logs a través de la API
- No tienen acceso a la interfaz de logs del sistema
- Sus acciones se registran automáticamente

## Ejemplos de Logs

### Log de Inserción

```json
{
  "Id": 1,
  "UserId": 1,
  "Username": "admin",
  "Action": "INSERT",
  "DatabaseName": "TESTDB",
  "TableName": "TestTable",
  "RecordId": null,
  "OldData": null,
  "NewData": {
    "Name": "Nuevo Registro",
    "Description": "Descripción del registro"
  },
  "AffectedRows": 1,
  "Timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Log de Actualización

```json
{
  "Id": 2,
  "UserId": 1,
  "Username": "admin",
  "Action": "UPDATE",
  "DatabaseName": "TESTDB",
  "TableName": "TestTable",
  "RecordId": "{\"Id\":1}",
  "OldData": {
    "Id": 1,
    "Name": "Registro Original",
    "Description": "Descripción original"
  },
  "NewData": {
    "Name": "Registro Actualizado",
    "Description": "Nueva descripción"
  },
  "AffectedRows": 1,
  "Timestamp": "2024-01-15T10:35:00.000Z"
}
```

### Log de Eliminación

```json
{
  "Id": 3,
  "UserId": 1,
  "Username": "admin",
  "Action": "DELETE",
  "DatabaseName": "TESTDB",
  "TableName": "TestTable",
  "RecordId": "{\"Id\":1}",
  "OldData": {
    "Id": 1,
    "Name": "Registro a Eliminar",
    "Description": "Descripción del registro eliminado"
  },
  "NewData": null,
  "AffectedRows": 1,
  "Timestamp": "2024-01-15T10:40:00.000Z"
}
```

## Seguridad y Privacidad

### Consideraciones de Seguridad

1. **Acceso Restringido**: Solo administradores pueden ver todos los logs
2. **Datos Sensibles**: Los logs pueden contener información sensible
3. **Retención**: Considerar políticas de retención de logs
4. **Encriptación**: Los datos se almacenan en texto plano (considerar encriptación)

### Recomendaciones

1. **Backup Regular**: Hacer backup de la tabla SYSTEM_LOGS
2. **Limpieza Periódica**: Implementar limpieza automática de logs antiguos
3. **Monitoreo**: Configurar alertas para acciones críticas
4. **Auditoría**: Revisar logs regularmente para detectar anomalías

## Mantenimiento

### Limpieza de Logs Antiguos

```sql
-- Eliminar logs de más de 1 año
DELETE FROM SYSTEM_LOGS
WHERE Timestamp < DATEADD(YEAR, -1, GETDATE());

-- Eliminar logs de más de 6 meses (mantener solo los últimos 6 meses)
DELETE FROM SYSTEM_LOGS
WHERE Timestamp < DATEADD(MONTH, -6, GETDATE());
```

### Estadísticas de Uso

```sql
-- Logs por usuario en el último mes
SELECT
    Username,
    COUNT(*) as TotalActions,
    COUNT(CASE WHEN Action = 'INSERT' THEN 1 END) as Inserts,
    COUNT(CASE WHEN Action = 'UPDATE' THEN 1 END) as Updates,
    COUNT(CASE WHEN Action = 'DELETE' THEN 1 END) as Deletes,
    COUNT(CASE WHEN Action = 'EXPORT' THEN 1 END) as Exports
FROM SYSTEM_LOGS
WHERE Timestamp >= DATEADD(MONTH, -1, GETDATE())
GROUP BY Username
ORDER BY TotalActions DESC;
```

## Troubleshooting

### Problemas Comunes

1. **Logs no se registran**: Verificar que el servicio de logs esté funcionando
2. **Error de permisos**: Verificar que el usuario tenga permisos en la tabla SYSTEM_LOGS
3. **Rendimiento lento**: Verificar índices y considerar particionamiento
4. **Espacio en disco**: Implementar limpieza automática de logs

### Logs de Debug

El sistema incluye logs de debug en la consola del servidor:

```
✅ Log registrado: INSERT en TESTDB.TestTable por admin
✅ Log registrado: UPDATE en TESTDB.TestTable por admin
✅ Log registrado: DELETE en TESTDB.TestTable por admin
✅ Log registrado: EXPORT en TESTDB.TestTable por admin
```

## Futuras Mejoras

### Funcionalidades Planificadas

1. **Exportación de Logs**: Exportar logs a Excel/CSV
2. **Alertas**: Notificaciones para acciones críticas
3. **Dashboard**: Gráficos y métricas avanzadas
4. **Búsqueda Avanzada**: Búsqueda por contenido de datos
5. **Encriptación**: Encriptar datos sensibles en logs
6. **Retención Automática**: Políticas de retención configurables

### Optimizaciones

1. **Particionamiento**: Particionar tabla por fecha
2. **Compresión**: Comprimir datos antiguos
3. **Archivado**: Mover logs antiguos a archivo
4. **Índices Adicionales**: Optimizar consultas específicas

---

**Nota**: Este sistema de logs proporciona una base sólida para la auditoría y trazabilidad de todas las acciones en la aplicación. Se recomienda revisar y ajustar las políticas de retención según los requisitos específicos de la organización.
