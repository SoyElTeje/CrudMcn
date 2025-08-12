# Solución: Listado de Tablas con Permisos Granulares

## Problema Identificado

El usuario reportó el siguiente error al intentar listar las tablas de una base de datos:

```
GET http://localhost:3001/api/databases/BD_ABM1/tables 403 (Forbidden)
No se pudieron cargar las tablas de BD_ABM1: Sin permisos de lectura en la base de datos
```

## Análisis del Problema

El problema se originaba en la lógica del middleware `requireReadPermission` en `backend/middleware/auth.js`. Cuando se intentaba listar las tablas de una base de datos (`/api/databases/:dbName/tables`), el middleware verificaba permisos a nivel de base de datos porque no había `tableName` en los parámetros de la ruta.

Sin embargo, con el sistema de permisos granulares implementado, los usuarios tienen permisos específicos en tablas individuales, pero no necesariamente permisos generales de base de datos. Esto causaba que usuarios con permisos granulares no pudieran listar las tablas de una base de datos.

## Solución Implementada

### 1. Nueva Función en AuthService

Se agregó la función `canListTables(userId, databaseName)` en `backend/services/authService.js`:

```javascript
async canListTables(userId, databaseName) {
  try {
    // Verificar si el usuario es admin
    const pool = await getPool();

    // Lógica para verificar si es admin...

    // Si el usuario es admin, puede listar todas las tablas
    if (isAdmin) return true;

    // Verificar si tiene permisos de base de datos
    const hasDatabasePermission = await this.checkDatabasePermission(
      userId,
      databaseName,
      "read"
    );
    if (hasDatabasePermission) return true;

    // Verificar si tiene permisos en al menos una tabla de la base de datos
    const tablePermissionsQuery =
      "SELECT COUNT(*) as count FROM USER_TABLE_PERMISSIONS WHERE UserId = @userId AND DatabaseName = @databaseName";
    const tablePermissionsResult = await pool
      .request()
      .input("userId", userId)
      .input("databaseName", databaseName)
      .query(tablePermissionsQuery);

    return tablePermissionsResult.recordset[0].count > 0;
  } catch (error) {
    console.error("Error checking table listing permission:", error);
    return false;
  }
}
```

### 2. Nuevo Middleware

Se creó el middleware `requireTableListingPermission` en `backend/middleware/auth.js`:

```javascript
const requireTableListingPermission = async (req, res, next) => {
  try {
    const { dbName } = req.params;
    const canList = await authService.canListTables(req.user.id, dbName);

    if (!canList) {
      return res.status(403).json({
        error: "Sin permisos para listar tablas en esta base de datos",
      });
    }

    next();
  } catch (error) {
    console.error("Error verificando permisos para listar tablas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
```

### 3. Actualización de la Ruta

Se modificó la ruta `/api/databases/:dbName/tables` en `backend/server.js` para usar el nuevo middleware:

```javascript
// Antes
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  requireReadPermission,  // ← Este middleware verificaba permisos de BD
  async (req, res) => { ... }
);

// Después
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  requireTableListingPermission,  // ← Nuevo middleware específico
  async (req, res) => { ... }
);
```

## Lógica de Verificación

La nueva función `canListTables` implementa la siguiente lógica de verificación:

1. **Admin**: Si el usuario es administrador, puede listar todas las tablas
2. **Permisos de Base de Datos**: Si tiene permisos generales de lectura en la base de datos, puede listar las tablas
3. **Permisos Granulares**: Si tiene permisos en al menos una tabla específica de la base de datos, puede listar las tablas

## Archivos Modificados

1. `backend/services/authService.js` - Agregada función `canListTables`
2. `backend/middleware/auth.js` - Agregado middleware `requireTableListingPermission`
3. `backend/server.js` - Actualizada ruta para usar nuevo middleware
4. `backend/test_table_listing_permissions.js` - Script de prueba (nuevo)

## Resultados de la Prueba

El script de prueba confirmó que la solución funciona correctamente:

```
🧪 Probando permisos para listar tablas...

1. ✅ Usuario creado
2. ✅ Token obtenido
3. ✅ Correcto: Acceso denegado sin permisos
4. ✅ ID del usuario: 1008
5. ✅ Permisos de tabla asignados
6. ✅ Correcto: Se pueden listar las tablas
   📋 Tablas encontradas: 4
   - dbo.Maquinas
   - dbo.Funcionario
   - dbo.UsaMaquina
   - dbo.CON_CHECK
7. ✅ Correcto: Acceso denegado a tabla sin permisos
8. ✅ Correcto: Puede acceder a tabla con permisos

🎉 Prueba completada exitosamente!
```

## Beneficios de la Solución

1. **Compatibilidad**: Mantiene la funcionalidad existente para usuarios con permisos de base de datos
2. **Granularidad**: Permite que usuarios con permisos granulares puedan listar tablas
3. **Seguridad**: Mantiene el control de acceso apropiado
4. **Flexibilidad**: Los administradores mantienen acceso completo

## Uso

La solución es transparente para el usuario final. Ahora, cuando un usuario con permisos granulares intente listar las tablas de una base de datos donde tiene permisos en al menos una tabla, podrá ver la lista completa de tablas disponibles, pero solo podrá acceder a aquellas para las que tiene permisos específicos.
