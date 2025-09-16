const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Iniciando servidor frontend...");

// Cambiar al directorio frontend
process.chdir(__dirname);

// Ejecutar npx serve
const serve = spawn("npx", ["serve", "-s", "dist", "-l", "5173"], {
  stdio: "inherit",
  shell: true,
  cwd: __dirname,
});

serve.on("error", (err) => {
  console.error("❌ Error iniciando servidor:", err);
});

serve.on("close", (code) => {
  console.log(`🔄 Servidor frontend terminado con código: ${code}`);
});

// Manejar cierre graceful
process.on("SIGINT", () => {
  console.log("🛑 Cerrando servidor frontend...");
  serve.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 Cerrando servidor frontend...");
  serve.kill("SIGTERM");
  process.exit(0);
});
