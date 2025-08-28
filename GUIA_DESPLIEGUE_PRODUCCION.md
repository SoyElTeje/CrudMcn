# 🚀 Guía de Despliegue en Producción

Guía completa para desplegar la aplicación AbmMcn en el servidor de producción.

## 📋 Prerrequisitos del Servidor

### **Software Requerido:**

- ✅ Windows Server (o Windows 10/11)
- ✅ Node.js 18+ instalado
- ✅ Git instalado
- ✅ Acceso a SQL Server de producción
- ✅ Puertos 3001 y 4173 disponibles

### **Verificar Instalaciones:**

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Git
git --version
```

## 🔧 Paso a Paso del Despliegue

### **1. Preparar el Proyecto en el Servidor**

**Opción A: Clonar desde Git**

```bash
# En el servidor de producción
git clone <URL_DEL_REPOSITORIO>
cd AbmMcn
```

**Opción B: Transferir archivos**

```bash
# Copiar la carpeta del proyecto al servidor
# O descomprimir el ZIP del proyecto
```

### **2. Configurar Variables de Entorno**

```bash
# Copiar archivo de configuración de producción
copy env.production.example .env

# Editar con credenciales reales
notepad .env
```

**Configuración del archivo .env:**

```env
# Database Configuration - PRODUCCION
DB_SERVER=IP_SERVIDOR_SQL_PRODUCCION
DB_PORT=1433
DB_USER=usuario_produccion
DB_PASSWORD=password_segura_produccion
DB_DATABASE=nombre_base_datos_produccion

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://IP_SERVIDOR:4173,http://localhost:4173

# JWT Configuration
JWT_SECRET=clave_super_secreta_y_muy_larga_para_produccion
JWT_EXPIRES_IN=24h
```

### **3. Instalar Dependencias**

```bash
# Backend - Solo dependencias de producción
cd backend
npm install --production

# Frontend - Todas las dependencias
cd ../frontend
npm install
```

### **4. Construir Frontend para Producción**

```bash
cd frontend
npm run build
```

### **5. Probar Conexión a Base de Datos**

```bash
# Usar el script de prueba
cd testDb
node test_db.js
```

## 🚀 Iniciar la Aplicación

### **Opción A: Scripts Automatizados**

```bash
# Despliegue completo
deploy-production.bat

# Iniciar aplicación
start-production.bat
```

### **Opción B: Comandos Manuales**

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run preview
```

## 🌐 URLs de Acceso

### **Desde el servidor:**

- Frontend: http://localhost:4173
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### **Desde otros dispositivos:**

- Frontend: http://IP_SERVIDOR:4173
- Backend: http://IP_SERVIDOR:3001
- Health Check: http://IP_SERVIDOR:3001/api/health

## 🔥 Configuración de Firewall

### **Windows Firewall - Servidor**

**Ejecutar como administrador:**

```cmd
# Puerto Backend
netsh advfirewall firewall add rule name="AbmMcn Backend" dir=in action=allow protocol=TCP localport=3001

# Puerto Frontend
netsh advfirewall firewall add rule name="AbmMcn Frontend" dir=in action=allow protocol=TCP localport=4173

# Puerto SQL Server (si es necesario)
netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433
```

### **Verificar Puertos:**

```cmd
netstat -an | findstr "3001\|4173\|1433"
```

## 🔍 Verificación del Despliegue

### **1. Verificar Backend:**

```bash
curl http://localhost:3001/api/health
```

**Respuesta esperada:**

```json
{
  "status": "OK",
  "timestamp": "2025-08-28T15:14:29.763Z",
  "environment": "production"
}
```

### **2. Verificar Frontend:**

- Abrir http://localhost:4173 en el navegador
- Debería cargar la aplicación sin errores

### **3. Verificar Base de Datos:**

- La aplicación debería conectarse a la base de datos de producción
- Verificar que las tablas se muestren correctamente

## 🛠️ Solución de Problemas

### **Error de Conexión a Base de Datos**

- Verificar credenciales en .env
- Verificar que SQL Server esté accesible desde el servidor
- Verificar puerto 1433 abierto
- Probar con el script testDb

### **Error de CORS**

- Verificar configuración CORS_ORIGIN en .env
- Incluir la IP real del servidor
- Reiniciar backend después de cambios

### **Error de Puertos**

- Verificar que los puertos 3001 y 4173 estén libres
- Verificar configuración de firewall
- Usar `netstat -an` para verificar puertos activos

### **Error de Permisos**

- Ejecutar como administrador si es necesario
- Verificar permisos de carpeta del proyecto
- Verificar permisos de usuario en SQL Server

## 📊 Monitoreo en Producción

### **Verificar Estado de Servicios:**

```bash
# Verificar procesos
tasklist | findstr node

# Verificar puertos
netstat -an | findstr "3001\|4173"

# Verificar logs
# Los logs aparecen en las terminales donde ejecutaste los servicios
```

### **Comandos de Mantenimiento:**

```bash
# Reiniciar backend
cd backend && npm start

# Reiniciar frontend
cd frontend && npm run preview

# Verificar health check
curl http://localhost:3001/api/health
```

## 🔒 Seguridad en Producción

### **Recomendaciones:**

- ✅ Cambiar contraseñas por defecto
- ✅ Usar contraseñas fuertes para SQL Server
- ✅ Configurar JWT_SECRET seguro
- ✅ Limitar acceso por IP si es necesario
- ✅ Configurar firewall específico
- ✅ Usar HTTPS en producción (configurar certificado SSL)

### **Variables Sensibles:**

- `DB_PASSWORD`: Contraseña fuerte para SQL Server
- `JWT_SECRET`: Clave larga y compleja
- `CORS_ORIGIN`: Limitar a IPs específicas

## 📝 Notas Importantes

1. **Base de Datos**: Asegurar que la base de datos de producción esté respaldada
2. **Credenciales**: Nunca compartir credenciales de producción
3. **Logs**: Monitorear logs para detectar problemas
4. **Backup**: Implementar backup automático de la aplicación
5. **Actualizaciones**: Planificar actualizaciones en horarios de bajo tráfico

## 🎯 Próximos Pasos

1. ✅ Desplegar en servidor de producción
2. 🔄 Configurar HTTPS/SSL
3. 🔄 Implementar backup automático
4. 🔄 Configurar monitoreo automático
5. 🔄 Implementar CI/CD para actualizaciones
6. 🔄 Configurar logs centralizados
