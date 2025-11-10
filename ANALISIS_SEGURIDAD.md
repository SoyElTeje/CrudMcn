# Análisis de Seguridad y Arquitectura - ABM McN

## 📋 Resumen Ejecutivo

Esta aplicación es un sistema de gestión de bases de datos (ABM - Alta, Baja, Modificación) que permite administrar tablas de SQL Server a través de una interfaz web. El análisis revela una arquitectura bien estructurada con varias fortalezas, pero también identifica problemas críticos de seguridad que requieren atención inmediata.

---

## ✅ FORTALEZAS

### 1. Arquitectura y Organización
- **Separación de responsabilidades**: Código bien organizado en middleware, services, routes, utils
- **Modularidad**: Uso de servicios separados (authService, excelService, logService)
- **Manejo de errores**: Middleware de errorHandler implementado
- **Logging estructurado**: Uso de Winston para logging con diferentes niveles

### 2. Seguridad Implementada
- **Autenticación JWT**: Implementación correcta de tokens JWT
- **Hashing de contraseñas**: Uso de bcrypt con salt rounds (10)
- **Validación de entrada**: Uso de Joi para validación de esquemas
- **Sanitización**: Middleware de sanitización implementado
- **Permisos granulares**: Sistema de permisos por base de datos y tabla
- **Protección contra SQL Injection**: Uso de parámetros preparados en queries SQL
- **Rate Limiting**: Configuración disponible (aunque no se está usando en server.js)
- **Helmet**: Configuración disponible para headers de seguridad

### 3. Funcionalidades
- **CRUD completo**: Operaciones de creación, lectura, actualización y eliminación
- **Importación/Exportación Excel**: Funcionalidad completa con ExcelJS
- **Paginación**: Implementada correctamente
- **Filtros avanzados**: Sistema de filtrado flexible
- **Logs de auditoría**: Registro de operaciones CRUD
- **Gestión de usuarios**: Sistema completo de usuarios y permisos

### 4. Frontend
- **TypeScript**: Uso de TypeScript para type safety
- **React Hooks**: Uso moderno de React
- **Interceptores Axios**: Manejo automático de tokens y errores
- **UI moderna**: Uso de Tailwind CSS y componentes Radix UI

---

## ⚠️ PROBLEMAS CRÍTICOS DE SEGURIDAD

### 1. **JWT_SECRET con valor por defecto inseguro** 🔴 CRÍTICO

**Ubicación**: 
- `backend/middleware/auth.js:17`
- `backend/services/authService.js:69, 77`

**Problema**:
```javascript
process.env.JWT_SECRET || "your-secret-key"
```

**Riesgo**: Si `JWT_SECRET` no está configurado, se usa un valor por defecto conocido públicamente. Esto permite a un atacante:
- Generar tokens JWT válidos
- Suplantar identidad de cualquier usuario
- Escalar privilegios a administrador

**Impacto**: CRÍTICO - Compromiso total del sistema

**Solución**:
```javascript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === "your-secret-key") {
  throw new Error("JWT_SECRET debe estar configurado en variables de entorno");
}
```

### 2. **CORS configurado para permitir cualquier origen** 🔴 CRÍTICO

**Ubicación**: `backend/server.js:81-86`

**Problema**:
```javascript
cors({
  origin: "*", // Permitir cualquier origen para intranet
  credentials: false,
})
```

**Riesgo**: 
- Cualquier sitio web puede hacer peticiones a la API
- Vulnerable a ataques CSRF
- Permite acceso desde dominios maliciosos

**Impacto**: ALTO - Exposición de API a cualquier origen

**Solución**: Configurar orígenes específicos en producción:
```javascript
cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
  credentials: true,
})
```

### 3. **Contraseña de admin por defecto** 🔴 CRÍTICO

**Ubicación**: `backend/services/authService.js:951`

**Problema**:
```javascript
const hashedPassword = await bcrypt.hash("admin", 10);
```

**Riesgo**: 
- Usuario admin creado con contraseña "admin"
- Acceso no autorizado si no se cambia la contraseña
- Vulnerable a fuerza bruta

**Impacto**: CRÍTICO - Acceso administrativo comprometido

**Solución**: 
- Forzar cambio de contraseña en primer login
- Generar contraseña aleatoria y mostrarla solo una vez
- Requerir contraseña fuerte en creación

### 4. **Credenciales de base de datos en archivo de producción** 🟠 ALTO

