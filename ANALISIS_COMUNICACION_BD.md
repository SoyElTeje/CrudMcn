# Análisis de Comunicación con Base de Datos - ABM McN

## 📋 Resumen Ejecutivo

Esta aplicación utiliza una arquitectura de **pool de conexiones** para comunicarse con SQL Server, implementando un sistema robusto de gestión de conexiones, construcción dinámica de queries con protección contra SQL Injection, y un sistema de permisos granular por base de datos y tabla.

---

## 🏗️ Arquitectura de Comunicación con BD

### 1. **Capa de Configuración y Pool de Conexiones**

#### 1.1. Configuración Base (`backend/config/database.js`)

La aplicación utiliza la librería `mssql` (node-mssql) para conectarse a SQL Server. La configuración se gestiona mediante una clase `DatabaseConfig` que implementa:

**Características principales:**
- **Pool de conexiones**: Sistema de pooling para reutilizar conexiones y mejorar el rendimiento
- **Configuración por ambiente**: Diferentes configuraciones para desarrollo, staging y producción
- **Retry logic**: Reintentos automáticos en caso de fallo de conexión (3 intentos)
- **Health checks**: Monitoreo periódico del estado de las conexiones
- **Event listeners**: Monitoreo de eventos de conexión, errores y cierre

**Configuración del pool según ambiente:**

```javascript
// Desarrollo
pool: {
  max: 5,              // Máximo 5 conexiones
  min: 1,              // Mínimo 1 conexión
  idleTimeoutMillis: 30000  // 30 segundos de timeout
}

// Producción
pool: {
  max: 20,             // Máximo 20 conexiones (configurable)
  min: 5,              // Mínimo 5 conexiones
  idleTimeoutMillis: 300000  // 5 minutos de timeout
}
```

**Parámetros de conexión:**
- `DB_SERVER`: Servidor SQL Server
- `DB_PORT`: Puerto (default: 1433)
- `DB_USER`: Usuario de base de datos
- `DB_PASSWORD`: Contraseña
- `DB_DATABASE`: Base de datos por defecto
- `DB_ENCRYPT`: Habilitar encriptación (TLS/SSL) - **Actualmente: `false`**
- `DB_TRUST_CERT`: Confiar en certificado del servidor - **Actualmente: `true`**

#### 1.2. Gestión de Pools (`backend/db.js`)

Este módulo actúa como **interfaz simplificada** para obtener pools de conexión:

```javascript
// Obtener pool para una base de datos específica
const pool = await getPool(dbName);

// El pool se reutiliza si ya existe y está conectado
// Si no existe, se crea uno nuevo automáticamente
```

**Características:**
- **Singleton pattern**: Un solo pool por base de datos
- **Lazy initialization**: Los pools se crean solo cuando se necesitan
- **Auto-reconexión**: Si un pool se desconecta, se elimina y se recrea en el próximo uso
- **Graceful shutdown**: Cierre ordenado de pools al terminar la aplicación

---

### 2. **Flujo de Ejecución de Queries**

#### 2.1. Proceso General

```
1. Request HTTP → 2. Middleware Auth → 3. Middleware Permisos → 4. Obtener Pool → 5. Construir Query → 6. Ejecutar Query → 7. Retornar Resultado
```

#### 2.2. Ejemplo: Lectura de Datos

**Endpoint**: `GET /api/databases/:dbName/tables/:tableName/records`

**Paso 1: Autenticación**
```javascript
// Middleware verifica token JWT
authenticateToken(req, res, next)
```

**Paso 2: Verificación de Permisos**
```javascript
// Middleware verifica permisos de lectura
requireReadPermission(req, res, next)
// Consulta la tabla user_permissions para verificar acceso
```

**Paso 3: Obtener Pool de Conexión**
```javascript
const pool = await getPool(dbName);
// Si el pool no existe, se crea automáticamente
// Si existe pero está desconectado, se recrea
```

**Paso 4: Construir Query con QueryBuilder**
```javascript
const { buildSelectQuery } = require("./utils/queryBuilder");

const request = pool.request(); // Crear request del pool

const query = await buildSelectQuery(
  tableName,
  parsedFilters,    // Filtros del usuario
  parsedSort,       // Ordenamiento
  limit,            // Límite de registros
  offset,          // Offset para paginación
  request,         // Objeto request para agregar parámetros
  dbName
);
```

**Paso 5: Ejecutar Query**
```javascript
const result = await request.query(query);
// Los parámetros ya están vinculados al request
// SQL Server ejecuta la query con parámetros preparados
```

