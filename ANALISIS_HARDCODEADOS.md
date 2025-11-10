# Análisis de Valores Hardcodeados - ABM McN

## 📋 Resumen Ejecutivo

Este documento identifica todos los valores hardcodeados en la aplicación que deberían estar en variables de entorno o configuración. Los valores hardcodeados dificultan el despliegue en diferentes entornos y pueden causar problemas de seguridad.

---

## 🔴 CRÍTICO - IPs y URLs Hardcodeadas

### 1. **IP Hardcodeada en Frontend - Configuración de Producción** 🔴 CRÍTICO

**Ubicación**: `frontend/src/config/production.ts:3`

**Problema**:
```typescript
API_BASE_URL: process.env.VITE_API_BASE_URL || "http://192.168.168.209:3001",
```

**Riesgo**: 
- IP específica hardcodeada (`192.168.168.209`)
- No funcionará en otros entornos
- Dificulta despliegue en producción

**Solución**: Eliminar el valor por defecto o usar una variable de entorno obligatoria:
```typescript
API_BASE_URL: process.env.VITE_API_BASE_URL || (() => {
  throw new Error("VITE_API_BASE_URL debe estar configurado");
})(),
```

---

### 2. **IP Hardcodeada en package.json - Script de Desarrollo** 🔴 CRÍTICO

**Ubicación**: `frontend/package.json:7`

**Problema**:
```json
"dev": "cross-env VITE_CURRENT_IP=http://192.168.168.209:3001 vite",
```

**Riesgo**: 
- IP específica hardcodeada en script npm
- No funcionará en otros equipos o redes
- Dificulta desarrollo colaborativo

**Solución**: Usar variable de entorno:
```json
"dev": "vite",
```
Y configurar `VITE_API_BASE_URL` en `.env` local.

---

### 3. **IP Hardcodeada en env.production** 🟠 ALTO

**Ubicación**: `frontend/env.production:1-2`

**Problema**:
```
VITE_API_BASE_URL=http://192.168.168.209:3001
VITE_CURRENT_IP=http://192.168.168.209:3001
```

**Riesgo**: 
- IP específica en archivo de configuración
- Puede ser commiteada al repositorio
- No funcionará en otros entornos

**Solución**: 
- No commitear este archivo (agregar a `.gitignore`)
- Usar variables de entorno del sistema
- Documentar en `env.example`

---

## 🟠 ALTO - Puertos Hardcodeados

### 4. **Puerto Hardcodeado en Backend** 🟠 ALTO

**Ubicación**: `backend/server.js:58`

**Problema**:
```javascript
const PORT = process.env.PORT || 3001;
```

**Riesgo**: 
- Puerto por defecto hardcodeado
- Puede causar conflictos en diferentes entornos
- Dificulta despliegue en contenedores

**Solución**: Hacer el puerto obligatorio o usar un valor más seguro:
```javascript
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT debe estar configurado en variables de entorno");
}
```

---

### 5. **Puerto Hardcodeado en Vite (Desarrollo)** 🟠 ALTO

**Ubicación**: `frontend/vite.config.ts:15`

**Problema**:
```typescript
port: 5173,
strictPort: true,
```

**Riesgo**: 
- Puerto hardcodeado puede causar conflictos
- No permite flexibilidad en diferentes entornos

**Solución**: Usar variable de entorno:
```typescript
port: parseInt(process.env.VITE_PORT || "5173", 10),
strictPort: false, // Permitir usar otro puerto si 5173 está ocupado
```

---

### 6. **Puerto Hardcodeado en Vite (Producción)** 🟠 ALTO

**Ubicación**: `frontend/vite.config.production.ts:27,32`

**Problema**:
```typescript
port: 4173,
host: "0.0.0.0",
```

**Riesgo**: 
- Puerto hardcodeado para preview/producción
- Puede causar conflictos

**Solución**: Usar variable de entorno:
```typescript
port: parseInt(process.env.VITE_PREVIEW_PORT || "4173", 10),
```

---

### 7. **Puerto Hardcodeado en Docker Compose** 🟡 MEDIO

**Ubicación**: `docker-compose.yml:11`

**Problema**:
```yaml
ports:
  - "1433:1433"
```

