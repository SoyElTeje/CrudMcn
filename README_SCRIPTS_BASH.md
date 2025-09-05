# 🚀 Scripts Bash para AbmMcn

Guía de uso de los scripts bash para desarrollo y producción.

## 📋 Scripts Disponibles

### **Desarrollo Local**

| Script                    | Descripción                              | Uso                         |
| ------------------------- | ---------------------------------------- | --------------------------- |
| `setup-local-network.sh`  | Configura la aplicación para red local   | `./setup-local-network.sh`  |
| `start-backend.sh`        | Inicia el backend en modo desarrollo     | `./start-backend.sh`        |
| `start-frontend.sh`       | Inicia el frontend en modo desarrollo    | `./start-frontend.sh`       |
| `check-network-status.sh` | Verifica el estado de la red y servicios | `./check-network-status.sh` |

### **Producción**

| Script                 | Descripción                        | Uso                      |
| ---------------------- | ---------------------------------- | ------------------------ |
| `deploy-production.sh` | Despliegue completo en producción  | `./deploy-production.sh` |
| `start-production.sh`  | Inicia la aplicación en producción | `./start-production.sh`  |
| `test-production.sh`   | Verifica el estado de producción   | `./test-production.sh`   |

### **Test de Base de Datos**

| Script              | Descripción                   | Uso                         |
| ------------------- | ----------------------------- | --------------------------- |
| `testDb/install.sh` | Instala dependencias del test | `cd testDb && ./install.sh` |
| `testDb/run.sh`     | Ejecuta el test de conexión   | `cd testDb && ./run.sh`     |

## 🚀 Uso Rápido

### **Desarrollo Local**

```bash
# 1. Configurar red local
./setup-local-network.sh

# 2. Terminal 1 - Backend
./start-backend.sh

# 3. Terminal 2 - Frontend
./start-frontend.sh

# 4. Verificar estado
./check-network-status.sh
```

### **Producción**

```bash
# 1. Despliegue completo
./deploy-production.sh

# 2. Iniciar aplicación
./start-production.sh

# 3. Verificar estado
./test-production.sh
```

### **Test de Base de Datos**

```bash
# 1. Instalar dependencias
cd testDb && ./install.sh

# 2. Ejecutar test
./run.sh
```

## 🔧 Configuración

### **Hacer Scripts Ejecutables**

```bash
# En la raíz del proyecto
chmod +x *.sh

# En la carpeta testDb
chmod +x testDb/*.sh
```

### **Editar Variables de Entorno**

```bash
# Desarrollo
nano .env

# Producción
nano .env
```

## 📊 URLs de Acceso

### **Desarrollo Local**

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### **Producción**

- Frontend: http://IP_SERVIDOR:4173
- Backend: http://IP_SERVIDOR:3001
- Health Check: http://IP_SERVIDOR:3001/api/health

## 🛠️ Solución de Problemas

### **Script no ejecutable**

```bash
chmod +x nombre_del_script.sh
```

### **Error de permisos**

```bash
# Ejecutar como administrador si es necesario
sudo ./nombre_del_script.sh
```

### **Error de línea de comandos**

```bash
# Verificar que estás usando Git Bash
bash --version
```

## 📝 Notas Importantes

1. **Git Bash**: Todos los scripts están diseñados para Git Bash en Windows
2. **Permisos**: Los scripts deben ser ejecutables (`chmod +x`)
3. **Variables de entorno**: Configurar `.env` antes de ejecutar los scripts
4. **Puertos**: Verificar que los puertos 3001, 5173 y 4173 estén disponibles

## 🎯 Comandos Útiles

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Git Bash
bash --version

# Verificar puertos activos
netstat -an | grep "3001\|5173\|4173"

# Verificar procesos Node.js
tasklist | findstr node
```








