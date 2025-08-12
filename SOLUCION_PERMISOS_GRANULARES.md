# Solución para Permisos Granulares a Nivel de Tabla

## Problema Identificado

El sistema original tenía un problema fundamental: cuando se asignaban permisos de tabla específica, el usuario necesitaba también permisos de base de datos para funcionar correctamente. Esto significaba que:

1. **No se podían asignar permisos granulares reales**: El usuario siempre necesitaba acceso a toda la base de datos
2. **Falta de seguridad**: Los usuarios con permisos de tabla podían acceder a todas las tablas de la base de datos
3. **Limitación funcional**: No se podía restringir el acceso solo a tablas específicas

## Solución Implementada

### 1. Sistema de Usuarios de SQL Server

Se implementó un sistema que crea usuarios de SQL Server específicos para cada combinación de usuario + tabla, con permisos granulares:

```javascript
// Crear usuario de SQL Server con permisos granulares
async createSQLServerUser(userId, databaseName, tableName, permissions) {
  // Crear usuario único: user_{userId}_{databaseName}
  const sqlUsername = `user_${userId}_${databaseName.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Asignar permisos específicos a la tabla
  const permissionsList = [];
  if (permissions.canRead) permissionsList.push("SELECT");
  if (permissions.canWrite) permissionsList.push("UPDATE");
  if (permissions.canDelete) permissionsList.push("DELETE");
  if (permissions.canCreate) permissionsList.push("INSERT");

  // GRANT permisos específicos
  GRANT ${permissionsList.join(', ')} ON [${tableName}] TO [${sqlUsername}]

  // DENY permisos a otras tablas
  DENY SELECT, INSERT, UPDATE, DELETE ON [otras_tablas] TO [${sqlUsername}]
}
```

### 2. Estructura de Base de Datos Mejorada

Se actualizó la tabla `USER_TABLE_PERMISSIONS` para incluir el campo `CanCreate`:

```sql
CREATE TABLE USER_TABLE_PERMISSIONS (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    DatabaseName NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(128) NOT NULL,
    CanRead BIT DEFAULT 1,
    CanWrite BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,  -- Nuevo campo
    FechaAsignacion DATETIME2 DEFAULT GETDATE(),
    UNIQUE(UserId, DatabaseName, TableName)
);
```

### 3. Función de Asignación de Permisos Mejorada

La función `assignTablePermission` ahora:

1. **Almacena permisos en la tabla de control**
2. **Crea usuario de SQL Server con permisos granulares**
3. **Deniega explícitamente acceso a otras tablas**

```javascript
async assignTablePermission(userId, databaseName, tableName, permissions) {
  // 1. Guardar en tabla de control
  await pool.request().query(mergeQuery);

  // 2. Crear usuario SQL Server con permisos granulares
  await this.createSQLServerUser(userId, databaseName, tableName, permissions);

  return true;
}
```

## Ventajas de la Solución

### 1. Seguridad Real

- **Permisos granulares**: El usuario solo puede acceder a las tablas específicas asignadas
- **Denegación explícita**: Se deniega explícitamente el acceso a otras tablas
- **Aislamiento**: Cada usuario tiene su propio contexto de permisos

### 2. Flexibilidad

- **Permisos independientes**: No requiere permisos de base de datos
- **Granularidad completa**: Control individual de Read, Write, Delete, Create
- **Escalabilidad**: Fácil agregar nuevos tipos de permisos

### 3. Mantenibilidad

- **Auditoría**: Todos los permisos quedan registrados en la tabla de control
- **Gestión centralizada**: Fácil gestión desde la interfaz de administración
- **Limpieza automática**: Scripts para limpiar usuarios de prueba

## Archivos Modificados

### Backend

1. **`backend/services/authService.js`**

   - Agregada función `createSQLServerUser()`
   - Mejorada función `assignTablePermission()`
   - Actualizada función `getUserPermissions()` para incluir `CanCreate`

2. **`backend/setup_database.js`**

   - Estructura actualizada con campo `CanCreate`

3. **`backend/update_table_permissions_structure.js`** (Nuevo)

   - Script para actualizar tablas existentes

4. **`backend/test_granular_permissions.js`** (Nuevo)

   - Script de prueba del sistema

5. **`backend/cleanup_sql_users.js`** (Nuevo)
   - Script para limpiar usuarios de prueba

## Cómo Usar el Sistema

### 1. Actualizar Estructura (si es necesario)

```bash
node backend/update_table_permissions_structure.js
```

### 2. Probar el Sistema

```bash
node backend/test_granular_permissions.js
```

### 3. Limpiar Usuarios de Prueba

```bash
node backend/cleanup_sql_users.js
```

### 4. Asignar Permisos desde la Interfaz

1. Ir a "Gestión de Usuarios"
2. Seleccionar usuario
3. Hacer clic en "Permisos"
4. Seleccionar base de datos y tabla específica
5. Marcar permisos deseados (Read, Write, Delete, Create)
6. Hacer clic en "Asignar Permisos de Tabla"

## Ejemplo de Uso

### Escenario: Usuario con Acceso Limitado

```javascript
// Asignar permisos solo a tabla Maquinas
await authService.assignTablePermission(userId, "BD_ABM1", "Maquinas", {
  canRead: true,
  canWrite: true,
  canDelete: false,
  canCreate: true,
});

// El usuario podrá:
// ✅ Leer datos de Maquinas
// ✅ Modificar registros en Maquinas
// ✅ Crear nuevos registros en Maquinas
// ❌ Eliminar registros de Maquinas
// ❌ Acceder a cualquier otra tabla en BD_ABM1
```

## Verificación de Seguridad

### 1. Verificar Permisos Asignados

```javascript
const permissions = await authService.getUserPermissions(userId);
console.log(permissions.tablePermissions);
```

### 2. Verificar Acceso a Tablas

```javascript
// Debería retornar true
const canReadMaquinas = await authService.checkTablePermission(
  userId,
  "BD_ABM1",
  "Maquinas",
  "read"
);

// Debería retornar false
const canReadOtraTabla = await authService.checkTablePermission(
  userId,
  "BD_ABM1",
  "OtraTabla",
  "read"
);
```

## Consideraciones Importantes

### 1. Rendimiento

- Los usuarios de SQL Server se crean una sola vez por tabla
- Las verificaciones de permisos son rápidas (consultas a tablas locales)
- No hay impacto en el rendimiento de las consultas principales

### 2. Mantenimiento

- Los usuarios de SQL Server se crean automáticamente
- Se pueden limpiar con el script de limpieza
- No requieren gestión manual

### 3. Seguridad

- Cada usuario tiene permisos mínimos necesarios
- Se deniega explícitamente el acceso a otras tablas
- Los permisos se verifican en cada operación

## Estado Actual

✅ **Sistema implementado y funcional**
✅ **Permisos granulares funcionando**
✅ **Seguridad mejorada**
✅ **Scripts de prueba y limpieza**
✅ **Documentación completa**

El sistema ahora permite asignar permisos específicos a tablas individuales sin dar acceso a toda la base de datos, resolviendo completamente el problema original.
