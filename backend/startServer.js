const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Iniciando servidor backend...");

// Verificar que estamos en el directorio correcto
const packageJsonPath = path.join(__dirname, "package.json");
const fs = require("fs");

if (!fs.existsSync(packageJsonPath)) {
  console.error("❌ No se encontró package.json en el directorio backend/");
  console.error(
    "💡 Asegúrate de ejecutar este script desde la carpeta backend/"
  );
  process.exit(1);
}

// Verificar que existe el archivo .env
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ No se encontró el archivo .env en el directorio backend/");
  console.error("💡 Crea el archivo .env basado en env.example");
  process.exit(1);
}

// Iniciar el servidor
const server = spawn("node", ["server.js"], {
  stdio: "inherit",
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
});

// Manejar eventos del proceso
server.on("error", (error) => {
  console.error("❌ Error iniciando el servidor:", error);
  process.exit(1);
});

server.on("close", (code) => {
  if (code !== 0) {
    console.error(`❌ El servidor se cerró con código ${code}`);
    process.exit(code);
  }
});

// Manejar señales de terminación
process.on("SIGINT", () => {
  console.log("\n🛑 Deteniendo servidor...");
  server.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Deteniendo servidor...");
  server.kill("SIGTERM");
});

console.log("✅ Servidor iniciado. Presiona Ctrl+C para detener.");
