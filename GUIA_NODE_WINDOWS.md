# 🚀 Guía Completa: Configurar PM2 como Servicio con node-windows

## 📋 **Resumen**

Esta guía te permitirá configurar PM2 como un servicio nativo de Windows Server usando **node-windows**, una librería específicamente diseñada para Node.js que ofrece mejor integración y facilidad de uso.

---

## 🎯 **¿Por qué node-windows es mejor que NSSM?**

| Característica              | NSSM          | node-windows          |
| --------------------------- | ------------- | --------------------- |
| **Facilidad de uso**        | Media         | ⭐ **Muy fácil**      |
| **Integración con Node.js** | Externa       | ⭐ **Nativa**         |
| **Configuración**           | Manual        | ⭐ **Automática**     |
| **Logs**                    | Básicos       | ⭐ **Avanzados**      |
| **Reinicio automático**     | ✅            | ⭐ **Inteligente**    |
| **Gestión**                 | NSSM commands | ⭐ **JavaScript API** |
| **Manejo de errores**       | Básico        | ⭐ **Avanzado**       |

---

## 🎯 **¿Qué vamos a lograr?**

- ✅ PM2 como servicio nativo de Windows
- ✅ Inicio automático al reiniciar el servidor
- ✅ Reinicio automático inteligente si la aplicación falla
- ✅ Logs avanzados integrados con el sistema
- ✅ Gestión desde JavaScript API
- ✅ Mejor manejo de errores y recuperación

---

## 📦 **Paso 1: Preparar el Windows Server**

### 1.1 Conectar al Windows Server

```cmd
# Conectarte por RDP o acceso directo al servidor
# Asegúrate de tener permisos de Administrador
```

### 1.2 Verificar Node.js y PM2

```cmd
# Abrir CMD como Administrador
# Verificar Node.js
node --version

# Verificar PM2
pm2 --version

# Si no están instalados, instalar:
npm install -g pm2
```

### 1.3 Navegar al directorio del proyecto

```cmd
# Navegar a donde tienes el proyecto AbmMcn
cd C:\ruta\a\tu\proyecto\AbmMcn
```

---

## 📥 **Paso 2: Instalar node-windows**

### 2.1 Instalar node-windows

```cmd
# Instalar node-windows en el proyecto
npm install node-windows
```

### 2.2 Verificar instalación

```cmd
# Verificar que node-windows esté instalado
npm list node-windows
```

---

## 🔧 **Paso 3: Configurar PM2 como Servicio**

### 3.1 Detener PM2 actual (si está corriendo)

```cmd
# Detener PM2 si está ejecutándose
pm2 kill
```

### 3.2 Crear directorio de logs

```cmd
# Crear directorio de logs si no existe
mkdir logs
```

### 3.3 Instalar el servicio

```cmd
# Instalar servicio PM2 con node-windows
node setup-node-windows-service.js install
```

### 3.4 Verificar instalación

```cmd
# Verificar que el servicio esté instalado
sc query "AbmMcn-PM2"
```

---

## 🚀 **Paso 4: Gestionar el Servicio**

### 4.1 Comandos de gestión

```cmd
# Iniciar servicio
node setup-node-windows-service.js start

# Detener servicio
node setup-node-windows-service.js stop

# Reiniciar servicio
node setup-node-windows-service.js restart

# Desinstalar servicio
node setup-node-windows-service.js uninstall
```

### 4.2 Verificar estado

```cmd
# Verificar estado del servicio
sc query "AbmMcn-PM2"

# Verificar PM2
pm2 list
```

### 4.3 Verificar en el Administrador de servicios

```cmd
# Abrir Administrador de servicios
services.msc

# Buscar "AbmMcn-PM2" y verificar que esté "En ejecución"
```

---

## 🔍 **Paso 5: Verificar Funcionamiento**

### 5.1 Verificar aplicaciones

```cmd
# Ver aplicaciones en PM2
pm2 list

# Ver logs
pm2 logs
```

### 5.2 Verificar puertos

```cmd
# Verificar que los puertos estén en uso
netstat -an | findstr ":3001"
netstat -an | findstr ":5173"
```

### 5.3 Probar acceso web

```cmd
# Probar backend
curl http://localhost:3001/health

# Probar frontend
curl http://localhost:5173
```

---

## 🔄 **Paso 6: Probar Persistencia**

### 6.1 Reiniciar el servidor

```cmd
# Reiniciar Windows Server
shutdown /r /t 0
```

### 6.2 Verificar después del reinicio

```cmd
# Después del reinicio, verificar:
pm2 list
sc query "AbmMcn-PM2"
```

---

## 🛠️ **Comandos de Gestión del Servicio**

### Gestión básica

```cmd
# Iniciar servicio
node setup-node-windows-service.js start

# Detener servicio
node setup-node-windows-service.js stop

# Reiniciar servicio
node setup-node-windows-service.js restart

# Desinstalar servicio
node setup-node-windows-service.js uninstall
```