**Ubicación**: `backend/env.production:9`

**Problema**:
```
DB_PASSWORD=Pd6EdwB%ta
```

**Riesgo**: 
- Contraseña expuesta en repositorio (si se commitea)
- Acceso directo a base de datos
- No se puede rotar fácilmente

**Impacto**: ALTO - Compromiso de base de datos

**Solución**: 
- Nunca commitear archivos `.env` o `env.production`
- Usar secretos gestionados (Azure Key Vault, AWS Secrets Manager)
- Rotar contraseñas regularmente

### 5. **Falta de rate limiting en endpoints críticos** 🟠 ALTO

**Ubicación**: `backend/server.js`

**Problema**: 
- `createRateLimiter` está definido en `config/security.js` pero NO se está usando
- Endpoints de login, creación de usuarios, etc. sin protección

**Riesgo**: 
- Ataques de fuerza bruta en login
- DoS por creación masiva de usuarios
- Abuso de API

**Impacto**: ALTO - Vulnerable a ataques de fuerza bruta y DoS

**Solución**: Aplicar rate limiting:
```javascript
const { createRateLimiter } = require("./config/security");

// Rate limiting para login
app.use("/api/auth/login", createRateLimiter(15 * 60 * 1000, 5)); // 5 intentos por 15 min

// Rate limiting general
app.use("/api", createRateLimiter(15 * 60 * 1000, 100)); // 100 requests por 15 min
```

### 6. **Helmet no está siendo usado** 🟠 ALTO

**Ubicación**: `backend/server.js`

**Problema**: 
- `helmetConfig` está definido en `config/security.js` pero NO se está aplicando
- Falta protección de headers de seguridad

**Riesgo**: 
- Vulnerable a XSS
- Falta protección Clickjacking
- Headers de seguridad no configurados

**Impacto**: MEDIO-ALTO - Vulnerabilidades de seguridad web

**Solución**: 
```javascript
const helmet = require("helmet");
const { helmetConfig } = require("./config/security");
app.use(helmet(helmetConfig));
```

### 7. **Sanitización demasiado agresiva** 🟡 MEDIO

**Ubicación**: `backend/middleware/sanitization.js:13-27`

**Problema**:
```javascript
.replace(/['"]/g, "") // Eliminar comillas
.replace(/;/g, "") // Eliminar punto y coma
```

**Riesgo**: 
- Puede corromper datos legítimos que contengan comillas o punto y coma
- Datos de usuarios pueden perderse o corromperse
- Problemas con nombres propios, direcciones, etc.

**Impacto**: MEDIO - Pérdida de integridad de datos

**Solución**: 
- Usar whitelist en lugar de blacklist
- Sanitizar solo donde sea necesario (nombres de tablas/columnas)
- No sanitizar datos de usuario, usar parámetros preparados

### 8. **Falta validación de nombres de tablas/columnas** 🟡 MEDIO

**Ubicación**: `backend/server.js` (endpoints de tablas)

**Problema**: 
- Nombres de tablas y columnas se usan directamente en queries
- Aunque se usan corchetes `[tableName]`, no hay validación estricta

**Riesgo**: 
- Posible SQL injection si se manipula el nombre de tabla
- Acceso a tablas no autorizadas

**Impacto**: MEDIO - Posible SQL injection

**Solución**: 
```javascript
function validateTableName(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("Nombre de tabla inválido");
  }
  return name;
}
```

### 9. **Tokens JWT almacenados en localStorage** 🟡 MEDIO

**Ubicación**: `frontend/src/App.tsx:262`

**Problema**:
```javascript
localStorage.setItem("token", newToken);
```

**Riesgo**: 
- Vulnerable a XSS (si hay vulnerabilidades XSS)
- Tokens accesibles desde JavaScript
- No se pueden invalidar fácilmente

**Impacto**: MEDIO - Robo de tokens si hay XSS

**Solución**: 
- Considerar httpOnly cookies (requiere cambios en backend)
- Implementar refresh tokens
- Rotar tokens regularmente

### 10. **Falta de validación de tamaño de archivos Excel** 🟡 MEDIO

**Ubicación**: `backend/middleware/upload.js` (si existe)

**Problema**: 
- No se limita el tamaño de archivos Excel
- Posible DoS por archivos grandes
- Consumo excesivo de memoria

**Impacto**: MEDIO - DoS por archivos grandes

**Solución**: 
```javascript
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
});
```

