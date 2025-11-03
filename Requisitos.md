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

## Requisitos de Red

- **Puerto del backend**: 3001 (configurable vía `PORT`)
- **Puerto de SQL Server**: 1433 (TCP/IP debe estar habilitado)
- **Conectividad**: El contenedor debe poder alcanzar el servidor SQL Server

## Versiones Específicas Recomendadas

- **Node.js**: 20.x LTS (v20.11.0 o superior)
- **npm**: 10.x (viene con Node.js 20)
- **SQL Server**: 2012 o superior (2019+ recomendado para mejor rendimiento)
- **Docker**: 20.10+ (si se usa Docker)
