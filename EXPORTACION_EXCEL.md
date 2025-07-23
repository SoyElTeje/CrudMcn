# 📊 Exportación a Excel

## Descripción

El sistema ahora incluye funcionalidad completa para exportar datos de tablas a archivos Excel (.xlsx). Los usuarios pueden exportar toda la tabla o solo los registros de la página actual que están viendo.

## Características

### ✅ Funcionalidades Implementadas

- **Exportación de toda la tabla**: Exporta todos los registros de la tabla seleccionada
- **Exportación de página actual**: Exporta solo los registros visibles en la página actual
- **Autenticación requerida**: Solo usuarios autenticados pueden exportar datos
- **Validación de permisos**: Se verifica que el usuario tenga permisos de lectura
- **Nombres de archivo únicos**: Los archivos se generan con timestamps para evitar conflictos
- **Limpieza automática**: Los archivos temporales se eliminan después de la descarga
- **Interfaz intuitiva**: Modal con opciones claras y descripción de lo que se exportará

### 🎯 Tipos de Exportación

#### 1. Toda la Tabla

- Exporta todos los registros de la tabla
- Útil para análisis completos o respaldos
- Puede tomar más tiempo en tablas grandes

#### 2. Página Actual

- Exporta solo los registros visibles en la página actual
- Útil para trabajar con subconjuntos específicos
- Más rápido y eficiente

## Arquitectura

### Backend

#### Servicio de Excel (`backend/services/excelService.js`)

```javascript
// Función para exportar datos de una tabla a Excel
async exportTableToExcel(databaseName, tableName, exportType = 'all', limit = null, offset = null)
```

**Parámetros:**

- `databaseName`: Nombre de la base de datos
- `tableName`: Nombre de la tabla
- `exportType`: Tipo de exportación ('all' o 'current_page')
- `limit`: Límite de registros (solo para página actual)
- `offset`: Desplazamiento (solo para página actual)

**Retorna:**

- `filePath`: Ruta del archivo generado
- `fileName`: Nombre del archivo
- `recordCount`: Número de registros exportados
- `exportType`: Tipo de exportación realizado
- `timestamp`: Timestamp de la exportación

#### Endpoint de API (`backend/server.js`)

```
GET /api/databases/:dbName/tables/:tableName/export-excel
```

**Parámetros de Query:**

- `exportType`: 'all' o 'current_page'
- `limit`: Número de registros (requerido para current_page)
- `offset`: Desplazamiento (requerido para current_page)

**Headers requeridos:**

- `Authorization: Bearer <token>`

**Respuesta:**

- Archivo Excel (.xlsx) para descarga
- Headers de descarga configurados automáticamente

### Frontend

#### Componente Modal (`frontend/src/components/ExcelExportModal.tsx`)

**Props:**

- `isOpen`: Estado de apertura del modal
- `onClose`: Función para cerrar el modal
- `databaseName`: Nombre de la base de datos
- `tableName`: Nombre de la tabla
- `currentPage`: Página actual
- `recordsPerPage`: Registros por página
- `totalRecords`: Total de registros en la tabla
- `token`: Token de autenticación

**Características:**

- Interfaz intuitiva con opciones de radio
- Descripción dinámica según el tipo seleccionado
- Indicador de progreso durante la exportación
- Manejo de errores con mensajes claros
- Descarga automática del archivo

#### Integración en App.tsx

- Botón "Exportar Excel" en la barra de herramientas
- Estado para controlar la apertura del modal
- Integración con el sistema de autenticación existente

## Uso

### 1. Acceso a la Funcionalidad

1. Seleccionar una base de datos y tabla
2. Hacer clic en el botón "Exportar Excel" (ícono púrpura)
3. Se abrirá el modal de exportación

### 2. Selección del Tipo de Exportación

#### Opción A: Toda la Tabla

- Seleccionar "Toda la tabla"
- Se exportarán todos los registros disponibles
- Útil para análisis completos

#### Opción B: Página Actual

- Seleccionar "Página actual"
- Se exportarán solo los registros visibles
- Útil para trabajar con subconjuntos

### 3. Confirmación y Descarga

1. Revisar la descripción de lo que se exportará
2. Hacer clic en "Exportar"
3. El archivo se descargará automáticamente
4. El modal se cerrará automáticamente

## Seguridad

### Autenticación

