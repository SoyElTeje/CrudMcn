const fs = require("fs");
const path = require("path");
require("dotenv").config();

console.log("🔍 VERIFICANDO CONFIGURACIÓN DE VARIABLES DE ENTORNO");
console.log("==================================================");
console.log("");

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  console.log("✅ Archivo .env encontrado");
} else {
  console.log("❌ Archivo .env NO encontrado");
  console.log("💡 Crea el archivo .env en la raíz del proyecto");
  console.log("");
  console.log("📝 Contenido del archivo .env:");
  console.log("DB_SERVER=TU_SERVIDOR_SQL_PRODUCCION");
  console.log("DB_PORT=1433");
  console.log("DB_USER=app_user");
  console.log("DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI");
  console.log("DB_DATABASE=APPDATA");
  console.log("PORT=3001");
  console.log("NODE_ENV=production");
  console.log("CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173");
  console.log(
    "JWT_SECRET=clave_super_secreta_y_muy_larga_para_produccion_cambiar_en_produccion"
  );
  console.log("JWT_EXPIRES_IN=24h");
  console.log("LOG_LEVEL=info");
  return;
}

console.log("");

// Verificar variables de entorno requeridas
const requiredVars = [
  "DB_SERVER",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_DATABASE",
];

const missingVars = [];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value.trim() !== "") {
    if (varName === "DB_PASSWORD") {
      console.log(`✅ ${varName}: ${"*".repeat(Math.min(value.length, 8))}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADO`);
    missingVars.push(varName);
  }
});

console.log("");

// Verificar variables opcionales
const optionalVars = [
  "PORT",
  "NODE_ENV",
  "CORS_ORIGIN",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "LOG_LEVEL",
];

console.log("📋 Variables opcionales:");
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value.trim() !== "") {
    if (varName === "JWT_SECRET") {
      console.log(`✅ ${varName}: ${"*".repeat(Math.min(value.length, 8))}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`⚠️  ${varName}: NO CONFIGURADO (usando valor por defecto)`);
  }
});

console.log("");

// Mostrar resumen
if (missingVars.length === 0) {
  console.log(
    "🎉 Todas las variables requeridas están configuradas correctamente!"
  );
  console.log("");
  console.log("📝 Próximos pasos:");
  console.log("1. Verifica que el nombre del servidor SQL sea correcto");
  console.log("2. Verifica que la contraseña sea correcta");
  console.log("3. Ejecuta: node setup_production_app.js");
} else {
  console.log("❌ Variables faltantes:");
  missingVars.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log("");
  console.log(
    "💡 Configura estas variables en el archivo .env y vuelve a ejecutar este script"
  );
}

console.log("");
console.log("🔍 Ruta del archivo .env:", envPath);
console.log("🔍 Directorio actual:", __dirname);
