### 11. **Logs pueden contener información sensible** 🟡 MEDIO

**Ubicación**: `backend/services/logService.js`

**Problema**: 
- Los logs pueden registrar datos sensibles
- IPs, user agents, datos de registros

**Riesgo**: 
- Exposición de información sensible en logs
- Violación de privacidad (GDPR)

**Impacto**: MEDIO - Violación de privacidad

**Solución**: 
- Sanitizar logs antes de guardar
- No registrar datos completos de registros
- Implementar rotación y retención de logs

### 12. **Falta de HTTPS en producción** 🟡 MEDIO

**Problema**: 
- No hay configuración explícita de HTTPS
- Tokens y contraseñas viajan en texto plano sin HTTPS

**Riesgo**: 
- Man-in-the-middle attacks
- Interceptación de credenciales

**Impacto**: CRÍTICO si no hay HTTPS

**Solución**: 
- Configurar HTTPS en producción
- Usar reverse proxy (nginx) con SSL
- Forzar HTTPS con HSTS

---

## 🔧 PROBLEMAS MENORES / MEJORAS

### 1. **Falta de validación de tipos de archivo Excel**
- Validar extensión `.xlsx`, `.xls`
- Validar MIME type

### 2. **No hay timeout en queries SQL**
- Agregar timeout a queries largas
- Prevenir queries que bloqueen la base de datos

### 3. **Falta de índices en tablas de permisos**
- Optimizar queries de permisos
- Agregar índices en `user_permissions`

### 4. **No hay límite en paginación**
- Aunque hay paginación, no hay límite máximo
- Posible DoS con offset muy grande

### 5. **Falta de compresión de respuestas**
- Agregar compresión gzip
- Reducir ancho de banda

### 6. **No hay validación de versión de SQL Server**
- La aplicación requiere SQL Server 2012+
- No valida la versión al conectar

### 7. **Falta de health checks más detallados**
- Health check básico existe
- Agregar checks de base de datos, memoria, etc.

---

## 📊 PRIORIZACIÓN DE CORRECCIONES

### 🔴 CRÍTICO (Corregir inmediatamente)
1. **JWT_SECRET con valor por defecto** - Prioridad 1
2. **CORS permitiendo cualquier origen** - Prioridad 2
3. **Contraseña de admin por defecto** - Prioridad 3

### 🟠 ALTO (Corregir en esta semana)
4. **Credenciales en archivo de producción** - Prioridad 4
5. **Falta de rate limiting** - Prioridad 5
6. **Helmet no aplicado** - Prioridad 6

### 🟡 MEDIO (Corregir en este mes)
7. **Sanitización demasiado agresiva** - Prioridad 7
8. **Validación de nombres de tablas** - Prioridad 8
9. **Tokens en localStorage** - Prioridad 9
10. **Validación de tamaño de archivos** - Prioridad 10

---

## 🛡️ RECOMENDACIONES ADICIONALES

### Seguridad
1. **Implementar 2FA** para usuarios administradores
2. **Auditoría completa** de todas las operaciones
3. **Backup automático** de base de datos
4. **Monitoreo de seguridad** (intentos de login fallidos, etc.)
5. **Política de contraseñas** más estricta (complejidad, expiración)

### Performance
1. **Caché de permisos** para reducir queries a BD
2. **Caché de estructura de tablas**
3. **Connection pooling** optimizado (ya implementado, revisar configuración)
4. **Índices** en tablas de logs y permisos

### DevOps
1. **CI/CD** con tests de seguridad
2. **Docker** para despliegue consistente
3. **Monitoreo** con herramientas como Prometheus
4. **Alertas** automáticas de errores

---

## 📝 CONCLUSIÓN

La aplicación tiene una **base sólida** con buena arquitectura y muchas funcionalidades de seguridad implementadas. Sin embargo, hay **problemas críticos** que deben corregirse antes de usar en producción:

1. **JWT_SECRET** debe configurarse obligatoriamente
2. **CORS** debe restringirse a orígenes específicos
3. **Contraseña de admin** debe ser segura y única
4. **Rate limiting** debe aplicarse a endpoints críticos
5. **Helmet** debe activarse para headers de seguridad

Con estas correcciones, la aplicación estará lista para un entorno de producción con un nivel de seguridad adecuado.

---

**Fecha del análisis**: 2024
**Versión analizada**: Basada en código actual del repositorio
**Analista**: Revisión de seguridad automatizada

