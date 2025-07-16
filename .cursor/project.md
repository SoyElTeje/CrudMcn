# 📄 Descripción del Proyecto: Sistema ABM Web con React y Node.js

## 🎯 Objetivo General

Desarrollar una aplicación web moderna para la **gestión de mantenimiento (ABM)** de tablas existentes en servidores SQL Server dentro de una red local (LAN). La aplicación tendrá una **interfaz limpia y rápida**, accesible desde cualquier dispositivo dentro de la red, con un **backend robusto** que maneje la lógica de negocio, las validaciones, y la seguridad de acceso.

---

## 📌 Funcionalidades Principales

- **Login de usuarios con control de acceso** mediante roles (Administrador y Usuario).
- **Pantalla de selección dinámica** que muestre las bases de datos y las tablas disponibles dentro del servidor SQL Server.
- **Pantallas ABM genéricas** para visualizar registros, agregar, editar y eliminar registros de las tablas habilitadas.
- **Validaciones de campos configurables**, que serán gestionadas desde el backend, evitando registros inválidos.
- **Paginación y filtrado eficiente**, soportando tablas con grandes volúmenes de datos sin afectar la performance.
- **Carga de datos desde archivos Excel** con previsualización y validaciones antes de insertar en la base de datos.
- **Exportación de registros a Excel**, respetando los filtros aplicados en la vista.
- **Sistema de auditoría**, registrando operaciones realizadas por los usuarios: qué datos modificaron, qué tablas tocaron y cuándo lo hicieron.
- **Gestión de usuarios y permisos por parte del administrador**.
- La aplicación deberá ser **accesible vía navegador** desde cualquier equipo dentro de la red local.

---

## 📌 Arquitectura del Proyecto

El sistema estará dividido en dos componentes principales:

### 🟣 Backend API REST

- Desarrollado en **Node.js** con **Express**.
- Conexión a SQL Server mediante la librería `mssql`.
- Manejo de autenticación mediante JWT.
- Control de roles (Administrador y Usuario).
- Endpoints para consultar metadatos del SQL Server (bases de datos, tablas y campos).
- Endpoints CRUD genéricos para manejar las operaciones sobre las tablas seleccionadas.
- Endpoints específicos para importar/exportar datos en formato Excel.
- Sistema de logging y auditoría persistente en base de datos.
- Lógica de validación previa a operaciones de inserción o edición.
- La API REST se ejecutará en un servidor Windows (con Node corriendo como servicio en segundo plano).

### 🟣 Frontend Web

- Desarrollado con **React** y **TypeScript**.
- Uso de **ShadCN/UI** para una interfaz moderna, responsiva y rápida.
- React Router para el enrutamiento entre vistas.
- Axios para consumo de la API REST.
- Validaciones básicas desde el frontend para mejor experiencia de usuario.
- Visualización de datos en tablas con paginación, filtros y formularios dinámicos para las operaciones ABM.
- Interfaz específica para carga y descarga de archivos Excel.
- Todo el frontend será compilado y servido como archivos estáticos.

---

## 📌 Hosting y Entorno de Ejecución

- La aplicación web se desplegará en una **máquina Windows Server 2022** conectada a la red local.
- El frontend React se servirá desde **IIS (Internet Information Services)** configurado para servir archivos estáticos y actuar como **reverse proxy** hacia el backend Node.js.
- La API REST será expuesta bajo rutas específicas (ejemplo: `/api/`) y se comunicará directamente con el servidor SQL Server.
- Todo el tráfico será manejado mediante IIS, simplificando el acceso desde la red LAN.
- Opcionalmente, se podrá configurar acceso HTTPS mediante IIS si se desea mayor seguridad dentro de la red.

---

## 📌 Tecnologías a Utilizar

### Backend:

- Node.js + Express
- mssql (conexión SQL Server)
- jsonwebtoken (autenticación JWT)
- bcrypt (hash de contraseñas)
- multer + xlsx (importación de Excel)
- exceljs (exportación a Excel)
- winston o pino (logging)

### Frontend:

- React + TypeScript
- ShadCN/UI (con TailwindCSS)
- react-router-dom
- react-hook-form + zod (formularios y validaciones)
- axios (peticiones HTTP)

### Infraestructura:

- IIS en Windows Server 2022 (hosting LAN)
- SQL Server como base de datos principal

# Reglas de formato

- Usaremos camel case
