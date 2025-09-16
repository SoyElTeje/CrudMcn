import { spawn } from "child_process";

console.log("🚀 Iniciando servidor frontend...");

const serve = spawn("npx", ["serve", "-s", "dist", "-l", "5173"], {
  stdio: "inherit",
  shell: true,
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
