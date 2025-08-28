# Guía de Despliegue en Producción - Windows Server

## Requisitos Previos

### 1. Software Necesario en el Servidor

- **Node.js** (versión 18.x o superior)
- **SQL Server** (2019 o superior)
- **Git** (para clonar el repositorio)
- **PM2** (para gestionar procesos Node.js)
- **IIS** (opcional, para proxy reverso)
- **Certificados SSL** (para HTTPS)

### 2. Cuentas y Permisos

- Usuario administrador en Windows Server
- Usuario de SQL Server con permisos de administrador
- Acceso al repositorio de código (si es privado)

## Paso 1: Preparación del Servidor

### 1.1 Instalar Node.js

```powershell
# Descargar Node.js desde https://nodejs.org/
# Instalar la versión LTS (18.x o superior)
# Verificar instalación
node --version
npm --version
```

### 1.2 Instalar PM2 Globalmente

```powershell
npm install -g pm2
```

### 1.3 Instalar Git

```powershell
# Descargar Git desde https://git-scm.com/
# O usar Chocolatey si está disponible
choco install git
```

### 1.4 Configurar SQL Server

```sql
-- Crear base de datos APPDATA si no existe
CREATE DATABASE APPDATA;
GO

-- Crear usuario de aplicación
CREATE LOGIN appuser WITH PASSWORD = 'TuContraseñaSegura123!';
GO

USE APPDATA;
GO

-- Dar permisos al usuario
CREATE USER appuser FOR LOGIN appuser;
EXEC sp_addrolemember 'db_owner', 'appuser';
GO
```

## Paso 2: Clonar y Configurar la Aplicación

### 2.1 Crear Directorio de Aplicación

```powershell
# Crear directorio para la aplicación
mkdir C:\apps\AbmMcn
cd C:\apps\AbmMcn
```

### 2.2 Clonar el Repositorio

```powershell
# Si es repositorio público
git clone https://github.com/tu-usuario/AbmMcn.git .

# Si es repositorio privado, configurar credenciales primero
git clone https://github.com/tu-usuario/AbmMcn.git .
```

### 2.3 Configurar Variables de Entorno

```powershell
# Crear archivo .env en el directorio backend
cd backend
copy env.example .env
```

Editar el archivo `backend\.env`:

```env
# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_USER=appuser
DB_PASSWORD=TuContraseñaSegura123!
DB_DATABASE=APPDATA

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://tu-dominio.com

# JWT Configuration
JWT_SECRET=tu-super-secret-jwt-key-muy-seguro-y-unico-para-produccion
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info
```

### 2.4 Instalar Dependencias

```powershell
# Instalar dependencias del backend
cd backend
npm install --production

# Instalar dependencias del frontend
cd ..\frontend
npm install --production
```

## Paso 3: Configurar el Frontend para Producción

### 3.1 Actualizar Configuración del Frontend

Editar `frontend\src\App.tsx` para cambiar la URL del backend:

```typescript
// Cambiar de:
const api = axios.create({
  baseURL: "http://localhost:3001",
});

// A:
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://tu-dominio.com/api"
      : "http://localhost:3001",
});
```

### 3.2 Construir el Frontend

```powershell
cd frontend
npm run build
```

## Paso 4: Configurar PM2 para el Backend

### 4.1 Crear Archivo de Configuración PM2

Crear `ecosystem.config.js` en el directorio raíz:

```javascript
module.exports = {
  apps: [
    {
      name: "abmmcn-backend",
      script: "./backend/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

### 4.2 Crear Directorio de Logs

```powershell
mkdir logs
```

### 4.3 Iniciar la Aplicación con PM2

```powershell
cd C:\apps\AbmMcn
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Paso 5: Configurar IIS como Proxy Reverso (Opcional)

### 5.1 Instalar URL Rewrite Module

- Descargar e instalar URL Rewrite Module para IIS

### 5.2 Crear Sitio Web en IIS

1. Abrir IIS Manager
2. Crear nuevo sitio web
3. Configurar binding para HTTPS
4. Configurar certificado SSL

### 5.3 Configurar web.config

Crear `web.config` en el directorio del sitio:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

## Paso 6: Configurar Firewall

### 6.1 Abrir Puertos Necesarios

```powershell
# Abrir puerto 3001 para el backend (si no usa IIS)
New-NetFirewallRule -DisplayName "AbmMcn Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Abrir puerto 80 para HTTP
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Abrir puerto 443 para HTTPS
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## Paso 7: Configurar SSL/TLS

### 7.1 Obtener Certificado SSL

- Usar Let's Encrypt (gratuito)
- O comprar certificado comercial
- Instalar en IIS o configurar con Node.js

### 7.2 Configurar HTTPS en Node.js (Alternativa a IIS)

```javascript
// En server.js, agregar soporte para HTTPS
const https = require("https");
const fs = require("fs");

