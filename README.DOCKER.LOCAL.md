# 🐳 Guía para Ejecutar ABM McN Localmente con Docker

Esta guía te permitirá ejecutar la aplicación ABM McN en otra computadora usando Docker, de forma rápida y sencilla.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
   - Descarga: https://www.docker.com/products/docker-desktop
   - Versión mínima: 20.10 o superior

2. **Docker Compose** (viene incluido con Docker Desktop)
   - Verificar versión: `docker-compose --version`

3. **Acceso a SQL Server**
   - Puede estar en la misma computadora
   - O en otra computadora/servidor en la red
   - SQL Server 2012 o superior

4. **Credenciales de la base de datos**
   - Servidor/IP del SQL Server
   - Usuario y contraseña
   - Nombre de la base de datos (normalmente `APPDATA`)

---

## 🚀 Pasos para Configurar y Ejecutar

### **PASO 1: Copiar los archivos del proyecto**

Copia toda la carpeta del proyecto a la nueva computadora. Asegúrate de incluir:
- `Dockerfile`
- `docker-compose.local.yml`
- `.docker.env.example`
- Carpetas `backend/` y `frontend/`
- Todos los demás archivos del proyecto

---

### **PASO 2: Crear el archivo de configuración**

1. **Copia el archivo de ejemplo:**
   ```bash
   # Windows (PowerShell)
   Copy-Item .docker.env.example .docker.env
   
   # Windows (CMD)
   copy .docker.env.example .docker.env
   
   # Mac/Linux
   cp .docker.env.example .docker.env
   ```

2. **Abre el archivo `.docker.env` con un editor de texto** (Notepad, VS Code, etc.)

---

### **PASO 3: Configurar las variables de entorno**

Edita el archivo `.docker.env` y configura los siguientes valores:

#### 🔑 **Variables OBLIGATORIAS:**

```env
# ============================================
# BASE DE DATOS (SQL Server)
# ============================================
DB_SERVER=TU_SERVIDOR_SQL
DB_PORT=1433
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=APPDATA
```

**⚠️ IMPORTANTE - Configuración de DB_SERVER:**

- **Si SQL Server está en la MISMA computadora:**
  - **Windows/Mac:** `DB_SERVER=host.docker.internal`
  - **Linux:** `DB_SERVER=192.168.1.100` (reemplaza con la IP de tu máquina)
  
- **Si SQL Server está en OTRA computadora/servidor:**
  - `DB_SERVER=192.168.1.50` (reemplaza con la IP del servidor SQL)
  - O `DB_SERVER=nombre-del-servidor` (si tienes resolución DNS)

```env
# ============================================
# JWT SECRET (OBLIGATORIO - Generar uno seguro)
# ============================================
JWT_SECRET=GENERAR_UN_SECRET_AQUI
```

**Para generar un JWT_SECRET seguro, ejecuta:**
```bash
# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Mac/Linux
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y pégalo en `JWT_SECRET=`.

```env
# ============================================
# URL DEL BACKEND (Para el frontend)
# ============================================
VITE_API_BASE_URL=http://localhost:3001
```

**⚠️ Si vas a acceder desde otra PC en la red, cambia por:**
```env
VITE_API_BASE_URL=http://TU_IP_LOCAL:3001
```
(Por ejemplo: `http://192.168.1.100:3001`)

#### 📝 **Variables OPCIONALES (tienen valores por defecto):**

```env
# Puerto de la aplicación (por defecto: 3001)
APP_PORT=3001
PORT=3001

# Entorno (por defecto: production)
NODE_ENV=production

# CORS (por defecto: permite todo *)
CORS_ORIGIN=*

# Expiración del token JWT (por defecto: 24h)
JWT_EXPIRES_IN=24h

# Nivel de logging (por defecto: info)
LOG_LEVEL=info
```

---

### **PASO 4: Verificar que los directorios necesarios existan**

Crea los directorios si no existen:

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path backend\uploads
New-Item -ItemType Directory -Force -Path logs

# Mac/Linux
mkdir -p backend/uploads
mkdir -p logs
```

---

### **PASO 5: Construir la imagen Docker**

Desde la carpeta raíz del proyecto, ejecuta:

```bash
docker-compose -f docker-compose.local.yml build
```

⏱️ **Esto puede tardar varios minutos la primera vez** (descarga dependencias, compila frontend, etc.)

---

### **PASO 6: Iniciar la aplicación**

```bash
docker-compose -f docker-compose.local.yml --env-file .docker.env up -d
```

El flag `-d` ejecuta el contenedor en segundo plano (detached mode).

---

### **PASO 7: Verificar que está funcionando**

1. **Ver los logs:**
   ```bash
   docker-compose -f docker-compose.local.yml logs -f
   ```

2. **Verificar el health check:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   
   O abre en el navegador: `http://localhost:3001/api/health`
   
   Deberías ver algo como:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-01T12:00:00.000Z",
     "environment": "production"
   }
   ```

3. **Abrir la aplicación en el navegador:**
   ```
   http://localhost:3001
   ```

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.local.yml logs -f
```

### Ver solo logs del contenedor
```bash
docker logs -f abmmcn-app
```

### Detener la aplicación
```bash
docker-compose -f docker-compose.local.yml down
```