**Paso 6: Retornar Resultado**
```javascript
res.json({
  database: dbName,
  table: tableName,
  count: result.recordset.length,
  data: result.recordset  // Array de registros
});
```

---

### 3. **Sistema de Construcción de Queries (QueryBuilder)**

#### 3.1. Ubicación: `backend/utils/queryBuilder.js`

El QueryBuilder es responsable de construir queries SQL de forma **segura y dinámica**.

#### 3.2. Protección contra SQL Injection

**Método utilizado: Parámetros Preparados**

Todas las queries utilizan **parámetros preparados** en lugar de concatenación de strings:

```javascript
// ❌ INCORRECTO (vulnerable a SQL Injection)
const query = `SELECT * FROM [${tableName}] WHERE [${column}] = '${value}'`;

// ✅ CORRECTO (usando parámetros preparados)
const query = `SELECT * FROM [${tableName}] WHERE [${column}] = @paramName`;
request.input("paramName", value);
```

**Ejemplo en el código:**

```javascript
// En buildWhereClause()
case "equals":
  condition = `[${column}] = @${paramName}`;
  request.input(paramName, value);  // Parámetro vinculado de forma segura
  break;

case "contains":
  condition = `[${column}] LIKE @${paramName}`;
  request.input(paramName, `%${value}%`);  // El valor se escapa automáticamente
  break;
```

#### 3.3. Construcción de Queries SELECT

**Función**: `buildSelectQuery()`

**Características:**
1. **Detección automática de tipos de datos**: Consulta `INFORMATION_SCHEMA.COLUMNS` para obtener tipos
2. **Formateo de fechas**: Aplica `FORMAT()` a tipos fecha/datetime para mostrar en formato DD/MM/YYYY
3. **Protección de nombres de columnas**: Usa corchetes `[columnName]` para evitar conflictos con palabras reservadas
4. **Paginación con ROW_NUMBER()**: Compatible con versiones antiguas de SQL Server

**Ejemplo de query generada:**

```sql
SELECT 
  CASE WHEN [FechaNacimiento] IS NULL THEN NULL 
       ELSE FORMAT(TRY_CAST([FechaNacimiento] AS date), 'dd/MM/yyyy') 
  END as [FechaNacimiento],
  [Nombre],
  [Apellido]
FROM [Usuarios]
WHERE [Nombre] LIKE @filter_0
ORDER BY [Nombre] ASC
```

#### 3.4. Construcción de Queries INSERT

**Ubicación**: `backend/server.js` (línea ~477)

**Proceso:**
1. Obtener estructura de la tabla (columnas, tipos, identity columns)
2. Filtrar columnas identity (auto-increment) - no se insertan
3. Construir query con solo columnas que tienen valores
4. Vincular parámetros de forma segura

**Ejemplo:**

```javascript
// Query construida dinámicamente
const query = `INSERT INTO [${tableName}] ([Nombre], [Email]) VALUES (@param_Nombre, @param_Email)`;

const request = pool.request();
request.input("param_Nombre", record.Nombre);
request.input("param_Email", record.Email);

await request.query(query);
```

#### 3.5. Construcción de Queries UPDATE

**Proceso:**
1. Identificar primary keys de la tabla
2. Construir cláusula SET con columnas a actualizar (excluyendo PKs)
3. Construir cláusula WHERE usando primary keys
4. Vincular parámetros de forma segura

**Ejemplo:**

```javascript
// Query construida
const query = `UPDATE [${tableName}] 
               SET [Nombre] = @param_Nombre, [Email] = @param_Email 
               WHERE [Id] = @where_Id`;

const request = pool.request();
request.input("param_Nombre", record.Nombre);
request.input("param_Email", record.Email);
request.input("where_Id", primaryKeyValues.Id);
```

#### 3.6. Construcción de Queries DELETE

**Proceso:**
1. Identificar primary keys
2. Construir WHERE usando todas las primary keys
3. Obtener datos anteriores para logging
4. Ejecutar DELETE con parámetros

---

### 4. **Sistema de Permisos y Seguridad**

#### 4.1. Estructura de Permisos

La aplicación utiliza una tabla `user_permissions` que almacena:

- `user_id`: ID del usuario
- `database_name`: Nombre de la base de datos
- `table_name`: Nombre de la tabla (NULL para permisos a nivel de BD)
- `permission_type`: Tipo de permiso (read, write, create, delete)

#### 4.2. Verificación de Permisos

**Middleware de permisos** (`backend/middleware/auth.js`):

