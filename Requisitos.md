# Requerimientos del Proyecto ABM McN

Este documento detalla todos los requerimientos necesarios para construir y ejecutar el proyecto en producción, especialmente para uso en Dockerfile.

## Requisitos del Sistema

### Node.js

- **Version node**: Node.js usado para el desarrollo: v20.19.5

### Base de Datos

- **SQL Server**: Versión 2012 o superior (requerido para `FORMAT()` y `TRY_CAST`)
- **Puerto**: 1433 (puerto estándar de SQL Server)
- **Protocolo**: TCP/IP habilitado
- **Características requeridas**:
  - `FORMAT()` function (SQL Server 2012+)
  - `TRY_CAST()` function (SQL Server 2012+)
  - `ROW_NUMBER()` window function
  - `INFORMATION_SCHEMA` views

### Sistema Operativo (para contenedor)

- **Linux**: Cualquier distribución moderna (Ubuntu 20.04+, Alpine 3.18+, Debian 11+)
- **Arquitectura**: x86_64 / AMD64

---

## Dependencias Backend

### Dependencias de Producción (`backend/package.json`)

```json
{
  "dependencies": {
    "@types/express": "^4.17.21",
    "axios": "^1.11.0",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.0",
    "exceljs": "^4.4.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^8.0.0",
    "joi": "^18.1.0",
    "jsonwebtoken": "^9.0.2",
    "mssql": "^11.0.1",
    "multer": "^2.0.2",
    "winston": "^3.17.0",
    "xlsx": "^0.18.5"
  }
}
```

**Descripción de dependencias críticas:**

- `express`: Framework web para Node.js
- `mssql`: Cliente para SQL Server (requiere compilación nativa de `tedious`)
- `bcrypt`: Hashing de contraseñas (requiere compilación nativa)
- `jsonwebtoken`: Autenticación JWT
- `exceljs` / `xlsx`: Manejo de archivos Excel
- `multer`: Middleware para subida de archivos
- `joi`: Validación de datos
- `winston`: Sistema de logging

**Nota importante sobre compilación nativa**:

- `bcrypt`: **SÍ requiere compilación nativa** (escrito en C++)
- `mssql` / `tedious`: **NO requiere compilación nativa** (JavaScript puro)

**Solo `bcrypt` necesita herramientas de compilación**:

- `python3` (2.7+ o 3.x)
- `make` o `build-essential`
- Herramientas de compilación C++ (`g++` o `clang++`)

**Alternativas para evitar compilación nativa**:

1. Usar `bcryptjs` en lugar de `bcrypt` (implementación en JavaScript puro, ~3x más lento pero compatible)
2. Usar binarios precompilados si la arquitectura coincide (npm intenta descargarlos automáticamente)
3. En Docker: instalar herramientas solo durante el build y eliminarlas después (multi-stage build)

### DevDependencies (no necesarias en producción)

- `nodemon`: Para desarrollo (auto-restart)
- `@types/*`: TypeScript definitions (solo para desarrollo)

---

## Dependencias Frontend

### Dependencias de Producción (`frontend/package.json`)

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.1.5",
    "axios": "^1.10.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.525.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.60.0",
    "react-router-dom": "^7.6.3",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^3.4.3",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.1",
    "@types/node": "^24.0.14",
    "@types/react": "^18.2.74",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.6.0",
    "autoprefixer": "^10.4.19",
    "cross-env": "^10.0.0",
    "eslint": "^9.30.1",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "postcss": "^8.4.38",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.35.1",
    "vite": "^5.2.10"
  }
}
```

**Herramientas de build requeridas:**

- `vite`: Bundler y servidor de desarrollo
- `typescript`: Compilador de TypeScript
- `postcss` + `autoprefixer`: Procesamiento de CSS (Tailwind)
- `tailwindcss`: Framework CSS

**Nota**: Las `devDependencies` solo son necesarias para construir el proyecto, no para ejecutarlo en producción.

---

## Variables de Entorno Requeridas

### Backend (`.env` o `env.production`)

**Obligatorias:**

```env
# Base de datos
DB_SERVER=<servidor-sql>
DB_PORT=1433
DB_USER=<usuario-sql>
DB_PASSWORD=<contraseña-sql>
DB_DATABASE=APPDATA

# Servidor
PORT=3001
NODE_ENV=production

# Seguridad
JWT_SECRET=<secret-key-seguro-y-largo>
JWT_EXPIRES_IN=24h
```

**Opcionales pero recomendadas:**

```env
# Base de datos
DB_ENCRYPT=false
DB_TRUST_CERT=true
DB_REQUEST_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=15000
DB_POOL_MAX=20
DB_POOL_MIN=5

# Logging
LOG_LEVEL=info
LOG_FILE=../logs/backend-production.log

# Uploads
UPLOAD_DIR=../uploads
MAX_FILE_SIZE=50MB

# Seguridad
HELMET_ENABLED=true
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### Frontend (`.env` o `env.production`)

**Obligatorias:**

```env
VITE_API_BASE_URL=http://<backend-url>:3001
```

---