**Riesgo**: 
- Puerto SQL Server hardcodeado
- Puede causar conflictos si ya está en uso

**Solución**: Usar variable de entorno:
```yaml
ports:
  - "${DB_PORT:-1433}:1433"
```

---

## 🟡 MEDIO - URLs y Hosts Hardcodeados

### 8. **URLs de localhost Hardcodeadas en Componentes** 🟡 MEDIO

**Ubicaciones**:
- `frontend/src/App.tsx:5`
- `frontend/src/components/LoginModal.tsx:5`
- `frontend/src/components/ExcelImportModal.tsx:6`
- `frontend/src/components/LogsViewer.tsx:8`
- `frontend/src/components/TrialTable.tsx:5`
- `frontend/src/components/UserManagement.tsx:4`
- `frontend/src/components/ActivatedTablesManager.tsx:6`

**Problema**:
```typescript
import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
```

**Riesgo**: 
- URL por defecto hardcodeada en múltiples lugares
- Dificulta mantenimiento
- Puede causar confusión en producción

**Solución**: Centralizar en un archivo de configuración:
```typescript
// frontend/src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL debe estar configurado");
}
```

---

### 9. **URLs de localhost en Logs del Backend** 🟡 MEDIO

**Ubicación**: `backend/server.js:1565-1566`