```javascript
// Ejemplo: requireReadPermission
const requireReadPermission = async (req, res, next) => {
  // 1. Verificar autenticación
  if (!req.user) return res.status(401).json({ error: "No autenticado" });
  
  // 2. Administradores tienen todos los permisos
  if (req.user.isAdmin) return next();
  
  // 3. Consultar permisos en BD
  const hasPermission = await authService.checkTablePermission(
    req.user.id,
    dbName,
    tableName,
    "read"
  );
  
  if (!hasPermission) {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  
  next();
};
```

**Consulta de permisos** (ejemplo):

```javascript
// En authService.checkTablePermission()
const query = `
  SELECT COUNT(*) as count
  FROM user_permissions
  WHERE user_id = @userId
    AND database_name = @dbName
    AND (table_name = @tableName OR table_name IS NULL)
    AND permission_type = @permission
`;

const result = await pool
  .request()
  .input("userId", userId)
  .input("dbName", dbName)
  .input("tableName", tableName)
  .input("permission", permission)
  .query(query);

return result.recordset[0].count > 0;
```

---

### 5. **Manejo de Datos Especiales**

#### 5.1. Conversión de Fechas

**Problema**: SQL Server almacena fechas en formato ISO (YYYY-MM-DD), pero la UI muestra DD/MM/YYYY.

**Solución en SELECT:**
- Usa `FORMAT()` de SQL Server para convertir fechas al formato DD/MM/YYYY
- Solo aplica a tipos de datos fecha reales (date, datetime, datetime2)
- No aplica a columnas de texto aunque se llamen "fecha"

**Solución en INSERT/UPDATE:**
- Convierte DD/MM/YYYY → YYYY-MM-DD antes de insertar
- Valida formato y rechaza MM/DD/YYYY
- Usa `convertToISODate()` de `dateUtils.js`

#### 5.2. Manejo de Tipos de Datos

El QueryBuilder detecta automáticamente tipos de datos y los parsea correctamente:

```javascript
function parseValueByType(value, dataType) {
  // Números enteros
  if (["int", "bigint"].includes(dataType)) {
    return parseInt(value) || 0;
  }
  
  // Números decimales
  if (["decimal", "float"].includes(dataType)) {
    return parseFloat(value) || 0;
  }
  
  // Booleanos
  if (dataType === "bit") {
    return value === "1" || value === "true" ? 1 : 0;
  }
  
  // Fechas (ya procesadas antes)
  // ...
}
```

---

### 6. **Operaciones CRUD Detalladas**

#### 6.1. CREATE (INSERT)

**Endpoint**: `POST /api/databases/:dbName/tables/:tableName/records`

**Flujo:**
1. Verificar autenticación y permisos de creación
2. Verificar que la tabla esté activada
3. Validar datos según condiciones configuradas
4. Obtener estructura de la tabla
5. Filtrar columnas identity (no se insertan)
6. Construir query INSERT con parámetros
7. Ejecutar query
8. Registrar log de auditoría
9. Retornar resultado

**Validaciones:**
- Columnas NOT NULL deben tener valor
- Tipos de datos deben coincidir
- Constraints CHECK se validan en BD
- Primary keys deben ser únicas

#### 6.2. READ (SELECT)

**Endpoint**: `GET /api/databases/:dbName/tables/:tableName/records`

**Flujo:**
1. Verificar autenticación y permisos de lectura
2. Obtener pool de conexión
3. Parsear filtros y ordenamiento del query string
4. Construir query SELECT con QueryBuilder
5. Ejecutar query
6. Retornar datos formateados

**Características:**
- Paginación con `limit` y `offset`
- Filtros dinámicos (equals, contains, greater_than, etc.)
- Ordenamiento por columna
- Formateo automático de fechas

#### 6.3. UPDATE

**Endpoint**: `PUT /api/databases/:dbName/tables/:tableName/records`

**Flujo:**
1. Verificar autenticación y permisos de escritura
2. Verificar que la tabla esté activada
3. Validar datos
4. Identificar primary keys
5. Obtener datos anteriores (para log)
6. Construir query UPDATE
7. Ejecutar query
8. Registrar log de auditoría
9. Retornar resultado

**Importante:**
- Las primary keys NO se pueden actualizar
- Se usa WHERE con todas las primary keys para identificar el registro

#### 6.4. DELETE

**Endpoint**: `DELETE /api/databases/:dbName/tables/:tableName/records`

**Flujo:**
1. Verificar autenticación y permisos de eliminación
2. Identificar primary keys
3. Obtener datos anteriores (para log)
4. Construir query DELETE
5. Ejecutar query
6. Registrar log de auditoría
7. Retornar resultado

