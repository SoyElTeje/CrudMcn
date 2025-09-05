# 🏗️ Arquitectura del Sistema AbmMcn

## 📋 Visión General

AbmMcn es un sistema web de gestión de bases de datos SQL Server con arquitectura de microservicios, diseñado para operar en entornos de intranet con acceso mediante VPNs.

## 🎯 Principios de Diseño

- **Separación de responsabilidades**: Backend y Frontend completamente separados
- **Seguridad por capas**: Autenticación, autorización, validación y sanitización
- **Escalabilidad**: Pool de conexiones optimizado y arquitectura modular
- **Mantenibilidad**: Código limpio, tests automatizados y documentación completa
- **Observabilidad**: Logging estructurado y monitoreo en tiempo real

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   React App     │  │   TailwindCSS   │  │   ShadCN/UI  │ │
│  │   TypeScript    │  │   Responsive    │  │  Components  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/WSS
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Load Balancer │  │   SSL/TLS       │  │   Rate Limit │ │
│  │   (Nginx)       │  │   Termination   │  │   Protection │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Express.js    │  │   Middleware    │  │   Routes     │ │
│  │   Server        │  │   Stack         │  │   Handler    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Services      │  │   Controllers   │  │   Models     │ │
│  │   Layer         │  │   Layer         │  │   Layer      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ SQL/TCP
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   SQL Server    │  │   Connection    │  │   Multiple   │ │
│  │   Instance      │  │   Pool          │  │   Databases  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes del Sistema

### 1. **Frontend (React + TypeScript)**

#### Estructura de Componentes
```
src/
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes base (ShadCN/UI)
│   ├── forms/           # Formularios especializados
│   ├── tables/          # Tablas de datos
│   └── modals/          # Modales y diálogos
├── pages/               # Páginas principales
│   ├── Dashboard/       # Panel principal
│   ├── Auth/            # Autenticación
│   ├── Users/           # Gestión de usuarios
│   └── Data/            # Exploración de datos
├── hooks/               # Custom hooks
│   ├── useAuth.ts       # Hook de autenticación
│   ├── useApi.ts        # Hook de API calls
│   └── usePermissions.ts # Hook de permisos
├── services/            # Servicios de API
│   ├── api.ts           # Cliente HTTP
│   ├── auth.ts          # Servicio de autenticación
│   └── data.ts          # Servicio de datos
└── utils/               # Utilidades
    ├── dateUtils.ts     # Utilidades de fecha
    ├── validation.ts    # Validación frontend
    └── constants.ts     # Constantes
```

#### Tecnologías Frontend
- **React 18**: Framework principal con hooks y context
- **TypeScript**: Tipado estático para mayor robustez
- **TailwindCSS**: Framework CSS utility-first
- **ShadCN/UI**: Biblioteca de componentes
- **React Router**: Navegación SPA
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **Axios**: Cliente HTTP

### 2. **Backend (Node.js + Express)**

#### Arquitectura por Capas
```
backend/
├── config/              # Configuración
│   ├── database.js      # Pool de conexiones
│   ├── logger.js        # Winston logging
│   └── security.js      # Configuración de seguridad
├── middleware/          # Middlewares
│   ├── auth.js          # Autenticación JWT
│   ├── permissions.js   # Autorización granular
│   ├── validation.js    # Validación Joi
│   ├── sanitization.js  # Sanitización XSS/SQL
│   └── errorHandler.js  # Manejo global de errores
├── routes/              # Rutas de la API
│   ├── auth.js          # Autenticación
│   ├── health.js        # Health checks
│   └── logs.js          # Logs y auditoría
├── services/            # Lógica de negocio
│   ├── authService.js   # Servicio de autenticación
│   ├── permissionService.js # Servicio de permisos
│   └── excelService.js  # Servicio de Excel
└── utils/               # Utilidades
    ├── dateUtils.js     # Conversión de fechas
    └── queryBuilder.js  # Constructor de queries
```

#### Tecnologías Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **MSSQL**: Driver para SQL Server
- **JWT**: Autenticación stateless
- **Bcrypt**: Hash de contraseñas
- **Joi**: Validación de esquemas
- **Winston**: Logging estructurado
- **Helmet**: Headers de seguridad
- **Express Rate Limit**: Rate limiting
- **ExcelJS**: Manipulación de Excel

### 3. **Base de Datos (SQL Server)**

#### Estructura de Datos
```sql
-- Base de datos principal (APPDATA)
├── users                 # Usuarios del sistema
├── user_permissions      # Permisos granulares
├── activated_tables      # Tablas activadas
├── audit_logs           # Logs de auditoría
└── system_config        # Configuración del sistema

-- Bases de datos de aplicación
├── BD_ABM1              # Base de datos de ejemplo 1
├── BD_ABM2              # Base de datos de ejemplo 2
└── ...                  # Otras bases de datos
```