const httpsOptions = {
  key: fs.readFileSync("path/to/private-key.pem"),
  cert: fs.readFileSync("path/to/certificate.pem"),
};

https.createServer(httpsOptions, app).listen(443, () => {
  console.log("HTTPS Server running on port 443");
});
```

## Paso 8: Configurar Monitoreo y Logs

### 8.1 Configurar PM2 Monitoring

```powershell
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs abmmcn-backend

# Monitorear recursos
pm2 monit
```

### 8.2 Configurar Logs de Windows

```powershell
# Crear tarea programada para rotar logs
schtasks /create /tn "RotateLogs" /tr "pm2 reload abmmcn-backend" /sc daily /st 02:00
```

## Paso 9: Configurar Backup

### 9.1 Backup de Base de Datos

```sql
-- Crear tarea programada para backup
BACKUP DATABASE APPDATA
TO DISK = 'C:\backups\APPDATA_' + CONVERT(VARCHAR(8), GETDATE(), 112) + '.bak'
WITH COMPRESSION;
```

### 9.2 Backup de Código

```powershell
# Crear script de backup
$backupPath = "C:\backups\code\"
$date = Get-Date -Format "yyyyMMdd"
Compress-Archive -Path "C:\apps\AbmMcn" -DestinationPath "$backupPath\AbmMcn_$date.zip"
```

## Paso 10: Configurar Actualizaciones

### 10.1 Script de Actualización

Crear `update.ps1`:

```powershell
# Detener aplicación
pm2 stop abmmcn-backend

# Hacer backup
$date = Get-Date -Format "yyyyMMdd"
Compress-Archive -Path "C:\apps\AbmMcn" -DestinationPath "C:\backups\AbmMcn_$date.zip"

# Actualizar código
git pull origin main

# Instalar dependencias
cd backend
npm install --production
cd ..\frontend
npm install --production
npm run build

# Reiniciar aplicación
pm2 restart abmmcn-backend
```

## Paso 11: Verificación Final

### 11.1 Verificar Funcionamiento

```powershell
# Verificar que la aplicación está corriendo
pm2 status

# Verificar logs
pm2 logs abmmcn-backend

# Probar endpoint
Invoke-WebRequest -Uri "https://tu-dominio.com/api/auth/verify" -Method GET
```

### 11.2 Crear Usuario Admin Inicial

```powershell
# Ejecutar script de setup
cd backend
node setup_auth_system.js
```

## Comandos Útiles de Mantenimiento

### Ver Estado de la Aplicación

```powershell
pm2 status
pm2 logs abmmcn-backend
pm2 monit
```

### Reiniciar Aplicación

```powershell
pm2 restart abmmcn-backend
```

### Ver Logs

```powershell
pm2 logs abmmcn-backend --lines 100
```

### Actualizar Aplicación

```powershell
.\update.ps1
```

## Consideraciones de Seguridad

### 1. Variables de Entorno

- Usar contraseñas fuertes
- No compartir archivos .env
- Usar diferentes JWT_SECRET para cada ambiente

### 2. Firewall

- Solo abrir puertos necesarios
- Configurar reglas específicas por IP si es posible

### 3. Base de Datos

- Usar usuario con permisos mínimos necesarios
- Configurar backup automático
- Monitorear conexiones

### 4. Logs

- Configurar rotación de logs
- Monitorear logs de errores
- Configurar alertas para errores críticos

## Troubleshooting

### Problema: Aplicación no inicia

```powershell
# Verificar logs
pm2 logs abmmcn-backend

# Verificar puerto
netstat -ano | findstr :3001

# Verificar variables de entorno
Get-Content backend\.env
```

### Problema: Error de conexión a base de datos

```powershell
# Verificar SQL Server
sqlcmd -S localhost -U appuser -P TuContraseñaSegura123!

# Verificar firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*SQL*"}
```

### Problema: Error de CORS

- Verificar CORS_ORIGIN en .env
- Verificar configuración de IIS
- Verificar certificados SSL

## Conclusión

Esta guía proporciona un despliegue completo y seguro de tu aplicación en un Windows Server. Recuerda:

1. **Probar en un ambiente de staging** antes de producción
2. **Documentar cualquier cambio específico** de tu entorno
3. **Configurar monitoreo y alertas**
4. **Mantener backups regulares**
5. **Actualizar regularmente** dependencias y sistema operativo

¿Necesitas ayuda con algún paso específico o tienes alguna pregunta sobre el despliegue?
