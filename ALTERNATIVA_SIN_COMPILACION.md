# Alternativa: Usar bcryptjs (Sin Compilación Nativa)

Si quieres evitar instalar herramientas de compilación (`g++`, `make`, `python3`) en tu Dockerfile, puedes usar `bcryptjs` en lugar de `bcrypt`.

## ¿Qué es bcryptjs?

- **bcryptjs**: Implementación en JavaScript puro del algoritmo bcrypt
- **bcrypt**: Implementación nativa en C++ (más rápida, requiere compilación)

## Comparación

| Característica       | bcrypt   | bcryptjs      |
| -------------------- | -------- | ------------- |
| Requiere compilación | ✅ Sí    | ❌ No         |
| Velocidad            | Rápido   | ~3x más lento |
| API                  | Idéntica | Idéntica      |
| Tamaño del package   | Mayor    | Menor         |

**Nota**: Para operaciones de login/verificación de contraseñas, la diferencia de velocidad (~3x) normalmente **NO es un problema** porque estas operaciones ocurren muy pocas veces.

## Cómo Cambiar

### 1. Cambiar dependencia en `backend/package.json`:

```json
{
  "dependencies": {
    // Cambiar esto:
    // "bcrypt": "^6.0.0",

    // Por esto:
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    // Cambiar esto:
    // "@types/bcrypt": "^5.0.2",

    // Por esto:
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### 2. Actualizar imports en el código:

**Antes** (`backend/services/authService.js`):

```javascript
const bcrypt = require("bcrypt");
```

**Después**:

```javascript
const bcrypt = require("bcryptjs");
```

**IMPORTANTE**: La API es **idéntica**, no necesitas cambiar nada más del código.

### 3. Verificar otros archivos:

Buscar todos los archivos que usen `bcrypt`:

```bash
grep -r "require.*bcrypt" backend/
grep -r "import.*bcrypt" backend/
```

### 4. Reinstalar dependencias:

```bash
cd backend
npm uninstall bcrypt
npm install bcryptjs @types/bcryptjs
```

## Dockerfile Simplificado (Sin Compilación)

Con `bcryptjs`, tu Dockerfile puede ser mucho más simple:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# NO necesitas instalar python3, make, g++
# Solo copiar e instalar
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
COPY frontend/dist ./frontend/dist/

WORKDIR /app/backend
EXPOSE 3001

CMD ["node", "server.js"]
```

## Ventajas de usar bcryptjs

✅ Build más rápido (no hay compilación)  
✅ Imagen Docker más pequeña (no necesitas herramientas de compilación)  
✅ Build más simple y fácil de depurar  
✅ Compatible con todas las arquitecturas sin compilación

## Desventajas

❌ Hash/verificación ~3x más lento (pero aún muy rápido para uso normal)  
❌ Usa más CPU durante operaciones de hash

## Recomendación

- **Usa `bcryptjs`** si: Quieres builds más simples y rápidos, no tienes problemas de performance
- **Usa `bcrypt`** si: Necesitas máximo rendimiento o tienes mucha carga de autenticación

Para la mayoría de aplicaciones web, `bcryptjs` es suficiente y simplifica mucho el deployment.
