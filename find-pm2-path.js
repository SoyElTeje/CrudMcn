/**
 * Script para encontrar la ruta de PM2 en Windows
 * AbmMcn - Sistema de Gestión de Bases de Datos
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Buscando ruta de PM2 en Windows...");
console.log("=====================================");

// Rutas posibles donde puede estar PM2
const possiblePaths = [
  "pm2", // PATH normal
  path.join(process.env.APPDATA, "npm", "pm2.cmd"), // Windows npm global
  path.join(process.env.APPDATA, "npm", "pm2"), // Windows npm global sin .cmd
  path.join(process.env.PROGRAMFILES, "nodejs", "pm2.cmd"), // Node.js instalación
  "C:\\Program Files\\nodejs\\pm2.cmd", // Ruta fija común
  "C:\\Program Files (x86)\\nodejs\\pm2.cmd", // Ruta fija 32-bit
  path.join(process.env.LOCALAPPDATA, "npm", "pm2.cmd"), // npm local
];

console.log("📋 Verificando rutas posibles:");
console.log("");

let foundPaths = [];

for (const pm2Path of possiblePaths) {
  try {
    if (pm2Path === "pm2") {
      // Verificar si pm2 está en PATH
      try {
        execSync("pm2 --version", { stdio: "pipe" });
        console.log(`✅ ${pm2Path} - Encontrado en PATH`);
        foundPaths.push(pm2Path);
      } catch (error) {
        console.log(`❌ ${pm2Path} - No encontrado en PATH`);
      }
    } else {
      if (fs.existsSync(pm2Path)) {
        console.log(`✅ ${pm2Path} - Archivo existe`);
        foundPaths.push(pm2Path);
      } else {
        console.log(`❌ ${pm2Path} - Archivo no existe`);
      }
    }
  } catch (error) {
    console.log(`❌ ${pm2Path} - Error verificando`);
  }
}

console.log("");
console.log("📊 Información del sistema:");
console.log(`APPDATA: ${process.env.APPDATA}`);
console.log(`PROGRAMFILES: ${process.env.PROGRAMFILES}`);
console.log(`LOCALAPPDATA: ${process.env.LOCALAPPDATA}`);
console.log(`PATH: ${process.env.PATH}`);

console.log("");
console.log("🔍 Verificando instalación de npm global:");
try {
  const npmGlobalPath = execSync("npm config get prefix", {
    encoding: "utf8",
  }).trim();
  console.log(`npm global path: ${npmGlobalPath}`);

  const pm2GlobalPath = path.join(npmGlobalPath, "pm2.cmd");
  if (fs.existsSync(pm2GlobalPath)) {
    console.log(`✅ PM2 encontrado en: ${pm2GlobalPath}`);
    foundPaths.push(pm2GlobalPath);
  } else {
    console.log(`❌ PM2 no encontrado en: ${pm2GlobalPath}`);
  }
} catch (error) {
  console.log(`❌ Error obteniendo configuración de npm: ${error.message}`);
}

console.log("");
console.log("🎯 Rutas encontradas:");
if (foundPaths.length > 0) {
  foundPaths.forEach((path, index) => {
    console.log(`${index + 1}. ${path}`);
  });

  console.log("");
  console.log("💡 Recomendación:");
  console.log(`Usar: ${foundPaths[0]}`);
} else {
  console.log("❌ No se encontró PM2 en ninguna ruta");
  console.log("");
  console.log("🔧 Soluciones:");
  console.log("1. Reinstalar PM2: npm install -g pm2");
  console.log("2. Verificar PATH de npm: npm config get prefix");
  console.log("3. Agregar ruta de npm al PATH del sistema");
}

console.log("");
console.log("🔧 Comando para verificar PM2:");
console.log("pm2 --version");