- Todas las exportaciones requieren autenticación
- Se verifica el token JWT en cada petición

### Autorización

- Se verifica que el usuario tenga permisos de lectura
- Se aplican las mismas reglas de permisos que para consultas

### Validación

- Se validan los parámetros de entrada
- Se verifica que la tabla existe
- Se manejan errores de base de datos

## Rendimiento

### Optimizaciones Implementadas

1. **Consultas eficientes**: Uso de OFFSET/FETCH para paginación
2. **Limpieza automática**: Archivos temporales se eliminan después de la descarga
3. **Streaming de respuesta**: El archivo se envía como stream para mejor rendimiento
4. **Nombres únicos**: Evita conflictos de archivos

### Consideraciones

- **Tablas grandes**: La exportación de toda la tabla puede tomar tiempo
- **Memoria**: Se procesan los datos en lotes para evitar problemas de memoria
- **Red**: Los archivos grandes pueden tardar en descargarse

## Manejo de Errores

### Errores Comunes

1. **Sin datos para exportar**

   - Mensaje: "No hay datos para exportar"
   - Solución: Verificar que la tabla contenga registros

2. **Parámetros inválidos**

   - Mensaje: "Para exportar la página actual, se requieren los parámetros 'limit' y 'offset'"
   - Solución: Proporcionar todos los parámetros requeridos

3. **Sin permisos**

   - Mensaje: "Error 401 - No autorizado"
   - Solución: Verificar permisos de usuario

4. **Error de base de datos**
   - Mensaje: "Error al exportar datos a Excel"
   - Solución: Verificar conectividad y permisos de base de datos

### Logging

- Todos los errores se registran en el servidor
- Se incluyen detalles para debugging
- Se mantiene trazabilidad de las operaciones

## Pruebas

### Script de Pruebas (`backend/test_export_excel.js`)

```bash
# Ejecutar pruebas de exportación
node backend/test_export_excel.js
```

**Pruebas incluidas:**

- Exportación de toda la tabla
- Exportación de página actual
- Validación de parámetros inválidos
- Verificación de autenticación

### Configuración de Pruebas

```bash
# Variables de entorno para pruebas
export TEST_DB=APPDATA
export TEST_TABLE=USERS_TABLE
```

## Archivos del Sistema

### Backend

- `backend/services/excelService.js` - Servicio de exportación
- `backend/server.js` - Endpoint de API
- `backend/test_export_excel.js` - Script de pruebas

### Frontend

- `frontend/src/components/ExcelExportModal.tsx` - Modal de exportación
- `frontend/src/App.tsx` - Integración principal

### Dependencias

- `xlsx` - Para generación de archivos Excel
- `axios` - Para comunicación HTTP
- `fs` - Para manejo de archivos

## Próximas Mejoras

### Funcionalidades Planificadas

- [ ] Exportación con filtros personalizados
- [ ] Selección de columnas específicas
- [ ] Múltiples formatos de exportación (CSV, JSON)
- [ ] Exportación programada
- [ ] Compresión de archivos grandes
- [ ] Plantillas de Excel personalizables

### Optimizaciones

- [ ] Exportación asíncrona para tablas grandes
- [ ] Progreso en tiempo real
- [ ] Cancelación de exportaciones
- [ ] Cache de consultas frecuentes

## Troubleshooting

### Problemas Comunes

1. **Archivo no se descarga**

   - Verificar permisos de escritura en carpeta uploads
   - Revisar logs del servidor
   - Verificar configuración de CORS

2. **Error de memoria**

   - Reducir el tamaño de lotes
   - Implementar streaming para tablas grandes
   - Optimizar consultas de base de datos

3. **Archivo corrupto**
   - Verificar que la tabla tenga datos válidos
   - Revisar codificación de caracteres
   - Verificar permisos de escritura

### Logs Útiles

```bash
# Ver logs del servidor
tail -f backend/logs/server.log

# Ver errores específicos de exportación
grep "export" backend/logs/server.log
```

## Conclusión

La funcionalidad de exportación a Excel proporciona una herramienta poderosa para extraer y analizar datos del sistema. Con las opciones de exportación completa y por página, los usuarios pueden adaptar la funcionalidad a sus necesidades específicas.

La implementación incluye todas las medidas de seguridad necesarias y está diseñada para ser escalable y mantenible.
