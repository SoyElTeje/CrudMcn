# ============================================
# Dockerfile Multi-Stage para ABM McN
# ============================================

# ============================================
# Stage 1: Construir el Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar archivos de dependencias del frontend
COPY frontend/package*.json ./

# Instalar dependencias del frontend
RUN npm ci --only=production=false

# Copiar código fuente del frontend
COPY frontend/ ./

# Construir el frontend para producción
# Nota: VITE_API_BASE_URL debe estar en el .env del frontend o pasarse como build arg
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ============================================
# Stage 2: Configurar el Backend
# ============================================
FROM node:20-alpine AS backend-setup

WORKDIR /app/backend

# Copiar archivos de dependencias del backend
COPY backend/package*.json ./

# Instalar dependencias del backend (incluyendo devDependencies para compilación nativa)
RUN npm ci --only=production=false

# ============================================
# Stage 3: Imagen Final de Producción
# ============================================
FROM node:20-alpine

# Instalar herramientas necesarias para bcrypt (compilación nativa)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar solo dependencias de producción del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production && npm cache clean --force

# Copiar código del backend
COPY backend/ ./backend/

# Copiar frontend construido desde el stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Crear directorio para uploads y logs
RUN mkdir -p /app/backend/uploads /app/logs

# Variables de entorno por defecto (se pueden sobrescribir)
ENV NODE_ENV=production
ENV PORT=3001

# Exponer el puerto del backend
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar la aplicación
WORKDIR /app/backend
CMD ["node", "server.js"]

