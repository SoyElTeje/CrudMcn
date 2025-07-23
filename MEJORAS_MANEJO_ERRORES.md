# Mejoras en el Manejo de Errores de Constraints

## Resumen

Se han implementado mejoras significativas en el manejo de errores de constraints de SQL Server para proporcionar mensajes más claros y específicos al usuario cuando ocurren errores durante las operaciones de inserción y actualización.

## Problema Original

Anteriormente, cuando ocurría un error de constraint (como violación de clave primaria, constraint CHECK, etc.), el sistema mostraba un mensaje genérico como "Failed to create record" sin especificar la causa real del error.

## Soluciones Implementadas

### 1. Backend - Detección Específica de Errores

#### Archivo: `backend/server.js`

Se ha mejorado el manejo de errores en los endpoints de:

- **POST** `/api/databases/:dbName/tables/:tableName/records` (Crear registros)
- **PUT** `/api/databases/:dbName/tables/:tableName/records` (Actualizar registros)

#### Tipos de Errores Detectados:

1. **Error de Clave Primaria Duplicada**

   - Detecta: `primary key`, `duplicate key`, `unique constraint`, `pk_`
   - Mensaje: "Ya existe un registro con la misma clave primaria. Verifique que los valores de identificación sean únicos."

2. **Error de Constraint CHECK**

   - Detecta: `check constraint`, `check_`
   - Mensaje: "Los datos no cumplen con las restricciones de validación de la tabla."

3. **Error de Clave Foránea**

   - Detecta: `foreign key`, `fk_`
   - Mensaje: "Los datos hacen referencia a un registro que no existe en otra tabla."

4. **Error de NOT NULL**

   - Detecta: `cannot insert the value null`, `null value`
   - Mensaje: "No se puede insertar un valor nulo en un campo requerido."

5. **Error de Tipo de Dato**

   - Detecta: `conversion failed`, `data type`
   - Mensaje: "El tipo de dato proporcionado no es compatible con el campo."

6. **Error de Longitud**

   - Detecta: `string or binary data would be truncated`
   - Mensaje: "Los datos proporcionados exceden la longitud máxima permitida para el campo."

7. **Error de Registro No Encontrado** (solo en actualizaciones)
   - Detecta: `0 rows affected`, `no rows affected`
   - Mensaje: "No se encontró el registro especificado para actualizar."

### 2. Servicio de Excel - Manejo Mejorado

#### Archivo: `backend/services/excelService.js`

Se ha mejorado el manejo de errores en la importación de Excel para que cada fila con error incluya:

- **error**: Mensaje específico del error
- **errorType**: Tipo de error para categorización
- **originalError**: Error original de SQL Server
- **row**: Número de fila en el Excel
- **data**: Datos de la fila que causó el error

### 3. Frontend - Visualización Mejorada

#### Archivo: `frontend/src/App.tsx`

Se ha mejorado la visualización de errores con:

- **Icono de advertencia** más visible
- **Título descriptivo** del error
- **Mensaje claro** y legible
- **Botón para cerrar** el mensaje de error
- **Diseño responsivo** y accesible

#### Archivo: `frontend/src/components/ExcelImportModal.tsx`

Se ha mejorado la visualización de errores en el modal de importación de Excel con:

- **Icono específico** para errores de importación
- **Título descriptivo** del error
- **Mensaje claro** y contextual

## Estructura de Respuesta de Error

```json
{
  "error": "Mensaje específico del error en español",
  "errorType": "tipo_de_error",
  "details": "Error original de SQL Server"
}
```

### Tipos de Error (errorType):

- `primary_key_violation`: Violación de clave primaria
- `check_constraint_violation`: Violación de constraint CHECK
- `foreign_key_violation`: Violación de clave foránea
- `null_violation`: Violación de NOT NULL
- `data_type_violation`: Violación de tipo de dato
- `length_violation`: Violación de longitud
- `record_not_found`: Registro no encontrado (solo actualizaciones)
- `general`: Error general no categorizado

## Script de Pruebas

#### Archivo: `backend/test_constraint_errors.js`

Se ha creado un script de pruebas que verifica:

1. ✅ Errores de constraint CHECK (TipoMaquina)
2. ✅ Errores de constraint CHECK (PesoMaquina)
3. ✅ Errores de NOT NULL
4. ✅ Errores de tipo de dato
5. ✅ Errores de longitud
6. ✅ Inserción exitosa para comparar

### Ejecutar Pruebas:

```bash
cd backend
node test_constraint_errors.js
```

## Beneficios de las Mejoras

### Para el Usuario:

- **Mensajes claros** en español que explican el problema
- **Información específica** sobre qué constraint se violó
- **Orientación** sobre cómo corregir el error
- **Experiencia mejorada** al trabajar con el sistema

### Para el Desarrollador:

- **Logs detallados** para debugging
- **Categorización de errores** para análisis
- **Consistencia** en el manejo de errores
- **Facilidad** para agregar nuevos tipos de error

## Ejemplos de Uso

### Error de Clave Primaria:

```
❌ Antes: "Failed to create record"
✅ Ahora: "Ya existe un registro con la misma clave primaria. Verifique que los valores de identificación sean únicos."
```

### Error de Constraint CHECK:

```
❌ Antes: "Failed to create record"
✅ Ahora: "Los datos no cumplen con las restricciones de validación de la tabla."
```

### Error de Tipo de Dato:

```
❌ Antes: "Failed to create record"
✅ Ahora: "El tipo de dato proporcionado no es compatible con el campo."
```

## Compatibilidad

- ✅ **SQL Server**: Optimizado para errores específicos de SQL Server
- ✅ **Frontend**: Compatible con React + TypeScript
- ✅ **Backend**: Compatible con Node.js + Express
- ✅ **Excel**: Mejor manejo de errores en importación masiva

## Próximas Mejoras Sugeridas

1. **Validación Preventiva**: Validar datos antes de enviar al servidor
2. **Sugerencias Automáticas**: Proponer correcciones basadas en el error
3. **Logs Detallados**: Guardar historial de errores para análisis
4. **Notificaciones**: Alertas en tiempo real para errores críticos
5. **Documentación**: Guía de errores comunes y soluciones
