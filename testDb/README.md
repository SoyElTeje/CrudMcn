# Test Database Connection

Script de prueba para verificar la conexión a SQL Server y listar las tablas de la base de datos.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- SQL Server ejecutándose (local o remoto)
- Acceso a la base de datos con credenciales válidas

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar las variables según tu configuración
nano .env
```

### 3. Variables de entorno necesarias

Edita el archivo `.env` con tus credenciales:

```env
# Database Configuration
DB_SERVER=localhost          # IP o nombre del servidor SQL Server
DB_PORT=1433                 # Puerto de SQL Server (por defecto 1433)
DB_USER=sa                   # Usuario de la base de datos
DB_PASSWORD=simpleDev!       # Contraseña del usuario
DB_DATABASE=APPDATA          # Nombre de la base de datos
```

## 🎯 Uso

### Ejecutar el script

```bash
npm start
```

o

```bash
node test_db.js
```

### Qué hace el script

1. **Conecta a SQL Server** usando las credenciales del archivo `.env`
2. **Lista todas las tablas** de la base de datos especificada
3. **Muestra información adicional** de la base de datos
4. **Espera input del usuario** - Presiona "X" y Enter para salir

## 🔧 Solución de Problemas

### Error de conexión

- Verificar que SQL Server esté ejecutándose
- Verificar credenciales en el archivo `.env`
- Verificar que el puerto 1433 esté abierto
- Si usas Docker: `docker-compose up -d`

### Error de autenticación

- Verificar usuario y contraseña
- Verificar que el usuario tenga permisos en la base de datos
- Verificar que SQL Server permita autenticación SQL

### Error de red

- Verificar que el servidor sea accesible desde tu máquina
- Verificar configuración de firewall
- Verificar que SQL Server esté configurado para conexiones TCP/IP

## 📁 Estructura del Proyecto

```
testDb/
├── package.json      # Dependencias y scripts
├── test_db.js        # Script principal
├── env.example       # Variables de entorno de ejemplo
└── README.md         # Este archivo
```

## 🎨 Salida del Script

El script mostrará:

```
🚀 Test de Conexión a Base de Datos SQL Server
==================================================

🔌 Conectando a la base de datos...
📊 Servidor: localhost:1433
🗄️  Base de datos: APPDATA
👤 Usuario: sa

✅ Conexión exitosa a SQL Server!

📋 Tablas disponibles:
==================================================
1. [dbo] Users
2. [dbo] Products
3. [dbo] Orders

📊 Total de tablas: 3

ℹ️  Información adicional:
==================================================
📁 Nombre: APPDATA
🟢 Estado: ONLINE
🔄 Modelo de recuperación: SIMPLE
📈 Versión: 869

🔌 Conexión cerrada

⌨️  Presiona "X" y Enter para salir...
```
