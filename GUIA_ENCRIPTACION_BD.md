# 🔐 Guía Completa: Encriptación de Comunicación con SQL Server

## 📋 ¿Cómo Funciona la Encriptación?

### 1. **Concepto Básico**

Cuando pones `DB_ENCRYPT=true`, la aplicación Node.js y SQL Server establecen una conexión **TLS/SSL** (similar a HTTPS en navegadores). Esto significa:

- ✅ **Toda la comunicación se encripta** (credenciales, queries, resultados)
- ✅ **Nadie puede interceptar** los datos en tránsito
- ✅ **Protección contra Man-in-the-Middle** attacks

### 2. **Proceso de Conexión Encriptada**

```
┌─────────────┐                                    ┌─────────────┐
│   Node.js   │                                    │ SQL Server  │
│  (Tu App)   │                                    │             │
└──────┬──────┘                                    └──────┬──────┘
       │                                                   │
       │  1. Solicitud de conexión encriptada             │
       │──────────────────────────────────────────────────>│
       │                                                   │
       │  2. SQL Server envía su certificado              │
       │<──────────────────────────────────────────────────│
       │                                                   │
       │  3. Validación del certificado                  │
       │     (si trustServerCertificate=false)           │
       │                                                   │
       │  4. Establecimiento de canal encriptado          │
       │<════════════════════════════════════════════════>│
       │                                                   │
       │  5. Comunicación encriptada                     │
       │<════════════════════════════════════════════════>│
       │  (Todas las queries y respuestas)                │
```

---

## 🔧 Configuración Paso a Paso

### **Paso 1: Configurar la Aplicación**

Edita tu archivo `.env` o `env.production`:

```bash
# Habilitar encriptación
DB_ENCRYPT=true

# Confiar en certificado (necesario si el certificado es auto-firmado)
DB_TRUST_CERT=true
```

**Explicación de las opciones:**

- **`DB_ENCRYPT=true`**: Le dice a Node.js "quiero conexión encriptada"
- **`DB_TRUST_CERT=true`**: Le dice a Node.js "confía en el certificado del servidor aunque sea auto-firmado"
  - Útil cuando SQL Server usa certificado auto-firmado (común en desarrollo)
  - En producción, idealmente usar certificados válidos y poner `false`

### **Paso 2: ¿Qué Necesita SQL Server?**

SQL Server **NO necesita configuración adicional** en la mayoría de los casos. Aquí está el detalle:

#### **Opción A: SQL Server con Certificado Auto-Firmado (Común)**

SQL Server **automáticamente genera un certificado auto-firmado** cuando:
- Se instala SQL Server
- Se habilita el protocolo TCP/IP
- Se reinicia el servicio

**Esto significa que:**
- ✅ **Ya funciona** - Solo necesitas poner `DB_ENCRYPT=true` y `DB_TRUST_CERT=true`
- ✅ **No necesitas configurar nada en SQL Server**
- ⚠️ El certificado es auto-firmado (no validado por una CA)

#### **Opción B: SQL Server con Certificado Válido (Producción)**

Si tienes un certificado válido (de una CA confiable):
- ✅ Usa `DB_ENCRYPT=true`
- ✅ Usa `DB_TRUST_CERT=false` (validará el certificado)
- ✅ Mayor seguridad

---

## 🧪 Cómo Probar si Funciona

### **Método 1: Script de Prueba Incluido**

La aplicación ya tiene un script para probar la conexión:

```bash
# Desde la raíz del proyecto
node backend/scripts/test-db-connection.js
```

**El script mostrará:**
```
═══════════════════════════════════════════════════════════
  🔍 Verificación de Conexión a Base de Datos
═══════════════════════════════════════════════════════════

  Servidor                : 192.168.168.208
  Puerto                  : 1433
  Usuario                 : app_user
  Contraseña              : app***
  Base de datos           : APPDATA
  Encriptación            : Sí          ← ✅ Aquí debe decir "Sí"
  Trust Certificate       : Sí

⏳ Intentando conectar...
✅ Conexión exitosa a la base de datos!
```

### **Método 2: Verificar en el Código**

Puedes verificar si la conexión está encriptada consultando SQL Server:

```sql
-- Ejecutar en SQL Server Management Studio
SELECT 
    session_id,
    encrypt_option,
    auth_scheme,
    client_net_address,
    client_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

Si `encrypt_option` es `TRUE`, la conexión está encriptada.

---

## ⚠️ Posibles Problemas y Soluciones

### **Problema 1: Error "Certificate validation failed"**

**Síntoma:**
```
Error: Certificate validation failed
```

**Solución:**
```bash
# En tu .env
DB_ENCRYPT=true
DB_TRUST_CERT=true  # ← Esto soluciona el problema
```

### **Problema 2: Error "The server does not support encryption"**

**Síntoma:**
```
Error: The server does not support encryption
```

**Causas posibles:**
1. SQL Server no tiene habilitado el protocolo TCP/IP
2. SQL Server está en una versión muy antigua
3. El puerto no permite conexiones encriptadas

**Soluciones:**

**A. Verificar que TCP/IP esté habilitado en SQL Server:**
```sql
-- En SQL Server Configuration Manager
-- 1. Abrir "SQL Server Network Configuration"
-- 2. Seleccionar "Protocols for [INSTANCIA]"
-- 3. Asegurarse que "TCP/IP" esté "Enabled"
-- 4. Reiniciar el servicio SQL Server
```

**B. Verificar versión de SQL Server:**
```sql
SELECT @@VERSION;
-- SQL Server 2005+ soporta encriptación
```

**C. Si no puedes habilitar encriptación:**
```bash
# Temporalmente, deshabilitar encriptación
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### **Problema 3: La conexión funciona sin encriptación pero falla con encriptación**