**DELETE Múltiple:**
- Endpoint: `DELETE /api/databases/:dbName/tables/:tableName/records/bulk`
- Elimina múltiples registros en un loop
- Cada eliminación se registra en el log

---

### 7. **Sistema de Logging y Auditoría**

#### 7.1. Servicio de Logs (`backend/services/logService.js`)

Todas las operaciones CRUD se registran en una tabla de logs con:
- Usuario que realizó la operación
- Base de datos y tabla afectada
- Tipo de operación (INSERT, UPDATE, DELETE)
- Datos anteriores y nuevos (para UPDATE)
- IP y User-Agent
- Timestamp

**Ejemplo de registro:**

```javascript
await logService.logInsert(
  req.user.id,           // ID del usuario
  req.user.username,     // Nombre de usuario
  dbName,                // Base de datos
  tableName,             // Tabla
  record,                 // Datos insertados
  null,                   // ID del registro (si aplica)
  result.rowsAffected[0], // Filas afectadas
  req.ip,                 // IP del cliente
  req.get("User-Agent")   // User-Agent
);
```

---

### 8. **Manejo de Errores**

#### 8.1. Errores de Conexión

- **Retry automático**: 3 intentos con delay incremental
- **Health checks**: Monitoreo periódico de pools
- **Logging detallado**: Todos los errores se registran

#### 8.2. Errores de SQL

La aplicación detecta y traduce errores comunes de SQL Server:

```javascript
// Ejemplo: Error de clave primaria duplicada
if (error.message.includes("primary key") || 
    error.message.includes("duplicate key")) {
  errorMessage = "Ya existe un registro con la misma clave primaria";
  errorType = "primary_key_violation";
}

// Ejemplo: Error de constraint CHECK
if (error.message.includes("check constraint")) {
  errorMessage = "Los datos no cumplen con las restricciones de validación";
  errorType = "check_constraint_violation";
}
```

#### 8.3. Errores de Validación

- Validación de formato de fechas
- Validación de tipos de datos
- Validación de constraints de tablas activadas

---

### 9. **Operaciones Especiales**

#### 9.1. Importación desde Excel

**Endpoint**: `POST /api/databases/:dbName/tables/:tableName/import-excel`

**Proceso:**
1. Subir archivo Excel (multer)
2. Leer archivo con ExcelJS
3. Validar columnas contra estructura de tabla
4. Insertar filas una por una con validación
5. Generar reporte de errores si hay fallos
6. Registrar log de importación

#### 9.2. Exportación a Excel

**Endpoint**: `GET /api/databases/:dbName/tables/:tableName/export-excel`

**Opciones:**
- `exportType=all`: Exporta todos los registros
- `exportType=current_page`: Exporta solo la página actual
- Aplica filtros y ordenamiento si se especifican

---

### 10. **Resumen del Flujo Completo**

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST HTTP                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          MIDDLEWARE: authenticateToken()                     │
│          - Verifica JWT token                               │
│          - Extrae información del usuario                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          MIDDLEWARE: requireReadPermission()                │
│          - Consulta user_permissions                        │
│          - Verifica acceso a BD/tabla                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          OBTENER POOL: getPool(dbName)                       │
│          - Verifica si pool existe                          │
│          - Crea pool si no existe                           │
│          - Retorna pool conectado                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          QUERY BUILDER: buildSelectQuery()                   │
│          - Consulta INFORMATION_SCHEMA.COLUMNS               │
│          - Construye SELECT con parámetros                   │
│          - Aplica filtros, ordenamiento, paginación          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          EJECUTAR QUERY: request.query()                    │
│          - SQL Server ejecuta query con parámetros           │
│          - Retorna result.recordset                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          RESPONSE JSON                                       │
│          { database, table, count, data }                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 11. **Mejores Prácticas Implementadas**

✅ **Parámetros preparados**: Todas las queries usan parámetros, no concatenación
✅ **Pool de conexiones**: Reutilización eficiente de conexiones
✅ **Validación de entrada**: Validación de tipos y formatos antes de insertar
✅ **Manejo de errores**: Detección y traducción de errores SQL
✅ **Logging**: Auditoría completa de operaciones
✅ **Permisos granulares**: Control de acceso por BD y tabla
✅ **Health checks**: Monitoreo de estado de conexiones
✅ **Graceful shutdown**: Cierre ordenado de recursos

---

### 12. **Encriptación en la Comunicación con BD**

#### 12.1. Estado Actual

⚠️ **IMPORTANTE: La encriptación está DESHABILITADA actualmente**