### Reiniciar la aplicación
```bash
docker-compose -f docker-compose.local.yml restart
```

### Ver estado de los contenedores
```bash
docker-compose -f docker-compose.local.yml ps
```

### Reconstruir después de cambios en el código
```bash
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml --env-file .docker.env up -d
```

### Acceder al contenedor (para debugging)
```bash
docker exec -it abmmcn-app sh
```

---

## 🐛 Solución de Problemas

### ❌ Error: "No se puede conectar a SQL Server"

**Problema:** La aplicación no puede conectarse a la base de datos.

**Soluciones:**

1. **Verifica que SQL Server esté corriendo:**
   - Abre SQL Server Management Studio (SSMS)
   - Intenta conectarte con las mismas credenciales

2. **Verifica la configuración de DB_SERVER:**
   - Si está en la misma PC (Windows/Mac): debe ser `host.docker.internal`
   - Si está en Linux: debe ser la IP de tu máquina
   - Si está en otro servidor: debe ser la IP del servidor

3. **Verifica que el puerto 1433 esté accesible:**
   ```bash
   # Desde el contenedor (ejecutar dentro del contenedor)
   docker exec -it abmmcn-app sh
   # Dentro del contenedor:
   apk add --no-cache netcat-openbsd
   nc -zv TU_SERVIDOR_SQL 1433
   ```

4. **Verifica firewall:**
   - Asegúrate de que el firewall permita conexiones en el puerto 1433
   - Si SQL Server está en otra PC, verifica que acepte conexiones remotas

### ❌ Error: "JWT_SECRET debe estar configurado"

**Problema:** El JWT_SECRET no está configurado o es inválido.

**Solución:**
1. Abre `.docker.env`
2. Genera un secret seguro (ver PASO 3)
3. Pégarlo en `JWT_SECRET=`
4. Reinicia: `docker-compose -f docker-compose.local.yml restart`

### ❌ Error: "Cannot find module" o errores de compilación

**Problema:** Error al construir la imagen.

**Solución:**
```bash
# Limpiar y reconstruir
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml --env-file .docker.env up -d
```

### ❌ La aplicación no carga en el navegador

**Problema:** No puedes acceder a `http://localhost:3001`

**Soluciones:**

1. **Verifica que el contenedor esté corriendo:**
   ```bash
   docker ps
   ```
   Deberías ver `abmmcn-app` en la lista.

2. **Verifica los logs:**
   ```bash
   docker logs abmmcn-app
   ```

3. **Verifica que el puerto no esté en uso:**
   - Cambia `APP_PORT` en `.docker.env` a otro puerto (ej: 3002)
   - Reconstruye y reinicia

### ❌ El frontend no se conecta al backend

**Problema:** El frontend no puede hacer peticiones al backend.

**Solución:**
1. Verifica que `VITE_API_BASE_URL` en `.docker.env` sea correcto
2. Si cambiaste `VITE_API_BASE_URL`, **debes reconstruir la imagen:**
   ```bash
   docker-compose -f docker-compose.local.yml build --no-cache
   docker-compose -f docker-compose.local.yml --env-file .docker.env up -d
   ```

---

## 📝 Ejemplo Completo de `.docker.env`

```env
# ============================================
# Base de Datos (SQL Server en la misma PC - Windows/Mac)
# ============================================
DB_SERVER=host.docker.internal
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=MiContraseña123!
DB_DATABASE=APPDATA

# ============================================
# Aplicación
# ============================================
APP_PORT=3001
PORT=3001
NODE_ENV=production

# ============================================
# Frontend
# ============================================
VITE_API_BASE_URL=http://localhost:3001

# ============================================
# CORS
# ============================================
CORS_ORIGIN=*

# ============================================
# JWT (GENERAR UN SECRET SEGURO)
# ============================================
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6

# ============================================
# Logging
# ============================================
LOG_LEVEL=info
```

---

## ✅ Checklist Final

Antes de considerar que todo está listo, verifica:

- [ ] Docker y Docker Compose instalados
- [ ] Archivo `.docker.env` creado y configurado
- [ ] `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` configurados
- [ ] `JWT_SECRET` generado y configurado (mínimo 64 caracteres)
- [ ] `VITE_API_BASE_URL` configurado correctamente
- [ ] Directorios `backend/uploads` y `logs` creados
- [ ] SQL Server accesible desde el contenedor
- [ ] Imagen construida sin errores
- [ ] Contenedor corriendo (`docker ps`)
- [ ] Health check respondiendo (`/api/health`)
- [ ] Aplicación accesible en el navegador (`http://localhost:3001`)

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. Revisa los logs: `docker logs abmmcn-app`
2. Verifica la configuración en `.docker.env`
3. Asegúrate de que SQL Server esté accesible
4. Revisa esta guía de solución de problemas

---

## 🎉 ¡Listo!

Si todo está funcionando, deberías poder:
- Acceder a la aplicación en `http://localhost:3001`
- Hacer login con el usuario admin
- Ver y gestionar tus tablas de SQL Server

**Credenciales por defecto del admin:**
- Usuario: `admin`
- Contraseña: `admin` ⚠️ **Cambiar inmediatamente después del primer login**

