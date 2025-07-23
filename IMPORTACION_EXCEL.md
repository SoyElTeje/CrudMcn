# Funcionalidad de Importación de Excel

## Descripción

Esta funcionalidad permite importar datos desde archivos Excel (.xlsx, .xls) y CSV (.csv) directamente a las tablas de la base de datos. El sistema valida automáticamente que las columnas del archivo Excel coincidan con las columnas de la tabla destino.

## Características

### ✅ Validación Automática

- Verifica que los encabezados del Excel coincidan con las columnas de la tabla
- Identifica y omite columnas de identidad (auto-increment)
- Valida tipos de datos y restricciones de la tabla

### ✅ Vista Previa

- Muestra una vista previa de los datos antes de la importación
- Permite verificar que los datos sean correctos
- Muestra información de validación de columnas

### ✅ Manejo de Errores

- Procesa fila por fila para identificar errores específicos
- Continúa la importación aunque algunas filas fallen
- Proporciona reporte detallado de éxitos y errores

### ✅ Seguridad

- Requiere autenticación y permisos de escritura
- Limpia archivos temporales automáticamente
- Valida tipos de archivo y tamaño máximo (10MB)

## Cómo Usar

### 1. Preparar el Archivo Excel

El archivo Excel debe tener:

- **Primera fila**: Encabezados que coincidan exactamente con los nombres de las columnas de la tabla
- **Filas siguientes**: Datos a importar
- **Formato**: .xlsx, .xls, o .csv

**Ejemplo de estructura:**

```
| Nombre    | Edad | Email           | Telefono      |
|-----------|------|-----------------|---------------|
| Juan Pérez| 25   | juan@email.com  | 123-456-7890  |
| María García| 30  | maria@email.com | 098-765-4321  |
```

### 2. Importar en la Aplicación

1. **Iniciar sesión** en la aplicación
2. **Seleccionar** la base de datos y tabla destino
3. **Hacer clic** en el botón "Importar Excel" (azul)
4. **Seleccionar** el archivo Excel
5. **Hacer clic** en "Previsualizar" para ver los datos
6. **Revisar** la información de validación
7. **Hacer clic** en "Importar" para insertar los datos

### 3. Revisar Resultados

Después de la importación, el sistema mostrará:

- Número total de filas procesadas
- Número de registros insertados exitosamente
- Número de errores encontrados
- Detalles de errores específicos (si los hay)

## Consideraciones Importantes

### Columnas de Identidad

- Las columnas de identidad (auto-increment) se omiten automáticamente
- No es necesario incluirlas en el archivo Excel

### Tipos de Datos

- El sistema intenta convertir automáticamente los tipos de datos
- Los valores vacíos se insertan como NULL
- Las fechas deben estar en formato estándar

### Restricciones de la Base de Datos

- Se respetan las restricciones de la tabla (NOT NULL, UNIQUE, etc.)
- Los errores de restricción se reportan individualmente por fila

### Permisos

- Se requieren permisos de escritura en la tabla
- Los usuarios administradores tienen acceso completo

## Ejemplo de Uso

### Archivo Excel de Ejemplo

Se ha creado un archivo de ejemplo en `excelSubirPrueba/datos_ejemplo.xlsx` con:

- 4 columnas: Nombre, Edad, Email, Telefono
- 5 filas de datos de ejemplo

### Proceso de Importación

1. Seleccionar una tabla que tenga columnas similares
2. Usar el archivo de ejemplo para probar la funcionalidad
3. Verificar que los datos se importen correctamente

## Solución de Problemas

### Error: "Las siguientes columnas no existen en la tabla"

- Verificar que los nombres de las columnas coincidan exactamente
- Los nombres son sensibles a mayúsculas/minúsculas

### Error: "No se puede insertar en columnas de identidad"

- Remover las columnas de identidad del archivo Excel
- Estas columnas se llenan automáticamente por la base de datos

### Error: "El archivo Excel debe tener al menos una fila de encabezados y una fila de datos"

- Verificar que el archivo tenga datos válidos
- Asegurar que la primera fila contenga los encabezados

### Error: "Solo se permiten archivos Excel (.xlsx, .xls) y CSV (.csv)"

- Verificar el formato del archivo
- Convertir a formato compatible si es necesario

## Archivos del Sistema

### Backend

- `backend/middleware/upload.js` - Middleware para manejo de archivos
- `backend/services/excelService.js` - Servicio principal de importación
- `backend/server.js` - Rutas de API para importación

### Frontend

- `frontend/src/components/ExcelImportModal.tsx` - Modal de importación
- `frontend/src/App.tsx` - Integración con la aplicación principal

### Rutas de API

- `POST /api/databases/:dbName/tables/:tableName/preview-excel` - Vista previa
- `POST /api/databases/:dbName/tables/:tableName/import-excel` - Importación

## Dependencias

### Backend

- `xlsx` - Para leer archivos Excel
- `multer` - Para manejo de subida de archivos

### Frontend

- `axios` - Para comunicación con el backend
- Componentes UI existentes

## Seguridad y Rendimiento

### Seguridad

- Validación de tipos de archivo
- Límite de tamaño (10MB)
- Limpieza automática de archivos temporales
- Autenticación y autorización requeridas

### Rendimiento

- Procesamiento fila por fila para mejor control de errores
- Transacciones individuales para cada inserción
- Reporte detallado de progreso

## Próximas Mejoras

- [ ] Soporte para múltiples hojas de Excel
- [ ] Mapeo personalizado de columnas
- [ ] Importación en lotes más grandes
- [ ] Validación de datos más avanzada
- [ ] Plantillas de Excel predefinidas
- [ ] Exportación de errores a Excel