**Configuración encontrada en `backend/env.production`:**
```bash
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

**Implicaciones:**
- ❌ La comunicación entre la aplicación y SQL Server **NO está encriptada**
- ❌ Las credenciales, queries y datos viajan en **texto plano** por la red
- ⚠️ Esto es un **riesgo de seguridad** especialmente en redes no confiables

#### 12.2. Cómo Funciona la Encriptación (si se habilita)

La aplicación utiliza la librería `mssql` que soporta encriptación TLS/SSL nativa de SQL Server:

**Configuración en el código** (`backend/config/database.js`):
```javascript
options: {
  encrypt: process.env.DB_ENCRYPT === "true",  // Habilita TLS/SSL
  trustServerCertificate: process.env.DB_TRUST_CERT === "true",  // Confía en certificado
  enableArithAbort: true,
  // ...
}
```

**Opciones de encriptación:**

1. **`encrypt: true`** - Habilita encriptación TLS/SSL
   - Requiere que SQL Server tenga certificado configurado
   - Encripta toda la comunicación (credenciales, queries, resultados)
   - Recomendado para producción

2. **`trustServerCertificate: true`** - Confía en el certificado del servidor
   - Útil cuando el certificado es auto-firmado
   - En desarrollo/testing es común usarlo
   - En producción, idealmente validar el certificado

#### 12.3. Cómo Habilitar la Encriptación

**Para habilitar encriptación, configurar en `.env` o `env.production`:**

```bash
# Habilitar encriptación TLS/SSL
DB_ENCRYPT=true

# Si el certificado es auto-firmado o no confiable
DB_TRUST_CERT=true

# Si tienes un certificado válido y confiable
DB_TRUST_CERT=false  # Validará el certificado
```

**Requisitos en SQL Server:**
1. SQL Server debe tener un certificado configurado
2. El puerto debe permitir conexiones encriptadas (normalmente el mismo 1433)
3. El firewall debe permitir conexiones encriptadas

**Verificar configuración:**
```bash
# Ejecutar script de prueba
node backend/scripts/test-db-connection.js
# Mostrará si la encriptación está habilitada
```

#### 12.4. Recomendaciones de Seguridad

✅ **Para Desarrollo/Testing:**
- Puede estar deshabilitada si la red es confiable (localhost, red interna)
- Si se habilita, usar `DB_TRUST_CERT=true` para certificados auto-firmados

✅ **Para Producción:**
- **OBLIGATORIO habilitar encriptación** (`DB_ENCRYPT=true`)
- Usar certificados válidos (no auto-firmados)
- Configurar `DB_TRUST_CERT=false` para validar certificados
- Considerar usar Azure SQL Database o SQL Server con Always Encrypted para datos sensibles

⚠️ **Riesgos de no usar encriptación:**
- Interceptación de credenciales (Man-in-the-Middle)
- Lectura de queries y resultados en tránsito
- Modificación de datos en tránsito
- Violación de compliance (GDPR, HIPAA, etc.)

---

### 13. **Consideraciones de Seguridad**

#### 12.1. Protección contra SQL Injection

✅ **Implementado correctamente:**
- Uso de parámetros preparados en todas las queries
- Nombres de tablas/columnas se validan (aunque podrían mejorarse)
- Valores de usuario nunca se concatenan directamente

⚠️ **Áreas de mejora:**
- Validación más estricta de nombres de tablas/columnas (solo alfanuméricos y guiones bajos)
- Whitelist de tablas permitidas

#### 12.2. Gestión de Credenciales

✅ **Buenas prácticas:**
- Credenciales en variables de entorno
- No hardcodeadas en el código

⚠️ **Áreas de mejora:**
- No commitear archivos `.env` o `env.production`
- Usar secretos gestionados (Azure Key Vault, etc.)

---

## 📊 Conclusión

La aplicación implementa una **arquitectura robusta y segura** para la comunicación con SQL Server:

1. **Pool de conexiones eficiente** con gestión automática
2. **Queries parametrizadas** para prevenir SQL Injection
3. **Sistema de permisos granular** por base de datos y tabla
4. **QueryBuilder dinámico** que construye queries seguras
5. **Manejo completo de errores** con traducción a mensajes amigables
6. **Logging y auditoría** de todas las operaciones
7. **Validación de datos** antes de insertar/actualizar

La comunicación con la base de datos está bien estructurada y sigue las mejores prácticas de seguridad y rendimiento.

---

**Fecha del análisis**: 2024
**Versión analizada**: Código actual del repositorio
**Analista**: Análisis técnico automatizado

