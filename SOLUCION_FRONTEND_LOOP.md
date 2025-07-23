# Solución al Loop Infinito del Frontend

## Problema Identificado

El frontend estaba en un loop infinito de peticiones debido a:

1. **Endpoints duplicados** en el servidor backend
2. **Dependencia circular** en el `useEffect` del frontend
3. **Servidor backend no ejecutándose** correctamente

## Soluciones Implementadas

### 1. Eliminación de Endpoints Duplicados

Se eliminaron los endpoints duplicados en `server.js`:

- `/api/databases` (había 2 definiciones)
- `/api/databases/:dbName/tables` (había 2 definiciones)

### 2. Corrección del useEffect en Frontend

Se eliminó `tablesError` de las dependencias del `useEffect` que causaba el loop:

```typescript
// ANTES (causaba loop)
useEffect(() => {
  // ... código ...
}, [selectedDb, isAuthenticated, getAuthHeaders, logout, tablesError]);

// DESPUÉS (sin loop)
useEffect(() => {
  // ... código ...
}, [selectedDb, isAuthenticated, getAuthHeaders, logout]);
```

### 3. Scripts de Prueba

Se crearon scripts para verificar la conectividad:

- `testDbConnections.js` - Prueba conexión a base de datos
- `testServer.js` - Prueba conexión al servidor backend

## Pasos para Solucionar

### Paso 1: Verificar que el Backend esté Ejecutándose

```bash
cd backend
npm run test-server
```

Si el servidor no está ejecutándose, verás:

```
❌ Error conectando al servidor: connect ECONNREFUSED 127.0.0.1:3001
💡 El servidor backend no está ejecutándose en el puerto 3001
💡 Ejecuta: cd backend && npm start
```

### Paso 2: Iniciar el Backend

```bash
cd backend
npm start
```

Deberías ver:

```
🔧 Inicializando base de datos de la aplicación...
✅ Tabla Usuarios encontrada
ℹ️ Usuario administrador 'admin' ya existe
🎉 Base de datos de la aplicación inicializada correctamente
🔧 Inicializando sistema de permisos...
✅ Tabla PermisosBasesDatos creada/verificada
✅ Tabla PermisosTablas creada/verificada
✅ Índices creados/verificados
🎉 Sistema de permisos inicializado correctamente
🚀 Server running on port 3001
```

### Paso 3: Verificar la Base de Datos

```bash
cd backend
npm run test-db
```

### Paso 4: Iniciar el Frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

### Paso 5: Probar la Aplicación

1. Abre http://localhost:5173
2. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Selecciona una base de datos
4. Verifica que no haya errores en la consola

## Verificación de Funcionamiento

### Backend Funcionando Correctamente

```bash
curl http://localhost:3001/api/health
```

Respuesta esperada:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

### Frontend Sin Errores

En la consola del navegador no deberías ver:

- ❌ `ERR_CONNECTION_REFUSED`
- ❌ `ERR_INSUFFICIENT_RESOURCES`
- ❌ `Network Error`
- ❌ Loop infinito de peticiones

## Troubleshooting

### Si el Backend no Inicia

1. **Verificar archivo .env**:

   ```bash
   cd backend
   ls -la .env
   ```

2. **Verificar dependencias**:

   ```bash
   cd backend
   npm install
   ```

3. **Verificar puerto disponible**:
   ```bash
   netstat -an | grep 3001
   ```

### Si el Frontend sigue con Errores

1. **Limpiar caché del navegador**
2. **Reiniciar el servidor de desarrollo**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Verificar CORS**:
   Asegúrate de que `CORS_ORIGIN=http://localhost:5173` esté en el `.env`

### Si hay Problemas de Base de Datos

1. **Verificar conexión**:

   ```bash
   cd backend
   npm run test-db
   ```

2. **Ejecutar script SQL**:
   Ejecuta `setupTestDbs.sql` en SQL Server Management Studio

## Comandos Útiles

```bash
# Verificar estado del servidor
npm run test-server

# Verificar conexión a base de datos
npm run test-db

# Iniciar servidor en modo desarrollo
npm run dev

# Iniciar servidor en modo producción
npm start
```

## Notas Importantes

1. **Siempre ejecuta el backend antes que el frontend**
2. **Verifica que no haya otros procesos usando el puerto 3001**
3. **Asegúrate de que SQL Server esté ejecutándose**
4. **El archivo .env debe estar en la carpeta backend/**