**Síntoma:**
- Con `DB_ENCRYPT=false` → ✅ Funciona
- Con `DB_ENCRYPT=true` → ❌ Falla

**Solución:**
1. Verificar que SQL Server tenga certificado (ver Paso 2)
2. Usar `DB_TRUST_CERT=true` si el certificado es auto-firmado
3. Verificar firewall (debe permitir puerto 1433)

---

## 🔍 Verificar Estado Actual

### **1. Verificar Configuración Actual**

```bash
# Ver qué está configurado
cat backend/env.production | grep DB_ENCRYPT
cat backend/env.production | grep DB_TRUST_CERT
```

### **2. Probar Conexión con Encriptación**

```bash
# 1. Editar .env o env.production
DB_ENCRYPT=true
DB_TRUST_CERT=true

# 2. Probar conexión
node backend/scripts/test-db-connection.js

# 3. Si funciona, verás "Encriptación: Sí"
```

### **3. Verificar en SQL Server (Opcional)**

Si tienes acceso a SQL Server Management Studio:

```sql
-- Ver conexiones activas y su estado de encriptación
SELECT 
    session_id,
    encrypt_option,
    auth_scheme,
    client_net_address,
    program_name
FROM sys.dm_exec_connections
WHERE program_name LIKE '%Node%'  -- Filtrar conexiones de Node.js
ORDER BY session_id DESC;
```

---

## 📊 Comparación: Con vs Sin Encriptación

### **Sin Encriptación (`DB_ENCRYPT=false`)**

```
┌─────────┐                    ┌─────────┐
│ Node.js │                    │SQL Server│
└────┬────┘                    └────┬────┘
     │                              │
     │  SELECT * FROM users         │
     │─────────────────────────────>│
     │  (texto plano)               │
     │                              │
     │  Resultado: [datos]          │
     │<─────────────────────────────│
     │  (texto plano)               │
```

**Riesgos:**
- ❌ Cualquiera en la red puede ver las queries
- ❌ Credenciales viajan en texto plano
- ❌ Datos sensibles expuestos

### **Con Encriptación (`DB_ENCRYPT=true`)**

```
┌─────────┐                    ┌─────────┐
│ Node.js │                    │SQL Server│
└────┬────┘                    └────┬────┘
     │                              │
     │  [Datos encriptados]         │
     │<════════════════════════════>│
     │  TLS/SSL                     │
     │                              │
     │  SELECT * FROM users         │
     │  (encriptado como:           │
     │   a8f3b2c9d1e4...)           │
     │─────────────────────────────>│
     │                              │
     │  Resultado: [datos]          │
     │  (encriptado)                │
     │<─────────────────────────────│
```

**Beneficios:**
- ✅ Todo está encriptado
- ✅ Protección contra interceptación
- ✅ Cumple con estándares de seguridad

---

## ✅ Checklist de Implementación

- [ ] 1. Editar `.env` o `env.production` con `DB_ENCRYPT=true`
- [ ] 2. Agregar `DB_TRUST_CERT=true` (si certificado es auto-firmado)
- [ ] 3. Reiniciar la aplicación
- [ ] 4. Ejecutar `node backend/scripts/test-db-connection.js`
- [ ] 5. Verificar que muestre "Encriptación: Sí"
- [ ] 6. Probar operaciones normales de la aplicación
- [ ] 7. Verificar logs para asegurar que no hay errores

---

## 🎯 Resumen Rápido

**Para habilitar encriptación:**

1. **Edita tu archivo de configuración:**
   ```bash
   DB_ENCRYPT=true
   DB_TRUST_CERT=true
   ```

2. **SQL Server NO necesita configuración adicional** (usa certificado auto-firmado por defecto)

3. **Prueba la conexión:**
   ```bash
   node backend/scripts/test-db-connection.js
   ```

4. **Si funciona, verás "Encriptación: Sí"** ✅

**¿Qué pasa si no funciona?**
- Usa `DB_TRUST_CERT=true` para certificados auto-firmados
- Verifica que SQL Server tenga TCP/IP habilitado
- Revisa los errores en el script de prueba

---

## 📚 Referencias Técnicas

- **TLS/SSL**: Protocolo de encriptación usado (mismo que HTTPS)
- **Certificado Auto-Firmado**: Certificado generado por SQL Server (no validado por CA)
- **Trust Server Certificate**: Opción para confiar en certificados no validados
- **Puerto 1433**: Puerto estándar de SQL Server (soporta encriptación)

---

**Fecha**: 2024
**Versión**: Guía práctica para habilitar encriptación


