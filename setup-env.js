#!/usr/bin/env node

/**
 * Script para configurar automáticamente el archivo .env
 * Uso: node setup-env.js [environment]
 *
 * Ejemplos:
 * node setup-env.js development
 * node setup-env.js production
 * node setup-env.js staging
 * node setup-env.js local
 */

const fs = require("fs");
const path = require("path");

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  const environment = process.argv[2] || "development";
  const component = process.argv[3] || "both"; // backend, frontend, both

  log("\n🔧 Configurador de Entornos - AbmMcn", "cyan");
  log("=====================================", "cyan");

  // Validar entorno
  const validEnvironments = ["development", "production", "staging", "local"];
  if (!validEnvironments.includes(environment)) {
    log(`❌ Error: Entorno '${environment}' no válido.`, "red");
    log(`Entornos válidos: ${validEnvironments.join(", ")}`, "yellow");
    process.exit(1);
  }

  // Validar componente
  const validComponents = ["backend", "frontend", "both"];
  if (!validComponents.includes(component)) {
    log(`❌ Error: Componente '${component}' no válido.`, "red");
    log(`Componentes válidos: ${validComponents.join(", ")}`, "yellow");
    process.exit(1);
  }

  log(`🎯 Configurando entorno: ${environment}`, "blue");
  log(`📦 Componente: ${component}`, "blue");

  try {
    if (component === "backend" || component === "both") {
      setupBackendEnv(environment);
    }

    if (component === "frontend" || component === "both") {
      setupFrontendEnv(environment);
    }

    // Advertencias específicas por entorno
    if (environment === "production") {
      log("\n⚠️  IMPORTANTE PARA PRODUCCIÓN:", "yellow");
      log("1. Configura las credenciales reales de la base de datos", "yellow");
      log("2. Cambia las IPs del servidor en CORS_ORIGIN", "yellow");
      log("3. Genera un JWT_SECRET único y fuerte", "yellow");
      log("4. Configura VITE_CURRENT_IP con la IP real del servidor", "yellow");
    }

    log("\n🚀 Configuración completada!", "green");
    log(
      "Puedes ahora ejecutar la aplicación con el entorno configurado.",
      "green"
    );
  } catch (error) {
    log(`❌ Error al configurar el entorno: ${error.message}`, "red");
    process.exit(1);
  }
}

function setupBackendEnv(environment) {
  const templateFile = `backend/env.${environment}`;
  const targetFile = "backend/.env";

  log(`\n🔧 Configurando Backend...`, "cyan");

  // Verificar que existe el archivo template
  if (!fs.existsSync(templateFile)) {
    log(
      `❌ Error: No se encontró el archivo template '${templateFile}'`,
      "red"
    );
    throw new Error(`Template backend no encontrado: ${templateFile}`);
  }

  // Verificar si ya existe .env
  if (fs.existsSync(targetFile)) {
    log(`⚠️  El archivo '${targetFile}' ya existe.`, "yellow");
    log("Sobrescribiendo...", "yellow");
  }

  // Copiar el archivo template
  fs.copyFileSync(templateFile, targetFile);

  log(`✅ Backend configurado: ${targetFile}`, "green");
  log(`📁 Template usado: ${templateFile}`, "blue");

  // Mostrar variables importantes (sin valores sensibles)
  const envContent = fs.readFileSync(targetFile, "utf8");
  const lines = envContent.split("\n");

  log("📋 Variables del Backend:", "cyan");
  lines.forEach((line) => {
    if (line.trim() && !line.startsWith("#") && line.includes("=")) {
      const [key] = line.split("=");
      if (key && key.trim()) {
        log(`  • ${key.trim()}`, "blue");
      }
    }
  });
}

function setupFrontendEnv(environment) {
  const templateFile = `frontend/env.${environment}`;
  const targetFile = "frontend/.env";

  log(`\n🔧 Configurando Frontend...`, "cyan");

  // Verificar que existe el archivo template
  if (!fs.existsSync(templateFile)) {
    log(
      `❌ Error: No se encontró el archivo template '${templateFile}'`,
      "red"
    );
    throw new Error(`Template frontend no encontrado: ${templateFile}`);
  }

  // Verificar si ya existe .env
  if (fs.existsSync(targetFile)) {
    log(`⚠️  El archivo '${targetFile}' ya existe.`, "yellow");
    log("Sobrescribiendo...", "yellow");
  }

  // Copiar el archivo template
  fs.copyFileSync(templateFile, targetFile);

  log(`✅ Frontend configurado: ${targetFile}`, "green");
  log(`📁 Template usado: ${templateFile}`, "blue");

  // Mostrar variables importantes (sin valores sensibles)
  const envContent = fs.readFileSync(targetFile, "utf8");
  const lines = envContent.split("\n");

  log("📋 Variables del Frontend:", "cyan");
  lines.forEach((line) => {
    if (line.trim() && !line.startsWith("#") && line.includes("=")) {
      const [key] = line.split("=");
      if (key && key.trim()) {
        log(`  • ${key.trim()}`, "blue");
      }
    }
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
