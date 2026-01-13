# 🐳 Guía de Docker para ABM McN

Esta guía explica cómo hostear la aplicación ABM McN en contenedores Docker.

## 📋 Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)
- Acceso a un servidor SQL Server (puede ser en Docker o externo)

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus valores:

```bash
cp .docker.env.example .docker.env
```

Edita `.docker.env` con tus valores reales:
- **OBLIGATORIO**: `JWT_SECRET` - Genera uno seguro:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **OBLIGATORIO**: `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- **OBLIGATORIO**: `VITE_API_BASE_URL` - URL donde estará disponible el backend

### 2. Construir y Ejecutar

**NOTA**: Este docker-compose asume que la base de datos SQL Server ya existe en producción. Solo ejecuta la aplicación.

```bash
# Construir la imagen de la aplicación
docker-compose -f docker-compose.production.yml build

# Iniciar la aplicación
docker-compose -f docker-compose.production.yml --env-file .docker.env up -d

# Ver logs
docker-compose -f docker-compose.production.yml logs -f abmmcn-app
```

#### Alternativa: Usando Docker directamente

Si prefieres usar Docker directamente sin docker-compose:

```bash
# Construir
docker build -t abmmcn-app --build-arg VITE_API_BASE_URL=http://tu-servidor:3001 .

# Ejecutar
docker run -d \
  --name abmmcn-app \
  -p 3001:3001 \
  --env-file .docker.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  abmmcn-app
```

## 📝 Configuración Detallada

### Variables de Entorno Importantes

#### `VITE_API_BASE_URL` (Crítico)

Esta variable se usa durante el **build** del frontend. Debe ser la URL donde los usuarios accederán al backend.

**Ejemplos:**
- Desarrollo local: `http://localhost:3001`
- Red local: `http://192.168.1.100:3001`
- Producción con dominio: `https://api.tudominio.com`
- Producción con IP: `http://203.0.113.10:3001`

**⚠️ IMPORTANTE**: Si cambias esta URL después del build, necesitas reconstruir la imagen.

### Estructura de Volúmenes

El docker-compose monta estos volúmenes:
- `./backend/uploads` → Archivos subidos por usuarios
- `./logs` → Logs de la aplicación

Asegúrate de que estos directorios existan y tengan permisos correctos.

## 🔧 Comandos Útiles

### Ver logs
```bash
docker-compose -f docker-compose.production.yml logs -f abmmcn-app
```

### Reiniciar la aplicación
```bash
docker-compose -f docker-compose.production.yml restart abmmcn-app
```

### Detener todo
```bash
docker-compose -f docker-compose.production.yml down
```

### Reconstruir después de cambios
```bash
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Acceder al contenedor
```bash
docker exec -it abmmcn-app sh
```

## 🌐 Configuración de Red

### Conexión a SQL Server existente

La aplicación se conecta a un SQL Server existente en producción. Configura:

```env
DB_SERVER=ip-o-hostname-del-servidor-sql
DB_PORT=1433
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_DATABASE=APPDATA
```

**⚠️ IMPORTANTE - Configuración de DB_SERVER para Docker:**

Si la base de datos está en el **HOST** (fuera del contenedor):
- **Windows/Mac**: Usa `host.docker.internal`
  ```env
  DB_SERVER=host.docker.internal
  ```
- **Linux**: Usa la IP del host o configura una red de Docker
  ```env
  DB_SERVER=192.168.1.100  # IP de tu host
  ```
  O configura una red de Docker personalizada.

Si la base de datos está en **otro servidor**:
- Usa la IP o dominio del servidor:
  ```env
  DB_SERVER=192.168.1.50  # IP del servidor SQL
  # o
  DB_SERVER=sql-server.tudominio.com  # Dominio del servidor SQL
  ```

**Importante**: Asegúrate de que:
- El contenedor pueda alcanzar el servidor SQL Server (misma red, firewall abierto, etc.)
- El puerto 1433 esté accesible desde el contenedor
- Las credenciales sean correctas
- La base de datos `APPDATA` exista en el servidor
- SQL Server permita conexiones remotas (si está en otro servidor)

## 🔒 Seguridad

### Variables Sensibles

**NUNCA** commitees archivos `.docker.env` o `.env` con valores reales.

Usa:
- Secretos de Docker Swarm
- Variables de entorno del sistema
- Servicios de secretos (Azure Key Vault, AWS Secrets Manager)

### JWT_SECRET

**OBLIGATORIO** generar un secret único y seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ IMPORTANTE - Caracteres especiales en JWT_SECRET:**

Si tu `JWT_SECRET` contiene el carácter `$`, necesitas escaparlo con `$$` en el archivo `.docker.env`:

```env
# Si tu JWT_SECRET contiene $VAR, escríbelo como $$VAR
JWT_SECRET='tu-secret-con-$$VAR-aqui'
```

Esto es porque Docker Compose interpreta `$` como el inicio de una variable de entorno. Al usar `$$`, Docker Compose lo convertirá en un `$` literal cuando lo pase al contenedor.

### Contraseñas de Base de Datos

Usa contraseñas fuertes y únicas. No uses valores por defecto en producción.

## 🐛 Troubleshooting

### La aplicación no inicia

1. Verifica los logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs abmmcn-app
   ```

