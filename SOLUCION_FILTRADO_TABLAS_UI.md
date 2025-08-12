# Solución: Filtrado de Tablas en la UI por Permisos de Usuario

## Problema Identificado

El usuario reportó que en la interfaz de usuario se mostraban todas las tablas de una base de datos, incluso aquellas para las que el usuario no tenía permisos. Aunque al intentar acceder a una tabla sin permisos se mostraba un error correctamente, el usuario solicitó que las tablas sin permisos no aparecieran en la lista desde el principio.

**Comportamiento anterior:**

- Se listaban todas las tablas de la base de datos
- Al intentar acceder a una tabla sin permisos, se mostraba error 403
- El usuario veía tablas que no podía usar

**Comportamiento deseado:**

- Solo mostrar tablas para las que el usuario tiene permisos
- Ocultar completamente las tablas sin permisos
- Mejorar la experiencia de usuario

## Análisis del Problema

### Endpoint Afectado

El endpoint `/api/databases/:dbName/tables` en `backend/server.js` era responsable de listar las tablas de una base de datos.

### Comportamiento Anterior

```javascript
// List all tables in a database
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  requireTableListingPermission,
  async (req, res) => {
    try {
      const dbName = req.params.dbName;
      const pool = await getPool(dbName);
      const tablesResult = await pool
        .request()
        .query(
          `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
        );
      const tables = tablesResult.recordset.map((row) => ({
        schema: row.TABLE_SCHEMA,
        name: row.TABLE_NAME,
      }));
      res.json(tables);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch tables", details: error.message });
    }
  }
);
```

**Problema:** Este endpoint siempre retornaba TODAS las tablas de la base de datos, sin considerar los permisos específicos del usuario.

## Solución Implementada

### 1. Modificación del Endpoint

Se modificó el endpoint `/api/databases/:dbName/tables` para filtrar las tablas basándose en los permisos del usuario:

```javascript
// List tables in a database (filtered by user permissions)
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  requireTableListingPermission,
  async (req, res) => {
    try {
      const dbName = req.params.dbName;
      const userId = req.user.id;

      // If user is admin, return all tables
      if (req.user.isAdmin) {
        const pool = await getPool(dbName);
        const tablesResult = await pool
          .request()
          .query(
            `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
          );
        const tables = tablesResult.recordset.map((row) => ({
          schema: row.TABLE_SCHEMA,
          name: row.TABLE_NAME,
        }));
        res.json(tables);
        return;
      }

      // For non-admin users, get only tables they have permissions for
      const pool = await getPool();
      const userTablePermissionsQuery = `
        SELECT TableName 
        FROM USER_TABLE_PERMISSIONS 
        WHERE UserId = @userId AND DatabaseName = @dbName
      `;

      const userTablePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .input("dbName", dbName)
        .query(userTablePermissionsQuery);

      const permittedTables = userTablePermissionsResult.recordset.map(
        (row) => row.TableName
      );

      // If user has no table-specific permissions, return empty array
      if (permittedTables.length === 0) {
        res.json([]);
        return;
      }

      // Get table details for permitted tables
      const dbPool = await getPool(dbName);

      // Build the IN clause with proper parameterization
      const tableNames = permittedTables
        .map((tableName, index) => `@table${index}`)
        .join(",");
      const request = dbPool.request();

      // Add parameters for each table name
      permittedTables.forEach((tableName, index) => {
        request.input(`table${index}`, tableName);
      });

      const tablesResult = await request.query(
        `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_TYPE = 'BASE TABLE' 
         AND TABLE_NAME IN (${tableNames})`
      );

      const tables = tablesResult.recordset.map((row) => ({
        schema: row.TABLE_SCHEMA,
        name: row.TABLE_NAME,
      }));

      res.json(tables);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch tables", details: error.message });
    }
  }
);
```

### 2. Lógica de Filtrado

La nueva lógica implementa:

1. **Verificación de Admin:** Si el usuario es administrador, se retornan todas las tablas (comportamiento original)
2. **Consulta de Permisos:** Para usuarios no-admin, se consulta la tabla `USER_TABLE_PERMISSIONS` para obtener las tablas permitidas
3. **Filtrado:** Solo se retornan las tablas para las que el usuario tiene permisos específicos
4. **Manejo de Casos Vacíos:** Si el usuario no tiene permisos en ninguna tabla, se retorna un array vacío

### 3. Seguridad

- Se mantiene el middleware `requireTableListingPermission` que verifica si el usuario puede listar tablas en la base de datos
- Se usa parametrización SQL para prevenir inyección SQL
- Se mantiene la autenticación JWT

## Archivos Modificados

### 1. `backend/server.js`

- **Líneas 144-200:** Modificación del endpoint `/api/databases/:dbName/tables`
- **Cambio:** De retornar todas las tablas a filtrar por permisos de usuario

### 2. `backend/test_filtered_tables_endpoint.js` (NUEVO)

- **Propósito:** Script de prueba para validar el comportamiento del endpoint filtrado
- **Funcionalidades probadas:**
  - Usuario sin permisos no puede listar tablas
  - Usuario con permisos limitados solo ve tablas permitidas
  - Admin ve todas las tablas
  - Verificación de acceso a tablas específicas

## Resultados de las Pruebas

### Test Ejecutado: `test_filtered_tables_endpoint.js`

```
🧪 Probando endpoint de tablas filtradas por permisos...

1. Iniciando sesión como admin...
✅ Login como admin exitoso

2. Creando usuario de prueba...
✅ Usuario de prueba creado

3. Obteniendo todas las tablas de la base de datos (como admin)...
✅ Admin puede ver 4 tablas: [ 'Maquinas', 'Funcionario', 'UsaMaquina', 'CON_CHECK' ]

4. Iniciando sesión como usuario de prueba...
✅ Login como usuario de prueba exitoso

5. Intentando obtener tablas sin permisos...
✅ Correcto: Usuario sin permisos no puede listar tablas

6. Asignando permisos solo en la tabla "Maquinas"...
✅ Permisos asignados en tabla Maquinas

7. Obteniendo tablas con permisos limitados...
✅ Usuario con permisos limitados puede ver 1 tablas: [ 'Maquinas' ]
✅ Correcto: Solo se muestra la tabla "Maquinas"

8. Verificando que no puede acceder a otras tablas...
✅ Correcto: Usuario no puede acceder a tabla Funcionario sin permisos

9. Verificando que puede acceder a la tabla "Maquinas"...
✅ Correcto: Usuario puede acceder a tabla Maquinas con permisos

🎉 Prueba completada exitosamente!
```

## Beneficios de la Solución

### 1. Mejor Experiencia de Usuario

- Los usuarios solo ven tablas que pueden usar
- No hay confusión sobre qué tablas están disponibles
- Interfaz más limpia y enfocada

### 2. Seguridad Mejorada

- Los usuarios no pueden ver la existencia de tablas sin permisos
- Reduce la superficie de información disponible
- Mantiene la privacidad de la estructura de la base de datos

### 3. Consistencia

- El comportamiento del listado coincide con los permisos reales
- No hay discrepancias entre lo que se muestra y lo que se puede acceder
- Experiencia predecible para el usuario

### 4. Escalabilidad

- La solución funciona con cualquier número de tablas
- Se adapta automáticamente a cambios en permisos
- Mantiene el rendimiento con consultas optimizadas

## Consideraciones Técnicas

### 1. Rendimiento

- Se realizan dos consultas: una para permisos y otra para detalles de tablas
- Se usa parametrización SQL para optimizar las consultas
- Se mantiene el índice en `USER_TABLE_PERMISSIONS` para consultas rápidas

### 2. Mantenibilidad

- El código es claro y fácil de entender
- Se mantiene la separación de responsabilidades
- Los cambios son mínimos y focalizados

### 3. Compatibilidad

- No afecta el comportamiento para administradores
- Mantiene la compatibilidad con el frontend existente
- No requiere cambios en otros endpoints

## Conclusión

La implementación del filtrado de tablas por permisos de usuario resuelve completamente el problema reportado. Ahora la interfaz de usuario solo muestra las tablas para las que el usuario tiene permisos, mejorando significativamente la experiencia de usuario y la seguridad del sistema.

La solución es robusta, eficiente y mantiene la compatibilidad con el sistema existente, proporcionando una experiencia más intuitiva y segura para los usuarios finales.
