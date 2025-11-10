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

#### Opción A: Con SQL Server en Docker

```bash
# Construir la imagen de la aplicación
docker-compose -f docker-compose.production.yml build

# Iniciar todos los servicios
docker-compose -f docker-compose.production.yml --env-file .docker.env up -d

# Ver logs
docker-compose -f docker-compose.production.yml logs -f abmmcn-app
```

#### Opción B: Solo la Aplicación (SQL Server externo)

Si tu SQL Server está en otro servidor, solo ejecuta la aplicación:

```bash
# Construir
docker build -t abmmcn-app --build-arg VITE_API_BASE_URL=http://tu-servidor:3001 .

# Ejecutar
docker run -d \
  --name abmmcn-app \
  -p 3001:3001 \
  --env-file .docker.env \
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

### Si usas SQL Server externo

Si tu SQL Server está en otro servidor (no en Docker), configura:

```env
DB_SERVER=ip-o-hostname-del-servidor-sql
DB_PORT=1433
```

Y asegúrate de que el contenedor pueda alcanzar ese servidor (misma red, firewall abierto, etc.).

### Si usas SQL Server en Docker

El docker-compose ya configura una red interna. El backend se conectará a `sqlserver:1433`.

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

1. Verifica que SQL Server esté accesible:
   ```bash
   # Desde el contenedor
   docker exec -it abmmcn-app sh
   nc -zv DB_SERVER 1433
   ```

2. Verifica firewall y reglas de red

3. Si SQL Server está en Docker, verifica que esté en la misma red

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

