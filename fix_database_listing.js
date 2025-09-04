const fs = require("fs");
const path = require("path");

// Función para modificar el archivo server.js
function fixServerJs() {
  const serverPath = path.join(__dirname, "backend", "server.js");

  console.log(
    "🔧 Modificando server.js para restringir listado de bases de datos..."
  );

  try {
    let content = fs.readFileSync(serverPath, "utf8");

    // Buscar y reemplazar la consulta que lista todas las bases de datos
    const oldQuery = `"SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')"`;
    const newQuery = `"SELECT name FROM sys.databases WHERE name IN ('APPDATA', 'BI_Editor')"`;

    if (content.includes(oldQuery)) {
      content = content.replace(oldQuery, newQuery);
      fs.writeFileSync(serverPath, content, "utf8");
      console.log("✅ server.js modificado exitosamente");
    } else {
      console.log("⚠️ No se encontró la consulta original en server.js");
    }
  } catch (error) {
    console.error("❌ Error modificando server.js:", error.message);
  }
}

// Función para modificar el archivo activatedTablesService.js
function fixActivatedTablesService() {
  const servicePath = path.join(
    __dirname,
    "backend",
    "services",
    "activatedTablesService.js"
  );

  console.log("🔧 Modificando activatedTablesService.js...");

  try {
    let content = fs.readFileSync(servicePath, "utf8");

    // Buscar y reemplazar la consulta getAllDatabases
    const oldQuery = `SELECT name as DatabaseName
        FROM sys.databases 
        WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb', 'APPDATA')
        AND state = 0 -- Online databases only
        ORDER BY name`;

    const newQuery = `SELECT name as DatabaseName
        FROM sys.databases 
        WHERE name IN ('BI_Editor')
        AND state = 0 -- Online databases only
        ORDER BY name`;

    if (content.includes(oldQuery)) {
      content = content.replace(oldQuery, newQuery);
      fs.writeFileSync(servicePath, content, "utf8");
      console.log("✅ activatedTablesService.js modificado exitosamente");
    } else {
      console.log(
        "⚠️ No se encontró la consulta original en activatedTablesService.js"
      );
    }
  } catch (error) {
    console.error(
      "❌ Error modificando activatedTablesService.js:",
      error.message
    );
  }
}

// Función para crear un archivo de configuración de bases de datos permitidas
function createDatabaseConfig() {
  const configPath = path.join(
    __dirname,
    "backend",
    "config",
    "allowedDatabases.js"
  );

  console.log(
    "🔧 Creando archivo de configuración de bases de datos permitidas..."
  );

  try {
    // Crear directorio config si no existe
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const configContent = `// Configuración de bases de datos permitidas para app_user
const ALLOWED_DATABASES = [
  'APPDATA',    // Base de datos de la aplicación
  'BI_Editor'   // Base de datos de trabajo
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
  getAllowedDatabases
};
`;

    fs.writeFileSync(configPath, configContent, "utf8");
    console.log("✅ Archivo de configuración creado exitosamente");
  } catch (error) {
    console.error("❌ Error creando archivo de configuración:", error.message);
  }
}

// Función principal
function main() {
  console.log("🚀 Iniciando corrección de listado de bases de datos...\n");

  fixServerJs();
  fixActivatedTablesService();
  createDatabaseConfig();

  console.log("\n🎉 Corrección completada!");
  console.log("\n📋 Resumen de cambios:");
  console.log("- ✅ server.js: Solo lista APPDATA y BI_Editor");
  console.log(
    "- ✅ activatedTablesService.js: Solo lista BI_Editor (excluye APPDATA)"
  );
  console.log(
    "- ✅ config/allowedDatabases.js: Archivo de configuración creado"
  );
  console.log(
    "\n🔄 Próximo paso: Reiniciar el backend para aplicar los cambios"
  );
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  fixServerJs,
  fixActivatedTablesService,
  createDatabaseConfig,
};
