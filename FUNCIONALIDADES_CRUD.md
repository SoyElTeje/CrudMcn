# Funcionalidades CRUD - Visualizador de Base de Datos

## Nuevas Funcionalidades Agregadas

### 1. Edición de Registros

- **Botón de Editar**: Cada fila de la tabla ahora tiene un botón de editar (ícono de lápiz)
- **Modal de Edición**: Al hacer clic en editar, se abre un modal con todos los campos del registro
- **Formulario Dinámico**: Los campos se generan automáticamente basándose en la estructura de la tabla
- **Validación**: Los cambios se validan antes de enviarse al servidor
- **Actualización Automática**: Después de guardar, la tabla se actualiza automáticamente

### 2. Eliminación de Registros

- **Botón de Eliminar**: Cada fila tiene un botón de eliminar (ícono de papelera)
- **Confirmación**: Se muestra un diálogo de confirmación antes de eliminar
- **Actualización Automática**: La tabla se actualiza automáticamente después de eliminar

## Rutas del Backend Agregadas

### GET `/api/databases/:dbName/tables/:tableName/structure`

Obtiene la estructura de una tabla, incluyendo información de columnas y claves primarias.

**Respuesta:**

```json
{
  "tableName": "nombre_tabla",
  "columns": [
    {
      "COLUMN_NAME": "id",
      "DATA_TYPE": "int",
      "IS_NULLABLE": "NO",
      "COLUMN_DEFAULT": null,
      "CHARACTER_MAXIMUM_LENGTH": null
    }
  ],
  "primaryKeys": ["id"]
}
```

### PUT `/api/databases/:dbName/tables/:tableName/records`

Actualiza un registro en la tabla especificada usando claves primarias.

**Parámetros del body:**

```json
{
  "record": {
    "campo1": "nuevo_valor1",
    "campo2": "nuevo_valor2"
  },
  "primaryKeyValues": {
    "id": 1
  }
}
```

### DELETE `/api/databases/:dbName/tables/:tableName/records`

Elimina un registro de la tabla especificada usando claves primarias.

**Parámetros del body:**

```json
{
  "primaryKeyValues": {
    "id": 1
  }
}
```

## Componentes Agregados

### EditRecordModal

- Modal reutilizable para editar registros
- Formulario dinámico basado en la estructura de la tabla
- Estados de carga y manejo de errores
- Diseño responsive y accesible

## Características de Seguridad

1. **Validación de Datos**: Todos los datos se validan antes de enviarse al servidor
2. **Parámetros Preparados**: Las consultas SQL usan parámetros preparados para prevenir inyección SQL
3. **Manejo de Errores**: Errores detallados se muestran al usuario
4. **Confirmaciones**: Acciones destructivas requieren confirmación

## Uso

1. **Seleccionar Base de Datos**: Elige la base de datos desde el dropdown
2. **Seleccionar Tabla**: Elige la tabla que quieres visualizar
3. **Editar Registro**: Haz clic en el botón de editar (lápiz) en cualquier fila
4. **Modificar Datos**: Cambia los valores en el modal y haz clic en "Guardar Cambios"
5. **Eliminar Registro**: Haz clic en el botón de eliminar (papelera) y confirma la acción

## Notas Técnicas

- Las operaciones de edición y eliminación usan las claves primarias de la tabla para identificar registros únicos
- Se consulta automáticamente la estructura de la tabla para identificar claves primarias
- La tabla se recarga automáticamente después de cada operación CRUD
- El modal de edición es responsive y funciona bien en dispositivos móviles
- Los iconos usan SVG para mejor rendimiento y escalabilidad
- Los iconos de editar y eliminar son blancos para mejor visibilidad
- El texto de los inputs de edición es blanco para mejor contraste
