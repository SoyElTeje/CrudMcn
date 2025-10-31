# 🚀 Guía Completa: Configurar PM2 como Servicio con NSSM en Windows Server

## 📋 **Resumen**

Esta guía te permitirá configurar PM2 como un servicio nativo de Windows Server usando NSSM (Non-Sucking Service Manager), garantizando que tu aplicación AbmMcn se inicie automáticamente y persista después de reinicios.

---

## 🎯 **¿Qué vamos a lograr?**

- ✅ PM2 como servicio nativo de Windows
- ✅ Inicio automático al reiniciar el servidor
- ✅ Reinicio automático si la aplicación falla
- ✅ Logs integrados con el sistema de Windows
- ✅ Gestión desde el Administrador de servicios

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

## 📥 **Paso 2: Instalar NSSM**

### 2.1 Descargar NSSM

```cmd
# Opción A: Descargar manualmente
# Ir a: https://nssm.cc/download
# Descargar: nssm-2.24.zip
# Extraer en: C:\nssm\

# Opción B: Usar Chocolatey (si está instalado)
choco install nssm

# Opción C: Usar winget (Windows 10/11)
winget install NSSM
```

### 2.2 Verificar instalación

```cmd
# Verificar que NSSM esté disponible
nssm --version
```

---

## 🔧 **Paso 3: Configurar PM2 como Servicio**

### 3.1 Detener PM2 actual (si está corriendo)

```cmd
# Detener PM2 si está ejecutándose
pm2 kill
```

### 3.2 Crear script de inicio

```cmd
# Crear archivo: start-pm2.bat
echo @echo off > start-pm2.bat
echo cd /d "%~dp0" >> start-pm2.bat
echo pm2 start ecosystem.config.js --env production >> start-pm2.bat
echo pm2 save >> start-pm2.bat
```

### 3.3 Crear script de parada

```cmd
# Crear archivo: stop-pm2.bat
echo @echo off > stop-pm2.bat
echo cd /d "%~dp0" >> stop-pm2.bat
echo pm2 stop all >> stop-pm2.bat
echo pm2 kill >> stop-pm2.bat
```

### 3.4 Instalar el servicio

```cmd
# Instalar servicio PM2
nssm install "AbmMcn-PM2" "C:\ruta\a\tu\proyecto\AbmMcn\start-pm2.bat"
```

### 3.5 Configurar parámetros del servicio

```cmd
# Configurar directorio de trabajo
nssm set "AbmMcn-PM2" AppDirectory "C:\ruta\a\tu\proyecto\AbmMcn"

# Configurar descripción
nssm set "AbmMcn-PM2" Description "AbmMcn - Sistema de Gestión de Bases de Datos - PM2 Process Manager"

# Configurar inicio automático
nssm set "AbmMcn-PM2" Start SERVICE_AUTO_START

# Configurar reinicio automático
nssm set "AbmMcn-PM2" AppExit Default Restart

# Configurar logs
nssm set "AbmMcn-PM2" AppStdout "C:\ruta\a\tu\proyecto\AbmMcn\logs\pm2-service.log"
nssm set "AbmMcn-PM2" AppStderr "C:\ruta\a\tu\proyecto\AbmMcn\logs\pm2-service-error.log"

# Configurar tiempo de espera
nssm set "AbmMcn-PM2" AppStopMethodSkip 0
nssm set "AbmMcn-PM2" AppStopMethodConsole 5000
nssm set "AbmMcn-PM2" AppStopMethodWindow 5000
nssm set "AbmMcn-PM2" AppStopMethodThreads 5000
```

---

## 🚀 **Paso 4: Iniciar y Verificar el Servicio**

### 4.1 Iniciar el servicio

```cmd
# Iniciar el servicio
nssm start "AbmMcn-PM2"
```

### 4.2 Verificar estado

```cmd
# Verificar estado del servicio
nssm status "AbmMcn-PM2"

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
nssm status "AbmMcn-PM2"
```

---

## 🛠️ **Comandos de Gestión del Servicio**

### Gestión básica

```cmd
# Iniciar servicio
nssm start "AbmMcn-PM2"

# Detener servicio
nssm stop "AbmMcn-PM2"

# Reiniciar servicio
nssm restart "AbmMcn-PM2"

# Ver estado
nssm status "AbmMcn-PM2"
```

### Gestión avanzada

```cmd
# Ver configuración
nssm dump "AbmMcn-PM2"

# Editar configuración
nssm edit "AbmMcn-PM2"

# Desinstalar servicio
nssm remove "AbmMcn-PM2" confirm
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

## 🚨 **Solución de Problemas**

### Problema: Servicio no inicia

```cmd
# Verificar logs del servicio
type logs\pm2-service.log
type logs\pm2-service-error.log

# Verificar configuración
nssm dump "AbmMcn-PM2"

# Reiniciar servicio
nssm restart "AbmMcn-PM2"
```

### Problema: PM2 no responde

```cmd
# Detener servicio
nssm stop "AbmMcn-PM2"

# Limpiar PM2
pm2 kill

# Reiniciar servicio
nssm start "AbmMcn-PM2"
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

---

## 📊 **Monitoreo y Mantenimiento**

### Verificar estado regularmente

```cmd
# Script de verificación diaria
@echo off
echo Verificando estado de AbmMcn...
nssm status "AbmMcn-PM2"
pm2 list
echo Verificación completada.
pause
```

### Limpiar logs antiguos

```cmd
# Limpiar logs de PM2
pm2 flush

# Limpiar logs del servicio
del logs\pm2-service*.log
```

---

## ✅ **Checklist de Verificación**

- [ ] Node.js instalado y funcionando
- [ ] PM2 instalado y funcionando
- [ ] NSSM instalado y funcionando
- [ ] Scripts de inicio/parada creados
- [ ] Servicio "AbmMcn-PM2" instalado
- [ ] Servicio configurado correctamente
- [ ] Servicio iniciado y funcionando
- [ ] PM2 listando aplicaciones correctamente
- [ ] Puertos 3001 y 5173 en uso
- [ ] Aplicación web accesible
- [ ] Servicio persiste después de reinicio

---

## 🎉 **¡Listo!**

Una vez completados todos los pasos, tu aplicación AbmMcn estará ejecutándose como un servicio nativo de Windows Server, iniciándose automáticamente y persistiendo después de reinicios.

**Comandos útiles para el día a día:**

- `nssm status "AbmMcn-PM2"` - Ver estado del servicio
- `pm2 list` - Ver aplicaciones
- `pm2 logs` - Ver logs
- `services.msc` - Abrir administrador de servicios

---

**¿Necesitas ayuda con algún paso específico?** ¡Pregúntame!