2. Verifica que todas las variables obligatorias estén configuradas:
   - `JWT_SECRET`
   - `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
   - `VITE_API_BASE_URL`

### No se puede conectar a SQL Server

**Error común**: `Failed to connect to localhost:1433`

Este error ocurre cuando `DB_SERVER=localhost` en Docker. En Docker, `localhost` se refiere al contenedor mismo, no al host.

**Solución**:
1. Si la base de datos está en el **HOST** (Windows/Mac):
   ```env
   DB_SERVER=host.docker.internal
   ```
2. Si la base de datos está en el **HOST** (Linux):
   ```env
   DB_SERVER=192.168.1.100  # IP de tu host
   ```
3. Si la base de datos está en **otro servidor**:
   ```env
   DB_SERVER=ip-o-dominio-del-servidor-sql
   ```

**Verificación**:
1. Verifica que SQL Server esté accesible desde el contenedor:
   ```bash
   # Desde el contenedor
   docker exec -it abmmcn-app sh
   # Instalar netcat si no está disponible
   apk add --no-cache netcat-openbsd
   # Probar conexión
   nc -zv ${DB_SERVER} ${DB_PORT:-1433}
   ```

2. Verifica firewall y reglas de red:
   - El puerto 1433 debe estar abierto en el servidor SQL Server
   - El firewall debe permitir conexiones desde la IP del contenedor

3. Verifica las credenciales en `.docker.env`:
   - `DB_SERVER`: IP o hostname del servidor SQL Server
   - `DB_USER`: Usuario con permisos en la base de datos
   - `DB_PASSWORD`: Contraseña correcta
   - `DB_DATABASE`: Nombre de la base de datos (debe existir)

### El frontend no carga

1. Verifica que `VITE_API_BASE_URL` esté correctamente configurado
2. Verifica que el puerto esté expuesto: `docker ps` debe mostrar `0.0.0.0:3001->3001/tcp`
3. Verifica CORS: `CORS_ORIGIN` debe incluir el origen desde donde accedes

### Health check falla

El health check verifica `/api/health`. Si falla:
1. Verifica que la aplicación esté corriendo
2. Verifica logs para errores
3. Verifica que el puerto 3001 esté accesible

## 📊 Monitoreo

### Ver estado de contenedores
```bash
docker-compose -f docker-compose.production.yml ps
```

### Ver uso de recursos
```bash
docker stats abmmcn-app
```

### Health check
```bash
curl http://localhost:3001/api/health
```

## 🔄 Actualización

Para actualizar la aplicación:

```bash
# 1. Detener
docker-compose -f docker-compose.production.yml down

# 2. Obtener código actualizado
git pull

# 3. Reconstruir
docker-compose -f docker-compose.production.yml build --no-cache

# 4. Iniciar
docker-compose -f docker-compose.production.yml --env-file .docker.env up -d
```

## 📚 Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

