// Configuración de bases de datos permitidas para app_user
const ALLOWED_DATABASES = [
  "APPDATA", // Base de datos de la aplicación
  "BI_Editor", // Base de datos de trabajo
];

// Función para verificar si una base de datos está permitida
function isDatabaseAllowed(databaseName) {
  return ALLOWED_DATABASES.includes(databaseName);
}

// Función para obtener todas las bases de datos permitidas
function getAllowedDatabases() {
  return ALLOWED_DATABASES;
}

module.exports = {
  ALLOWED_DATABASES,
  isDatabaseAllowed,
  getAllowedDatabases,
};




