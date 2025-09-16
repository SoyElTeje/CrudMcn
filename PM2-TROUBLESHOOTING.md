# 🔧 Solución de Problemas de PM2 en Windows

## 🚨 Error: `connect EPERM //./pipe/rpc.sock`

Este es un error común en Windows que indica que PM2 no puede conectarse al daemon debido a permisos o procesos bloqueados.

### 🔍 Causas Comunes

1. **Procesos de Node.js bloqueados**
2. **PM2 daemon corrupto**
3. **Archivos de socket bloqueados**
4. **Permisos insuficientes**
5. **Instalación corrupta de PM2**

## 🛠️ Soluciones

### Solución 1: Reparación Rápida (Recomendada)

```cmd
# Ejecutar como Administrador
quick-fix-pm2.bat
```

### Solución 2: Reparación Completa

```cmd
# Ejecutar como Administrador
fix-pm2-windows.bat
```

### Solución 3: Reparación Manual

```cmd
# 1. Detener procesos de Node.js
taskkill /f /im node.exe

# 2. Matar PM2 daemon
pm2 kill

# 3. Limpiar directorio PM2
rmdir /s /q "%USERPROFILE%\.pm2"

# 4. Reinstalar PM2
npm uninstall -g pm2
npm install -g pm2

# 5. Inicializar PM2
pm2 ping
```

## 🔧 Comandos de Diagnóstico

### Verificar Estado de PM2

```cmd
# Verificar si PM2 responde
pm2 ping

# Ver versiones
pm2 --version
node --version

# Ver procesos de Node.js
tasklist | findstr node

# Ver procesos de PM2
tasklist | findstr pm2
```

### Verificar Archivos de PM2

```cmd
# Ver directorio PM2
dir "%USERPROFILE%\.pm2"

# Ver archivos de socket
dir "\\.\pipe\" | findstr rpc
```

## 🚨 Problemas Específicos

### Problema: PM2 no inicia

**Síntomas:**

```
Error: connect EPERM //./pipe/rpc.sock
```

**Solución:**

```cmd
# Ejecutar como Administrador
fix-pm2-windows.bat
```

### Problema: PM2 no responde

**Síntomas:**

```
pm2 list
# No responde o da error
```

**Solución:**

```cmd
# Reiniciar PM2 daemon
pm2 kill
pm2 ping
```

### Problema: Aplicaciones no se inician

**Síntomas:**

```
pm2 start app.js
# Error o no inicia
```

**Solución:**

```cmd
# Verificar logs
pm2 logs

# Reiniciar PM2
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Problema: Permisos insuficientes

**Síntomas:**

```
EPERM errors
Access denied
```

**Solución:**

```cmd
# Ejecutar PowerShell como Administrador
# O ejecutar CMD como Administrador
```

## 🔄 Proceso de Reparación Completa

### Paso 1: Preparación

```cmd
# Abrir CMD como Administrador
# Navegar al directorio del proyecto
cd C:\CrudMcn-main
```

### Paso 2: Detener Procesos

```cmd
# Detener todos los procesos de Node.js
taskkill /f /im node.exe

# Detener PM2
pm2 kill
```

### Paso 3: Limpiar Archivos

```cmd
# Limpiar directorio PM2
rmdir /s /q "%USERPROFILE%\.pm2"

# Limpiar archivos temporales
del /q /s "%TEMP%\pm2*" >nul 2>&1
```

### Paso 4: Reinstalar PM2

```cmd
# Desinstalar PM2
npm uninstall -g pm2

# Instalar PM2
npm install -g pm2

# Instalar pm2-windows-service
npm install -g pm2-windows-service
```

### Paso 5: Configurar PM2

```cmd
# Inicializar PM2
pm2 ping

# Configurar como servicio
pm2-service-install -n "AbmMcn-PM2"
```

### Paso 6: Verificar

```cmd
# Verificar estado
pm2 list

# Probar comando
pm2 --version
```

## 🚀 Después de la Reparación

### Reiniciar Despliegue

```cmd
# Configurar entorno
configure-production-env.bat

# Desplegar
deploy-production.bat

# Verificar
verify-deployment.bat
```

### Comandos Útiles

```cmd
# Ver estado
pm2 status

# Ver logs
pm2 logs

# Reiniciar aplicaciones
pm2 restart all

# Monitoreo
pm2 monit
```

## 🔒 Prevención de Problemas

### Configuración Recomendada

1. **Ejecutar siempre como Administrador** los scripts de PM2
2. **No cerrar CMD** mientras PM2 está ejecutándose
3. **Usar PM2 como servicio** para mayor estabilidad
4. **Monitorear logs** regularmente

### Mantenimiento Regular

```cmd
# Verificar estado semanalmente
pm2 status

# Limpiar logs antiguos
pm2 flush

# Reiniciar aplicaciones si es necesario
pm2 restart all
```

## 📞 Soporte Adicional

### Si los Scripts No Funcionan

1. **Verificar permisos de Administrador**
2. **Reiniciar el servidor**
3. **Verificar antivirus** (puede bloquear PM2)
4. **Verificar firewall** (puertos 3001, 5173)

### Logs de Diagnóstico

```cmd
# Ver logs de PM2
pm2 logs --lines 50

# Ver logs del sistema
eventvwr.msc

# Ver logs de Node.js
type logs\backend-error.log
```

---

**¡Problemas de PM2 solucionados!** 🎉

Si sigues teniendo problemas, ejecuta `fix-pm2-windows.bat` como Administrador.







