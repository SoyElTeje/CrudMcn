# Sistema de Filtros Avanzados

## 📋 Descripción

El sistema de filtros avanzados permite a los usuarios filtrar y ordenar los datos de las tablas de manera dinámica y flexible. El sistema está completamente implementado tanto en el frontend como en el backend.

## 🎯 Características

### ✅ Funcionalidades Implementadas

1. **Filtros Dinámicos**

   - Filtros por columna específica
   - Múltiples operadores según el tipo de dato
   - Soporte para múltiples filtros simultáneos
   - Filtros en tiempo real

2. **Operadores por Tipo de Dato**

   - **Texto (varchar, nvarchar, char, text)**: igual, contiene, diferente, comienza con, termina con
   - **Números (int, bigint, smallint, tinyint, decimal, float, real, money)**: igual, mayor que, mayor o igual, menor que, menor o igual, distinto
   - **Booleanos (bit)**: igual
   - **Fechas (datetime, datetime2, date, smalldatetime, time)**: igual, posterior a, anterior a

3. **Ordenamiento**

   - Ordenamiento por columna específica
   - Dirección ascendente/descendente
   - Integración con filtros

4. **Paginación Integrada**
   - Los filtros se aplican a la paginación
   - Conteo correcto de registros filtrados
   - Navegación entre páginas con filtros activos

## 🔧 Implementación Técnica

### Frontend (React + TypeScript)

#### Componente: `AdvancedFilters.tsx`

```typescript
interface FilterCondition {
  column: string;
  operator: string;
  value: string;
  dataType: string;
}

interface SortCondition {
  column: string;
  direction: "ASC" | "DESC";
}
```

#### Funcionalidades del Componente

- **Gestión de Estado**: Manejo de filtros y ordenamiento
- **Validación de Tipos**: Operadores específicos por tipo de dato
- **UI Responsiva**: Interfaz intuitiva y fácil de usar
- **Integración**: Comunicación con el componente padre

### Backend (Node.js + SQL Server)

#### Endpoints Implementados

1. **GET `/api/databases/:dbName/tables/:tableName/records`**

   - Parámetros: `limit`, `offset`, `filters`, `sort`
   - Soporte completo para filtros y ordenamiento

2. **GET `/api/databases/:dbName/tables/:tableName/count`**
   - Parámetros: `filters`
   - Conteo de registros con filtros aplicados

#### Utilidad: `queryBuilder.js`

```javascript
// Construcción de consultas dinámicas
function buildSelectQuery(tableName, filters, sort, limit, offset, request)
function buildCountQuery(tableName, filters, request)
function buildWhereClause(filters, request)
function buildOrderByClause(sort)
```

## 🚀 Cómo Usar

### 1. Acceso a los Filtros

1. Inicia sesión en la aplicación
2. Selecciona una base de datos
3. Selecciona una tabla
4. Los filtros aparecerán automáticamente debajo del encabezado de la tabla

### 2. Agregar Filtros

1. Haz clic en **"+ Agregar Filtro"**
2. Selecciona la columna a filtrar
3. Elige el operador apropiado
4. Ingresa el valor del filtro
5. El filtro se aplica automáticamente

### 3. Configurar Ordenamiento

1. En la sección "Ordenamiento"
2. Selecciona la columna para ordenar
3. Elige la dirección (Ascendente/Descendente)

### 4. Limpiar Filtros

- **Filtro individual**: Haz clic en "✕" junto al filtro
- **Todos los filtros**: Haz clic en "Limpiar Todo"

## 📊 Ejemplos de Uso

### Filtro de Texto

```json
{
  "column": "nombre",
  "operator": "contains",
  "value": "Juan",
  "dataType": "varchar"
}
```

### Filtro Numérico

```json
{
  "column": "edad",
  "operator": "greater_than",
  "value": "18",
  "dataType": "int"
}
```

### Filtro de Fecha

```json
{
  "column": "fecha_creacion",
  "operator": "greater_than",
  "value": "2024-01-01",
  "dataType": "datetime"
}
```

### Ordenamiento

```json
{
  "column": "nombre",
  "direction": "ASC"
}
```

## 🔍 Operadores Disponibles

### Texto

- `equals`: Igual a
- `contains`: Contiene
- `not_equals`: Diferente de
- `starts_with`: Comienza con
- `ends_with`: Termina con

### Números

- `equals`: Igual a
- `greater_than`: Mayor que
- `greater_equals`: Mayor o igual que
- `less_than`: Menor que
- `less_equals`: Menor o igual que
- `not_equals`: Distinto de

### Fechas

- `equals`: Igual a
- `greater_than`: Posterior a
- `less_than`: Anterior a

### Booleanos

- `equals`: Igual a

## 🛠️ Mantenimiento

### Agregar Nuevos Tipos de Datos

1. **Frontend**: Agregar el tipo en `OPERATORS_BY_TYPE`
2. **Backend**: Agregar el tipo en `parseValueByType`

### Agregar Nuevos Operadores

1. **Frontend**: Agregar el operador en `OPERATORS_BY_TYPE`
2. **Backend**: Agregar la lógica en `buildWhereClause`

## ✅ Estado Actual

- ✅ **Frontend**: Completamente implementado y funcional
- ✅ **Backend**: Endpoints implementados y probados
- ✅ **Integración**: Comunicación frontend-backend funcionando
- ✅ **UI/UX**: Interfaz intuitiva y responsiva
- ✅ **Validación**: Validación de tipos y operadores
- ✅ **Paginación**: Integración completa con filtros
- ✅ **Persistencia de Filtros**: Los filtros permanecen visibles incluso cuando no hay resultados
- ✅ **Manejo de Estados Vacíos**: Mensajes informativos cuando no hay coincidencias

## 🎉 Conclusión

El sistema de filtros avanzados está completamente implementado y listo para usar. Proporciona una experiencia de usuario rica y flexible para el análisis y filtrado de datos en las tablas de la aplicación.

### 🔧 Correcciones Recientes

- **Problema Resuelto**: Los filtros ahora permanecen visibles incluso cuando no hay registros que coincidan
- **Mejora de UX**: Mensajes informativos que distinguen entre tabla vacía y filtros sin resultados
- **Persistencia de Estado**: Los filtros mantienen su estado para permitir correcciones fáciles
- **Sincronización**: El componente AdvancedFilters se sincroniza con el estado del componente padre
