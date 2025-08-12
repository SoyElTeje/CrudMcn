# Solución para Permisos Específicos de Tabla

## Problema Identificado

El sistema de permisos específicos de tabla no está funcionando correctamente. Los usuarios no pueden acceder a tablas específicas aunque tengan los permisos asignados.

## Análisis del Sistema Actual

### Estructura de Permisos

El sistema tiene dos niveles de permisos:

1. **Permisos de Base de Datos** (`USER_DATABASE_PERMISSIONS`)

   - Controlan acceso general a una base de datos
   - Aplican a todas las tablas de esa base de datos

2. **Permisos de Tabla Específica** (`USER_TABLE_PERMISSIONS`)
   - Controlan acceso a tablas específicas
   - Sobrescriben permisos de base de datos para esa tabla

### Jerarquía de Verificación

La verificación de permisos sigue este orden:

1. **¿Es administrador?** → Acceso total
2. **¿Tiene permisos específicos de tabla?** → Usar permisos de tabla
3. **¿Tiene permisos de base de datos?** → Usar permisos de BD como fallback
4. **Sin permisos** → Acceso denegado

## Problemas Identificados

### 1. Problema en la Lógica de Verificación

**Archivo:** `backend/services/authService.js` - Función `checkTablePermission`

**Problema:** La función verifica permisos de tabla pero no siempre usa correctamente el fallback a permisos de base de datos.

**Solución:** La función ya tiene la lógica correcta, pero puede haber problemas en la asignación de permisos.

### 2. Problema en los Middlewares

**Archivo:** `backend/middleware/auth.js`

**Problema:** Los middlewares pueden no estar aplicando correctamente la lógica de verificación.

**Solución:** Verificar que los middlewares usen las funciones correctas.

### 3. Problema en la Asignación de Permisos

**Problema:** Los permisos pueden no estar asignándose correctamente en la base de datos.

**Solución:** Verificar la inserción y actualización de permisos.

## Scripts de Diagnóstico y Solución

### 1. Script de Diagnóstico

```bash
node diagnose_permissions.js
```

Este script identifica el problema específico en el sistema de permisos.

### 2. Script de Configuración

```bash
node setup_table_permissions.js
```

Este script:

- Crea un usuario de prueba
- Asigna permisos específicos de tabla
- Verifica que los permisos se asignen correctamente

### 3. Script de Prueba

```bash
node test_table_permissions.js
```

Este script prueba diferentes escenarios de permisos para verificar el funcionamiento.

### 4. Script de Corrección

```bash
node fix_table_permissions.js
```

Este script analiza el sistema completo y proporciona recomendaciones de solución.

## Pasos para Solucionar el Problema

### Paso 1: Verificar la Base de Datos

1. Asegurar que SQL Server esté ejecutándose
2. Verificar la conexión a la base de datos
3. Confirmar que las tablas de permisos existen

### Paso 2: Ejecutar Diagnóstico

```bash
cd backend
node diagnose_permissions.js
```

### Paso 3: Configurar Permisos de Prueba

```bash
node setup_table_permissions.js
```

### Paso 4: Probar el Sistema

```bash
node test_table_permissions.js
```

### Paso 5: Aplicar Correcciones

Basándose en los resultados de los scripts, aplicar las correcciones necesarias:

1. **Si hay problemas en la asignación de permisos:**

   - Verificar las funciones `assignTablePermission` y `assignDatabasePermission`
   - Revisar las consultas SQL

2. **Si hay problemas en la verificación:**

   - Revisar las funciones `checkTablePermission` y `checkDatabasePermission`
   - Verificar la lógica de fallback

3. **Si hay problemas en los middlewares:**
   - Revisar que los middlewares usen las funciones correctas
   - Verificar el manejo de errores

## Ejemplo de Uso Correcto

### Asignar Permisos de Tabla Específica

```javascript
// Asignar permisos de lectura a una tabla específica
await authService.assignTablePermission(userId, "BD_ABM1", "Maquinas", {
  canRead: true,
  canWrite: false,
  canDelete: false,
});
```

### Verificar Permisos

```javascript
// Verificar si un usuario puede leer una tabla específica
const canRead = await authService.checkTablePermission(
  userId,
  "BD_ABM1",
  "Maquinas",
  "read"
);
```

## Verificación del Funcionamiento

### Escenario 1: Usuario con Permisos de BD pero no de Tabla

- **Entrada:** Usuario tiene permisos de lectura en BD_ABM1
- **Acción:** Intenta acceder a BD_ABM1.Maquinas (sin permisos específicos)
- **Resultado esperado:** Acceso permitido (usando permisos de BD)

### Escenario 2: Usuario con Permisos Específicos de Tabla

- **Entrada:** Usuario tiene permisos específicos en BD_ABM1.Maquinas
- **Acción:** Intenta acceder a BD_ABM1.Maquinas
- **Resultado esperado:** Acceso permitido (usando permisos específicos)

### Escenario 3: Usuario sin Permisos

- **Entrada:** Usuario no tiene permisos de BD ni de tabla
- **Acción:** Intenta acceder a BD_ABM1.Maquinas
- **Resultado esperado:** Acceso denegado

## Logs de Debug

Para debuggear problemas de permisos, agregar logs en las funciones:

```javascript
console.log(
  `🔍 Verificando permisos: Usuario ${userId}, BD ${databaseName}, Tabla ${tableName}, Operación ${operation}`
);
```

## Conclusión

El sistema de permisos específicos de tabla está diseñado correctamente, pero puede haber problemas en:

1. La asignación de permisos en la base de datos
2. La verificación de permisos en tiempo de ejecución
3. La aplicación de middlewares

Los scripts proporcionados ayudarán a identificar y solucionar estos problemas específicos.
