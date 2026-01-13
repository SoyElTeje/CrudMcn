# 🚀 Instrucciones Rápidas - Ejecutar ABM McN en Otra Computadora

## ✅ Lo que Necesitas

1. **Docker Desktop** instalado (https://www.docker.com/products/docker-desktop)
2. **SQL Server** accesible (puede estar en la misma PC o en otra)
3. **Credenciales** de la base de datos
4. **Los archivos** del proyecto

---

## 📝 Pasos Rápidos (5 minutos)

### 1️⃣ **Copiar el proyecto**
Copia toda la carpeta del proyecto a la nueva computadora.

### 2️⃣ **Crear archivo de configuración**
```bash
# Windows
copy .docker.env.example .docker.env

# Mac/Linux
cp .docker.env.example .docker.env
```

### 3️⃣ **Editar `.docker.env`**
Abre `.docker.env` con un editor de texto y configura:

**OBLIGATORIO - Base de Datos:**
```env
DB_SERVER=host.docker.internal    # Si SQL está en la misma PC (Windows/Mac)
# O
DB_SERVER=192.168.1.50            # Si SQL está en otra PC (usar IP del servidor)

DB_PORT=1433
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=APPDATA
```

**OBLIGATORIO - JWT Secret:**
```bash
# Generar un secret (ejecutar en terminal):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copia el resultado y pégalo en:
```env
JWT_SECRET=pegar_aquí_el_secret_generado
```

**OBLIGATORIO - URL del Backend:**
```env
VITE_API_BASE_URL=http://localhost:3001
```
(Si vas a acceder desde otra PC en la red, cambia por: `http://TU_IP:3001`)

### 4️⃣ **Crear directorios necesarios**
```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path backend\uploads, logs

# Mac/Linux
mkdir -p backend/uploads logs
```

### 5️⃣ **Construir e iniciar**
```bash
# Construir (primera vez, tarda unos minutos)
docker-compose -f docker-compose.local.yml build

# Iniciar
docker-compose -f docker-compose.local.yml --env-file .docker.env up -d
```

### 6️⃣ **Verificar**
- Abre en el navegador: `http://localhost:3001`
- Deberías ver la pantalla de login
- Usuario admin por defecto: `admin` / Contraseña: `admin`

---

## 🔧 Comandos Útiles

```bash
# Ver logs
docker-compose -f docker-compose.local.yml logs -f

# Detener
docker-compose -f docker-compose.local.yml down

# Reiniciar
docker-compose -f docker-compose.local.yml restart

# Ver estado
docker-compose -f docker-compose.local.yml ps
```

---

## ❌ Problemas Comunes

**No se conecta a SQL Server:**
- Verifica que `DB_SERVER` sea correcto:
  - Misma PC (Windows/Mac): `host.docker.internal`
  - Misma PC (Linux): IP de tu máquina (ej: `192.168.1.100`)
  - Otra PC: IP del servidor SQL

**Error de JWT_SECRET:**
- Asegúrate de haber generado y configurado el JWT_SECRET

**La app no carga:**
- Verifica logs: `docker logs abmmcn-app`
- Verifica que el puerto 3001 no esté en uso

---

## 📖 Documentación Completa

Para más detalles, consulta: **README.DOCKER.LOCAL.md**