**Problema**:
```javascript
logger.info(`📊 Trial endpoint: http://localhost:${PORT}/api/trial/table`);
logger.info(`🔍 Health check: http://localhost:${PORT}/api/health`);
```

**Riesgo**: 
- URLs hardcodeadas en logs
- No reflejan la URL real en producción
- Puede confundir a los administradores

**Solución**: Usar variable de entorno para la URL base:
```javascript
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
logger.info(`📊 Trial endpoint: ${BASE_URL}/api/trial/table`);
logger.info(`🔍 Health check: ${BASE_URL}/api/health`);
```

---

### 10. **Host Hardcodeado en Backend** 🟡 MEDIO

**Ubicación**: `backend/server.js:1563`

**Problema**:
```javascript
app.listen(PORT, "0.0.0.0", () => {
```

**Riesgo**: 
- Host hardcodeado puede no ser apropiado para todos los entornos
- En algunos casos puede ser mejor usar `localhost` o una IP específica

**Solución**: Usar variable de entorno:
```javascript
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
```

---

### 11. **Host Hardcodeado en Vite** 🟡 MEDIO

**Ubicación**: 
- `frontend/vite.config.ts:14`
- `frontend/vite.config.production.ts:28,33`

**Problema**:
```typescript
host: "0.0.0.0",
```

**Riesgo**: 
- Host hardcodeado puede no ser necesario en todos los entornos
- En desarrollo local puede ser mejor usar `localhost`

**Solución**: Usar variable de entorno:
```typescript
host: process.env.VITE_HOST || "localhost",
```

---

## 🟡 MEDIO - Valores de Configuración Hardcodeados

### 12. **CORS Origin Hardcodeado** 🟡 MEDIO

**Ubicación**: `backend/config/security.js:26`

**Problema**:
```javascript
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
  "http://localhost:5173",
];
```

**Riesgo**: 
- Origen por defecto hardcodeado
- Puede no ser apropiado para producción
- Dificulta configuración en diferentes entornos

**Solución**: Hacer obligatorio o usar valor más seguro:
```javascript
const allowedOrigins = process.env.CORS_ORIGIN?.split(",");
if (!allowedOrigins || allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGIN debe estar configurado en variables de entorno");
}
```

---

### 13. **Puerto SQL Server Hardcodeado** 🟡 MEDIO

**Ubicación**: `backend/config/database.js:31`

**Problema**:
```javascript
port: parseInt(process.env.DB_PORT, 10) || 1433,
```

**Riesgo**: 
- Puerto por defecto hardcodeado
- Puede causar conflictos si se usa otro puerto

**Solución**: Hacer obligatorio o validar:
```javascript
const dbPort = process.env.DB_PORT;
if (!dbPort) {
  throw new Error("DB_PORT debe estar configurado");
}
port: parseInt(dbPort, 10),
```

---

### 14. **Contraseña Hardcodeada en Docker Compose** 🔴 CRÍTICO

**Ubicación**: `docker-compose.yml:9`

**Problema**:
```yaml
SA_PASSWORD: "simpleDev!"
```

**Riesgo**: 
- Contraseña hardcodeada en archivo de configuración
- Puede ser commiteada al repositorio
- Acceso no autorizado a base de datos

**Solución**: Usar variable de entorno:
```yaml
SA_PASSWORD: ${DB_SA_PASSWORD}
```
Y crear un archivo `.env` local (no commiteado) con:
```
DB_SA_PASSWORD=tu_contraseña_segura_aqui
```

---

## 🟢 BAJO - Valores de Configuración Menores

### 15. **Valores de Configuración Hardcodeados en production.ts** 🟢 BAJO

**Ubicación**: `frontend/src/config/production.ts`

**Problema**: Varios valores hardcodeados:
```typescript
REQUEST_TIMEOUT: 30000,
MAX_RETRIES: 3,
RETRY_DELAY: 1000,
DEFAULT_PAGE_SIZE: 50,
MAX_PAGE_SIZE: 500,
MAX_FILE_SIZE: 10 * 1024 * 1024,
TOKEN_REFRESH_INTERVAL: 5 * 60 * 1000,
```

**Riesgo**: 
- Valores no configurables
- Dificulta ajustes por entorno

**Solución**: Hacer configurables vía variables de entorno (opcional, no crítico).

---

## 📊 RESUMEN POR PRIORIDAD

### 🔴 CRÍTICO (Corregir inmediatamente)
1. **IP hardcodeada en `frontend/src/config/production.ts`**
2. **IP hardcodeada en `frontend/package.json`**
3. **Contraseña hardcodeada en `docker-compose.yml`**

### 🟠 ALTO (Corregir esta semana)
4. **Puerto hardcodeado en backend (`server.js`)**
5. **Puerto hardcodeado en Vite desarrollo (`vite.config.ts`)**
6. **Puerto hardcodeado en Vite producción (`vite.config.production.ts`)**
7. **IP hardcodeada en `frontend/env.production`**

### 🟡 MEDIO (Corregir este mes)
8. **URLs de localhost en componentes del frontend**
9. **URLs de localhost en logs del backend**
10. **Host hardcodeado en backend**
11. **Host hardcodeado en Vite**
12. **CORS origin hardcodeado**
13. **Puerto SQL Server hardcodeado**
14. **Puerto hardcodeado en Docker Compose**

### 🟢 BAJO (Opcional)
15. **Valores de configuración menores en `production.ts`**

---

## 🛠️ RECOMENDACIONES GENERALES

### 1. **Centralizar Configuración**
- Crear archivos de configuración centralizados
- Usar variables de entorno para todos los valores configurables
- Documentar todas las variables requeridas en `env.example`

### 2. **Validación de Variables de Entorno**
- Validar que todas las variables requeridas estén configuradas al iniciar
- Lanzar errores claros si faltan variables críticas
- Proporcionar valores por defecto solo para desarrollo local

### 3. **Separación de Entornos**
- Usar archivos `.env` diferentes para desarrollo, staging y producción
- No commitear archivos `.env` o `env.production` con valores reales
- Usar secretos gestionados en producción (Azure Key Vault, AWS Secrets Manager)

### 4. **Documentación**
- Documentar todas las variables de entorno requeridas
- Proporcionar ejemplos en `env.example`
- Incluir instrucciones de configuración en README

---

## 📝 CHECKLIST DE CORRECCIONES

- [ ] Eliminar IP hardcodeada de `frontend/src/config/production.ts`
- [ ] Eliminar IP hardcodeada de `frontend/package.json`
- [ ] Eliminar contraseña hardcodeada de `docker-compose.yml`
- [ ] Hacer puerto del backend obligatorio
- [ ] Hacer puertos de Vite configurables
- [ ] Centralizar URLs de API en un archivo de configuración
- [ ] Usar variables de entorno para hosts
- [ ] Hacer CORS origin obligatorio
- [ ] Hacer puerto SQL Server obligatorio
- [ ] Actualizar `env.example` con todas las variables requeridas
- [ ] Agregar validación de variables de entorno al iniciar
- [ ] Documentar configuración en README

---

**Fecha del análisis**: 2024
**Versión analizada**: Basada en código actual del repositorio

