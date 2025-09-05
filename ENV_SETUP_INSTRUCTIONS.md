# 🔧 Instrucciones de Configuración de Entornos

## 📋 Configuración de Archivos .env

### **Paso 1: Usar el script automático (Recomendado)**

```bash
# Configurar ambos (backend y frontend) para desarrollo
node setup-env.js development

# Configurar solo backend para producción
node setup-env.js production backend

# Configurar solo frontend para staging
node setup-env.js staging frontend

# Configurar ambos para local
node setup-env.js local both
```

### **Paso 2: Configuración manual (Alternativa)**

#### **Backend:**

```bash
# Para desarrollo
cp backend/env.development backend/.env

# Para producción
cp backend/env.production backend/.env

# Para staging
cp backend/env.staging backend/.env

# Para desarrollo local
cp backend/env.local backend/.env
```

#### **Frontend:**

```bash
# Para desarrollo
cp frontend/env.development frontend/.env

# Para producción
cp frontend/env.production frontend/.env

# Para staging
cp frontend/env.staging frontend/.env

# Para desarrollo local
cp frontend/env.local frontend/.env
```

### **Paso 3: Configurar variables específicas**

#### **Para Producción:**

**Backend:**

1. **Base de datos**: Configurar credenciales reales de SQL Server
2. **CORS**: Cambiar `IP_SERVIDOR` por la IP real del servidor
3. **JWT_SECRET**: Generar un secret único y fuerte

**Frontend:**

1. **VITE_CURRENT_IP**: Configurar con la IP real del servidor
2. **VITE_API_BASE_URL**: Configurar con la IP real del servidor

#### **Para Staging:**

**Backend:**

1. **Base de datos**: Configurar servidor de staging
2. **CORS**: Configurar IPs de staging
3. **JWT_SECRET**: Usar secret diferente al de producción

**Frontend:**

1. **VITE_CURRENT_IP**: Configurar con la IP de staging
2. **VITE_API_BASE_URL**: Configurar con la IP de staging

### **Paso 4: Verificar configuración**

```bash
# Verificar archivos .env del backend
ls -la backend/.env

# Verificar archivos .env del frontend
ls -la frontend/.env

# Verificar variables del backend (sin mostrar valores sensibles)
grep -E "^[A-Z_]+=" backend/.env | cut -d'=' -f1

# Verificar variables del frontend (sin mostrar valores sensibles)
grep -E "^VITE_[A-Z_]+=" frontend/.env | cut -d'=' -f1
```

## 🔒 Seguridad

- **NUNCA** commitees archivos `.env` al repositorio
- **SIEMPRE** usa credenciales diferentes para cada entorno
- **GENERA** JWT secrets únicos y fuertes para producción
- **CONFIGURA** CORS específico para cada entorno

## 📁 Estructura de Archivos

```
├── backend/
│   ├── .env               # Archivo principal del backend (no commiteado)
│   ├── env.development    # Template para desarrollo
│   ├── env.production     # Template para producción
│   ├── env.staging        # Template para staging
│   └── env.local          # Template para desarrollo local
├── frontend/
│   ├── .env               # Archivo principal del frontend (no commiteado)
│   ├── env.development    # Template para desarrollo
│   ├── env.production     # Template para producción
│   ├── env.staging        # Template para staging
│   └── env.local          # Template para desarrollo local
├── setup-env.js           # Script de configuración automática
└── ENV_SETUP_INSTRUCTIONS.md  # Este archivo
```

## 🚀 Uso en la Aplicación

La aplicación cargará automáticamente las variables del archivo `.env` usando `dotenv`.

### **Backend:**

```javascript
require("dotenv").config();
// Las variables estarán disponibles en process.env
```

### **Frontend:**

```javascript
// Las variables VITE_* estarán disponibles en import.meta.env
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```
