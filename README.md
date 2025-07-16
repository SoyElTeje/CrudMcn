# AbmMcn - Sistema ABM Web

Sistema de Alta, Baja y Modificación (ABM) web para gestionar múltiples bases de datos SQL Server con interfaz moderna.

## 🚀 Características

- **Visualización de datos**: Interfaz web para explorar bases de datos y tablas
- **Múltiples bases de datos**: Soporte para conectar a varias bases de datos SQL Server
- **Interfaz moderna**: Diseño responsive con TailwindCSS y ShadCN/UI
- **Arquitectura escalable**: Backend Node.js + Frontend React con TypeScript

## 📋 Prerrequisitos

- Node.js 18+ 
- SQL Server (local o remoto)
- Git

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd AbmMcn
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar las variables según tu configuración
nano .env
```

### 3. Instalar dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Configurar base de datos
- Asegúrate de que SQL Server esté ejecutándose
- Configura las credenciales en el archivo `.env`
- Opcional: Usa Docker para desarrollo local

## 🚀 Ejecución

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Producción
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
```

## 🌐 URLs

- **Frontend**: http://localhost:5173 (o 5174)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📁 Estructura del Proyecto

```
AbmMcn/
├── backend/           # Servidor Node.js + Express
├── frontend/          # Aplicación React + TypeScript
├── docker-compose.yml # Configuración Docker para SQL Server
├── setupTestDbs.sql  # Script de datos de prueba
└── env.example       # Variables de entorno de ejemplo
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Base de datos
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=simpleDev!
DB_DATABASE=APPDATA

# Configuración de prueba
TRIAL_DB=BD_ABM1
TRIAL_TABLE=Maquinas

# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 📊 Uso

1. **Seleccionar base de datos**: Elige la base de datos desde el dropdown
2. **Seleccionar tabla**: Elige la tabla que quieres visualizar
3. **Explorar datos**: Los datos se mostrarán en una tabla interactiva
4. **Navegar**: Cambia entre diferentes bases de datos y tablas

## 🔮 Próximas Funcionalidades

- [ ] Autenticación JWT
- [ ] Operaciones CRUD (Crear, Editar, Eliminar)
- [ ] Importación/Exportación Excel
- [ ] Sistema de auditoría
- [ ] Gestión de usuarios

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.
