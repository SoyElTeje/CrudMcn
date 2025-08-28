const fs = require("fs");
const path = require("path");

console.log("🔧 Verificando configuración de JWT_SECRET...");

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, "..", "env.example");

if (!fs.existsSync(envPath)) {
  console.log("📝 Archivo .env no encontrado, creando desde env.example...");

  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, "utf8");
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Archivo .env creado exitosamente");
  } else {
    console.log("❌ Archivo env.example no encontrado");
    process.exit(1);
  }
} else {
  console.log("✅ Archivo .env ya existe");
}

// Verificar contenido del archivo .env
const envContent = fs.readFileSync(envPath, "utf8");
const lines = envContent.split("\n");

// Buscar JWT_SECRET
let jwtSecretLine = lines.find((line) => line.startsWith("JWT_SECRET="));
if (!jwtSecretLine) {
  console.log("❌ JWT_SECRET no encontrado en .env");
  console.log("📝 Agregando JWT_SECRET...");

  // Agregar JWT_SECRET al final del archivo
  const newJwtSecretLine = "JWT_SECRET=your-super-secret-jwt-key-here";
  fs.appendFileSync(envPath, "\n" + newJwtSecretLine);
  console.log("✅ JWT_SECRET agregado al archivo .env");
} else {
  console.log("✅ JWT_SECRET encontrado en .env");
  console.log("🔍 Valor actual:", jwtSecretLine);
}

// Verificar que dotenv puede cargar las variables
require("dotenv").config();
console.log(
  "🔍 JWT_SECRET desde process.env:",
  process.env.JWT_SECRET || "NO CONFIGURADO"
);

console.log("✅ Verificación completada");