### Gestión desde el sistema

```cmd
# Ver estado del servicio
sc query "AbmMcn-PM2"

# Iniciar desde el sistema
sc start "AbmMcn-PM2"

# Detener desde el sistema
sc stop "AbmMcn-PM2"
```

### Gestión de PM2

```cmd
# Ver aplicaciones
pm2 list

# Ver logs
pm2 logs

# Reiniciar aplicaciones
pm2 restart all

# Detener aplicaciones
pm2 stop all
```

---

## 📊 **Logs y Monitoreo**

### Logs del servicio

```cmd
# Ver logs del servicio
type logs\pm2-service-info.log
type logs\pm2-service-error.log
type logs\pm2-service-stdout.log
type logs\pm2-service-stderr.log
```

### Logs de PM2

```cmd
# Ver logs de PM2
pm2 logs

# Ver logs específicos
pm2 logs abmmcn-backend
pm2 logs abmmcn-frontend
```

### Monitoreo en tiempo real

```cmd
# Monitoreo de PM2
pm2 monit

# Ver métricas
pm2 show abmmcn-backend
pm2 show abmmcn-frontend
```

---

## 🚨 **Solución de Problemas**

### Problema: Servicio no inicia

```cmd
# Verificar logs del servicio
type logs\pm2-service-error.log

# Verificar configuración
sc qc "AbmMcn-PM2"

# Reiniciar servicio
node setup-node-windows-service.js restart
```

### Problema: PM2 no responde

```cmd
# Detener servicio
node setup-node-windows-service.js stop

# Limpiar PM2
pm2 kill

# Reiniciar servicio
node setup-node-windows-service.js start
```

### Problema: Aplicaciones no se inician

```cmd
# Verificar ecosystem.config.js
type ecosystem.config.js

# Verificar logs
pm2 logs

# Reiniciar aplicaciones
pm2 restart all
```

### Problema: node-windows no funciona

```cmd
# Reinstalar node-windows
npm uninstall node-windows
npm install node-windows

# Verificar permisos
# Asegúrate de ejecutar como Administrador
```

---

## 📊 **Monitoreo y Mantenimiento**

### Verificar estado regularmente

```cmd
# Script de verificación diaria
@echo off
echo Verificando estado de AbmMcn...
sc query "AbmMcn-PM2"
pm2 list
echo Verificación completada.
pause
```

### Limpiar logs antiguos

```cmd
# Limpiar logs de PM2
pm2 flush

# Limpiar logs del servicio
del logs\pm2-service-*.log
```

### Actualizar servicio

```cmd
# Detener servicio
node setup-node-windows-service.js stop

# Actualizar código
# ... hacer cambios ...

# Reiniciar servicio
node setup-node-windows-service.js start
```

---

## ✅ **Checklist de Verificación**

- [ ] Node.js instalado y funcionando
- [ ] PM2 instalado y funcionando
- [ ] node-windows instalado
- [ ] Archivos de servicio creados
- [ ] Servicio "AbmMcn-PM2" instalado
- [ ] Servicio iniciado y funcionando
- [ ] PM2 listando aplicaciones correctamente
- [ ] Puertos 3001 y 5173 en uso
- [ ] Aplicación web accesible
- [ ] Servicio persiste después de reinicio
- [ ] Logs funcionando correctamente

---

## 🎉 **¡Listo!**

Una vez completados todos los pasos, tu aplicación AbmMcn estará ejecutándose como un servicio nativo de Windows Server con **node-windows**, ofreciendo:

- **Mejor integración** con Node.js
- **Logs más avanzados** y detallados
- **Gestión más fácil** desde JavaScript
- **Mejor manejo de errores** y recuperación
- **Inicio automático** al reiniciar el servidor

**Comandos útiles para el día a día:**

- `node setup-node-windows-service.js start` - Iniciar servicio
- `node setup-node-windows-service.js stop` - Detener servicio
- `pm2 list` - Ver aplicaciones
- `pm2 logs` - Ver logs
- `services.msc` - Abrir administrador de servicios

---

## 🔄 **Comparación Final: NSSM vs node-windows**

| Aspecto         | NSSM     | node-windows |
| --------------- | -------- | ------------ |
| **Facilidad**   | ⭐⭐⭐   | ⭐⭐⭐⭐⭐   |
| **Integración** | ⭐⭐     | ⭐⭐⭐⭐⭐   |
| **Logs**        | ⭐⭐     | ⭐⭐⭐⭐⭐   |
| **Gestión**     | ⭐⭐⭐   | ⭐⭐⭐⭐⭐   |
| **Estabilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐   |

**Recomendación: node-windows es la mejor opción para tu caso.**

---

**¿Necesitas ayuda con algún paso específico?** ¡Pregúntame!
