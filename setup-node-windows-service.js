/**
 * Configurar PM2 como Servicio de Windows usando node-windows
 * AbmMcn - Sistema de Gestión de Bases de Datos
 */

const Service = require("node-windows").Service;
const path = require("path");

// Configuración del servicio
const svc = new Service({
  name: "AbmMcn-PM2",
  description:
    "AbmMcn - Sistema de Gestión de Bases de Datos - PM2 Process Manager",
  script: path.join(__dirname, "pm2-service.js"),
  nodeOptions: ["--max_old_space_size=2048"],
  env: [
    {
      name: "NODE_ENV",
      value: "production",
    },
    {
      name: "PM2_HOME",
      value: path.join(process.env.USERPROFILE, ".pm2"),
    },
  ],
});

// Eventos del servicio
svc.on("install", function () {
  console.log("✅ Servicio AbmMcn-PM2 instalado correctamente");
  console.log("🚀 Iniciando servicio...");
  svc.start();
});

svc.on("start", function () {
  console.log("✅ Servicio AbmMcn-PM2 iniciado correctamente");
  console.log("📋 Para gestionar el servicio:");
  console.log("   - Iniciar: svc.start()");
  console.log("   - Detener: svc.stop()");
  console.log("   - Desinstalar: svc.uninstall()");
  console.log("   - Ver estado: services.msc");
});

svc.on("stop", function () {
  console.log("⏹️ Servicio AbmMcn-PM2 detenido");
});

svc.on("uninstall", function () {
  console.log("🗑️ Servicio AbmMcn-PM2 desinstalado");
});

svc.on("error", function (err) {
  console.error("❌ Error en el servicio:", err);
});

// Función principal
function main() {
  const action = process.argv[2];

  console.log("🔧 Configurando PM2 como Servicio de Windows con node-windows");
  console.log("============================================================");

  switch (action) {
    case "install":
      console.log("📦 Instalando servicio...");
      svc.install();
      break;

    case "uninstall":
      console.log("🗑️ Desinstalando servicio...");
      svc.uninstall();
      break;

    case "start":
      console.log("🚀 Iniciando servicio...");
      svc.start();
      break;

    case "stop":
      console.log("⏹️ Deteniendo servicio...");
      svc.stop();
      break;

    case "restart":
      console.log("🔄 Reiniciando servicio...");
      svc.stop();
      setTimeout(() => {
        svc.start();
      }, 2000);
      break;

    default:
      console.log(
        "📋 Uso: node setup-node-windows-service.js [install|uninstall|start|stop|restart]"
      );
      console.log("");
      console.log("🔧 Comandos disponibles:");
      console.log("   install   - Instalar el servicio");
      console.log("   uninstall - Desinstalar el servicio");
      console.log("   start     - Iniciar el servicio");
      console.log("   stop      - Detener el servicio");
      console.log("   restart   - Reiniciar el servicio");
      break;
  }
}

// Ejecutar función principal
main();
