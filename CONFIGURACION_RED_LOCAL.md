# 🚀 Configuración para Red Local

Guía completa para configurar y ejecutar la aplicación AbmMcn en red local.

## 📋 Prerrequisitos

- ✅ Node.js 18+ instalado
- ✅ Git instalado
- ✅ SQL Server ejecutándose (local o Docker)
- ✅ Conexión de red entre dispositivos

## 🔧 Paso a Paso

### 1. **Configurar Variables de Entorno**

```bash
# Copiar archivo de configuración
cp env.example .env

# Editar con tus credenciales
notepad .env
```

**Configuración recomendada para .env:**
```env
# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=simpleDev!
DB_DATABASE=APPDATA

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration - IMPORTANTE para red local
CORS_ORIGIN=http://localhost:5173,http://0.0.0.0:5173
```

### 2. **Configurar SQL Server**

**Opción A: Docker (Recomendado)**
```bash
docker-compose up -d
```

**Opción B: SQL Server Local**
- Instalar SQL Server
- Configurar usuario `sa` con contraseña `simpleDev!`
- Habilitar conexiones TCP/IP en puerto 1433

### 3. **Instalar Dependencias**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. **Obtener IP Local**

```bash
# Windows
ipconfig

# Buscar tu dirección IPv4 (ejemplo: 192.168.1.100)
```

### 5. **Iniciar Servicios**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 URLs de Acceso

### **Desde la máquina servidor:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### **Desde otros dispositivos en la red:**
- Frontend: http://TU_IP:5173
- Backend: http://TU_IP:3001
- Health Check: http://TU_IP:3001/api/health

## 🔥 Configuración de Firewall

### **Windows Firewall**

1. **Abrir Panel de Control > Sistema y Seguridad > Firewall de Windows Defender**

2. **Crear reglas de entrada para puertos:**
   - Puerto 3001 (Backend)
   - Puerto 5173 (Frontend)

3. **Comando rápido (ejecutar como administrador):**
```cmd
netsh advfirewall firewall add rule name="AbmMcn Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="AbmMcn Frontend" dir=in action=allow protocol=TCP localport=5173
```

### **SQL Server Firewall**

Si SQL Server está en otra máquina:
```cmd
netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433
```

## 🚀 Scripts Automatizados

### **Configuración Rápida:**
```bash
# Ejecutar script de configuración
setup-local-network.bat
```

### **Inicio Rápido:**
```bash
# Terminal 1
start-backend.bat

# Terminal 2
start-frontend.bat
```

## 🔍 Verificación

### **1. Verificar Backend:**
```bash
curl http://localhost:3001/api/health
```
**Respuesta esperada:**
```json
{"status":"OK","timestamp":"2025-08-28T15:14:29.763Z","environment":"development"}
```

### **2. Verificar Frontend:**
- Abrir http://localhost:5173 en el navegador
- Debería cargar la aplicación sin errores

### **3. Verificar desde Red Local:**
- Desde otro dispositivo, abrir http://TU_IP:5173
- Debería cargar la aplicación

## 🛠️ Solución de Problemas

### **Error de Conexión Backend**
- Verificar que el puerto 3001 esté abierto
- Verificar configuración CORS en .env
- Verificar que no haya otro servicio usando el puerto

### **Error de Conexión Frontend**
- Verificar que el puerto 5173 esté abierto
- Verificar configuración de Vite (host: '0.0.0.0')
- Verificar firewall

### **Error de Conexión Base de Datos**
- Verificar que SQL Server esté ejecutándose
- Verificar credenciales en .env
- Verificar que el puerto 1433 esté abierto

### **Error de CORS**
- Verificar configuración CORS_ORIGIN en .env
- Verificar que incluya las URLs correctas
- Reiniciar backend después de cambios

## 📊 Monitoreo

### **Verificar Puertos Activos:**
```bash
netstat -an | findstr "3001\|5173"
```

### **Verificar Servicios:**
```bash
# Backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:5173
```

## 🔒 Seguridad

### **Recomendaciones:**
- Cambiar contraseñas por defecto
- Usar HTTPS en producción
- Configurar firewall específico
- Limitar acceso por IP si es necesario

### **Variables Sensibles:**
- JWT_SECRET: Cambiar por una clave segura
- DB_PASSWORD: Usar contraseña fuerte
- CORS_ORIGIN: Limitar a IPs específicas en producción

## 📝 Notas Importantes

1. **CORS**: La configuración CORS_ORIGIN debe incluir todas las URLs desde donde se accederá
2. **Firewall**: Los puertos 3001 y 5173 deben estar abiertos
3. **SQL Server**: Debe permitir conexiones TCP/IP
4. **Red**: Los dispositivos deben estar en la misma red local

## 🎯 Próximos Pasos

1. ✅ Configurar red local
2. 🔄 Probar acceso desde otros dispositivos
3. 🔄 Configurar base de datos de producción
4. 🔄 Implementar autenticación
5. 🔄 Configurar HTTPS
6. 🔄 Implementar backup automático