#### Pool de Conexiones
```javascript
// Configuración optimizada
const poolConfig = {
  max: 20,                    // Máximo de conexiones
  min: 5,                     // Mínimo de conexiones
  idleTimeoutMillis: 30000,   // Timeout de conexiones inactivas
  acquireTimeoutMillis: 60000, // Timeout de adquisición
  createTimeoutMillis: 30000,  // Timeout de creación
  destroyTimeoutMillis: 5000,  // Timeout de destrucción
  reapIntervalMillis: 1000,    // Intervalo de limpieza
  createRetryIntervalMillis: 200 // Intervalo de reintento
};
```

## 🔐 Seguridad

### 1. **Autenticación**
- **JWT Tokens**: Stateless authentication
- **Bcrypt**: Hash de contraseñas con salt
- **Session Management**: Tokens con expiración
- **Password Policy**: Validación de fortaleza

### 2. **Autorización**
- **Permisos Granulares**: Base de datos y tabla específica
- **Escalación de Permisos**: Tabla → Base de datos
- **Middleware de Autorización**: Verificación en cada request
- **Role-Based Access**: Administrador vs Usuario

### 3. **Validación y Sanitización**
- **Joi Schemas**: Validación de entrada
- **XSS Protection**: Sanitización de strings
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Validación de tipos y formatos

### 4. **Protección de Infraestructura**
- **Helmet**: Headers de seguridad HTTP
- **Rate Limiting**: Protección contra ataques
- **CORS**: Configuración de orígenes
- **HTTPS**: Encriptación en tránsito

## 📊 Flujo de Datos

### 1. **Flujo de Autenticación**
```
Cliente → Login Request → Validación → Verificación BD → JWT Token → Cliente
```

### 2. **Flujo de Autorización**
```
Request → JWT Verification → User Lookup → Permission Check → Route Handler
```

### 3. **Flujo de Datos**
```
Cliente → API Request → Validation → Authorization → Service → Database → Response
```

## 🔄 Patrones de Diseño

### 1. **Repository Pattern**
- Abstracción de acceso a datos
- Separación de lógica de negocio
- Facilita testing y mantenimiento

### 2. **Service Layer Pattern**
- Lógica de negocio centralizada
- Reutilización de código
- Separación de responsabilidades

### 3. **Middleware Pattern**
- Procesamiento de requests
- Funcionalidad transversal
- Composición de comportamiento

### 4. **Factory Pattern**
- Creación de objetos complejos
- Configuración dinámica
- Inyección de dependencias

## 🚀 Escalabilidad

### 1. **Horizontal Scaling**
- **Load Balancer**: Distribución de carga
- **Multiple Instances**: Múltiples procesos PM2
- **Database Sharding**: Particionamiento de datos

### 2. **Vertical Scaling**
- **Connection Pooling**: Optimización de conexiones
- **Caching**: Redis para datos frecuentes
- **Resource Optimization**: Optimización de memoria

### 3. **Performance Optimization**
- **Lazy Loading**: Carga bajo demanda
- **Pagination**: Paginación de resultados
- **Indexing**: Índices de base de datos
- **Query Optimization**: Optimización de queries

## 📈 Monitoreo y Observabilidad

### 1. **Logging**
- **Winston**: Logging estructurado
- **Log Levels**: Debug, Info, Warn, Error
- **Log Rotation**: Rotación automática
- **Centralized Logging**: Agregación de logs

### 2. **Health Checks**
- **Application Health**: Estado de la aplicación
- **Database Health**: Estado de conexiones
- **System Metrics**: Métricas del sistema
- **Dependency Health**: Estado de dependencias

### 3. **Metrics**
- **Performance Metrics**: Tiempo de respuesta
- **Business Metrics**: Operaciones por usuario
- **System Metrics**: CPU, memoria, disco
- **Error Metrics**: Tasa de errores

## 🔧 Configuración y Despliegue

### 1. **Entornos**
- **Development**: Desarrollo local
- **Staging**: Pruebas pre-producción
- **Production**: Producción

### 2. **Variables de Entorno**
- **Database**: Configuración de BD
- **Security**: Claves y secretos
- **Performance**: Parámetros de rendimiento
- **Monitoring**: Configuración de monitoreo

### 3. **PM2 Configuration**
- **Process Management**: Gestión de procesos
- **Auto Restart**: Reinicio automático
- **Load Balancing**: Balanceador de carga
- **Monitoring**: Monitoreo de procesos

## 🧪 Testing Strategy

### 1. **Unit Tests**
- **Services**: Lógica de negocio
- **Utilities**: Funciones auxiliares
- **Middleware**: Procesamiento de requests

### 2. **Integration Tests**
- **API Endpoints**: Endpoints completos
- **Database**: Operaciones de BD
- **Authentication**: Flujos de autenticación

### 3. **End-to-End Tests**
- **User Flows**: Flujos completos de usuario
- **Cross-Browser**: Compatibilidad de navegadores
- **Performance**: Tests de rendimiento

## 📚 Referencias

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [SQL Server Performance](https://docs.microsoft.com/en-us/sql/relational-databases/performance/)
- [React Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [JWT Security](https://tools.ietf.org/html/rfc7519)

---

_Última actualización: Diciembre 2024_  
_Versión: 1.0.0_