## Estructura de Carpetas Requeridas

El proyecto requiere las siguientes carpetas (se crearán automáticamente si no existen):

```
backend/
  ├── logs/              # Logs de la aplicación
  ├── uploads/           # Archivos Excel subidos temporalmente
  └── ...

frontend/
  └── dist/              # Archivos compilados (generado por `npm run build`)
```

---

## Herramientas de Compilación (para Docker)

**IMPORTANTE**: Solo `bcrypt` requiere compilación nativa. `mssql` es JavaScript puro.

Para compilar `bcrypt`, se necesitan:

### En Ubuntu/Debian:

```bash
apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  build-essential
```

### En Alpine Linux:

```bash
apk add --no-cache \
  python3 \
  make \
  g++ \
  musl-dev
```

### En Fedora/RHEL:

```bash
dnf install -y \
  python3 \
  make \
  gcc-c++
```

---

## Comandos de Instalación

### Backend

```bash
cd backend
npm install --production
# O si usas pnpm:
pnpm install --production
```

### Frontend

```bash
cd frontend
npm install
npm run build
# El resultado estará en frontend/dist/
```

---

## Resumen para Dockerfile

### Imagen base recomendada:

- **Node.js**: `node:20-alpine` o `node:20-slim` (para tamaño optimizado)
- O `node:20` (para mejor compatibilidad con compilaciones nativas)

### Pasos esenciales:

1. Instalar herramientas de compilación **solo si usas `bcrypt`** (no necesario si usas `bcryptjs`)
2. Copiar `package.json` de backend y frontend
3. Ejecutar `npm install` en ambos
4. Copiar código fuente
5. Construir frontend (`npm run build`)
6. Instalar dependencias de producción del backend
7. **Limpiar herramientas de compilación** (multi-stage build recomendado para reducir tamaño)
8. Exponer puerto 3001
9. Ejecutar `node backend/server.js`

### Alternativa sin compilación nativa:

Si quieres evitar instalar herramientas de compilación, puedes usar `bcryptjs` en lugar de `bcrypt`:

- **Ventaja**: No requiere `g++`, `make`, `python3` (más rápido el build)
- **Desventaja**: ~3x más lento en operaciones de hash (normalmente no es problema para login)
- **Cambio necesario**: Reemplazar `require('bcrypt')` por `require('bcryptjs')` (API idéntica)

### Archivos esenciales a copiar:

- `backend/server.js`
- `backend/db.js`
- `backend/config/` (todos los archivos)
- `backend/middleware/` (todos los archivos)
- `backend/routes/` (todos los archivos)
- `backend/services/` (todos los archivos)
- `backend/utils/` (todos los archivos)
- `frontend/dist/` (después de `npm run build`)

### Archivos a excluir:

- `node_modules/` (se instalan en el contenedor)
- `coverage/`
- `__tests__/`
- `scripts-legacy/`
- Archivos `.env` con datos sensibles (usar variables de entorno del contenedor)
- `frontend/src/` (solo se necesita `dist/` en producción)
- `frontend/node_modules/` (solo necesario para build)

---

## Requisitos de Red

- **Puerto del backend**: 3001 (configurable vía `PORT`)
- **Puerto de SQL Server**: 1433 (TCP/IP debe estar habilitado)
- **Conectividad**: El contenedor debe poder alcanzar el servidor SQL Server

---

## Memoria y Recursos

### Mínimos recomendados:

- **RAM**: 512MB (mínimo), 1GB+ recomendado
- **CPU**: 1 core (mínimo), 2+ cores recomendado
- **Disco**: 500MB para la aplicación + espacio para logs y uploads

### Para desarrollo:

- **RAM**: 2GB+
- **CPU**: 2+ cores

---

## Versiones Específicas Recomendadas

- **Node.js**: 20.x LTS (v20.11.0 o superior)
- **npm**: 10.x (viene con Node.js 20)
- **SQL Server**: 2012 o superior (2019+ recomendado para mejor rendimiento)
- **Docker**: 20.10+ (si se usa Docker)

---

## Notas Adicionales

1. **Compilación nativa**: Solo `bcrypt` requiere compilación durante `npm install`. `mssql` es JavaScript puro y no requiere compilación. En Docker, esto puede tardar más la primera vez, pero puedes:

   - Usar multi-stage build para instalar herramientas solo durante build
   - Usar `bcryptjs` como alternativa (JavaScript puro, no requiere compilación)
   - Los binarios precompilados se descargan automáticamente si la arquitectura coincide

2. **Multi-stage build**: Recomendado para optimizar el tamaño de la imagen final:

   - Stage 1: Instalar herramientas de compilación y construir
   - Stage 2: Copiar solo archivos necesarios y dependencias de producción

3. **Variables de entorno**: Nunca commitees archivos `.env` con datos reales. Usa variables de entorno del contenedor o secrets management.

4. **Logs**: Asegúrate de que el directorio `logs/` tenga permisos de escritura.

5. **Uploads**: El directorio `uploads/` debe tener permisos de escritura y se limpia automáticamente después de procesar Excel.
