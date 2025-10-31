/**
 * Script de servicio PM2 para node-windows
 * AbmMcn - Sistema de Gestión de Bases de Datos
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuración
const PROJECT_DIR = __dirname;
const LOG_DIR = path.join(PROJECT_DIR, "logs");
const ECOSYSTEM_FILE = path.join(PROJECT_DIR, "ecosystem.config.js");

// Crear directorio de logs si no existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Función para escribir logs
function writeLog(message, type = "INFO") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}\n`;

  console.log(logMessage.trim());

  // Escribir a archivo de log
  const logFile = path.join(LOG_DIR, `pm2-service-${type.toLowerCase()}.log`);
  fs.appendFileSync(logFile, logMessage);
}

// Función para ejecutar comando
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    writeLog(`Ejecutando: ${command} ${args.join(" ")}`);

    // Configurar PATH para incluir npm global
    const env = {
      ...process.env,
      PATH: process.env.PATH + ";" + process.env.APPDATA + "\\npm",
      NODE_PATH: process.env.APPDATA + "\\npm\\node_modules",
    };

    const child = spawn(command, args, {
      cwd: PROJECT_DIR,
      stdio: ["pipe", "pipe", "pipe"],
      env: env,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      writeLog(data.toString().trim(), "STDOUT");
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      writeLog(data.toString().trim(), "STDERR");
    });

    child.on("close", (code) => {
      if (code === 0) {
        writeLog(`Comando completado exitosamente: ${command}`);
        resolve({ code, stdout, stderr });
      } else {
        writeLog(`Comando falló con código ${code}: ${command}`, "ERROR");
        reject(new Error(`Comando falló con código ${code}: ${stderr}`));
      }
    });

    child.on("error", (error) => {
      writeLog(`Error ejecutando comando: ${error.message}`, "ERROR");
      reject(error);
    });
  });
}

// Función para obtener la ruta de PM2
function getPM2Path() {
  const possiblePaths = [
    "pm2", // PATH normal
    path.join(process.env.APPDATA, "npm", "pm2.cmd"), // Windows npm global
    path.join(process.env.APPDATA, "npm", "pm2"), // Windows npm global sin .cmd
    path.join(process.env.PROGRAMFILES, "nodejs", "pm2.cmd"), // Node.js instalación
    "C:\\Program Files\\nodejs\\pm2.cmd", // Ruta fija común
  ];

  // Verificar cuál existe
  for (const pm2Path of possiblePaths) {
    try {
      if (fs.existsSync(pm2Path) || pm2Path === "pm2") {
        writeLog(`PM2 encontrado en: ${pm2Path}`);
        return pm2Path;
      }
    } catch (error) {
      // Continuar con la siguiente ruta
    }
  }

  writeLog("PM2 no encontrado en ninguna ruta conocida", "ERROR");
  return "pm2"; // Fallback
}

// Función para verificar si PM2 está funcionando
async function checkPM2Status() {
  try {
    const pm2Path = getPM2Path();
    await runCommand(pm2Path, ["ping"]);
    return true;
  } catch (error) {
    return false;
  }
}

// Función para iniciar PM2
async function startPM2() {
  try {
    writeLog("Iniciando PM2...");

    // Verificar si PM2 ya está corriendo
    const isRunning = await checkPM2Status();
    if (isRunning) {
      writeLog("PM2 ya está ejecutándose");
      return;
    }

    // Iniciar PM2 con ecosystem
    const pm2Path = getPM2Path();
    await runCommand(pm2Path, [
      "start",
      "ecosystem.config.js",
      "--env",
      "production",
    ]);

    // Guardar configuración
    await runCommand(pm2Path, ["save"]);

    writeLog("PM2 iniciado correctamente");

    // Verificar aplicaciones
    await runCommand(pm2Path, ["list"]);
  } catch (error) {
    writeLog(`Error iniciando PM2: ${error.message}`, "ERROR");
    throw error;
  }
}

// Función para detener PM2
async function stopPM2() {
  try {
    writeLog("Deteniendo PM2...");

    // Detener todas las aplicaciones
    const pm2Path = getPM2Path();
    await runCommand(pm2Path, ["stop", "all"]);

    // Matar PM2 daemon
    await runCommand(pm2Path, ["kill"]);

    writeLog("PM2 detenido correctamente");
  } catch (error) {
    writeLog(`Error deteniendo PM2: ${error.message}`, "ERROR");
    throw error;
  }
}

// Función para reiniciar PM2
async function restartPM2() {
  try {
    writeLog("Reiniciando PM2...");

    // Reiniciar todas las aplicaciones
    const pm2Path = getPM2Path();
    await runCommand(pm2Path, ["restart", "all"]);

    writeLog("PM2 reiniciado correctamente");
  } catch (error) {
    writeLog(`Error reiniciando PM2: ${error.message}`, "ERROR");
    throw error;
  }
}

// Función para verificar estado
async function checkStatus() {
  try {
    writeLog("Verificando estado de PM2...");

    const isRunning = await checkPM2Status();
    if (isRunning) {
      const pm2Path = getPM2Path();
      await runCommand(pm2Path, ["list"]);
      writeLog("PM2 está funcionando correctamente");
    } else {
      writeLog("PM2 no está funcionando", "WARNING");
    }
  } catch (error) {
    writeLog(`Error verificando estado: ${error.message}`, "ERROR");
  }
}

// Función principal del servicio
async function main() {
  writeLog("🚀 Iniciando servicio PM2 para AbmMcn");
  writeLog(`📁 Directorio del proyecto: ${PROJECT_DIR}`);
  writeLog(`📁 Directorio de logs: ${LOG_DIR}`);

  try {
    // Iniciar PM2
    await startPM2();

    // Verificar estado cada 30 segundos
    setInterval(async () => {
      try {
        await checkStatus();
      } catch (error) {
        writeLog(`Error en verificación periódica: ${error.message}`, "ERROR");
      }
    }, 30000);

    writeLog("✅ Servicio PM2 iniciado correctamente");
  } catch (error) {
    writeLog(`❌ Error crítico en el servicio: ${error.message}`, "ERROR");
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on("SIGTERM", async () => {
  writeLog("📡 Recibida señal SIGTERM, deteniendo servicio...");
  try {
    await stopPM2();
    writeLog("✅ Servicio detenido correctamente");
    process.exit(0);
  } catch (error) {
    writeLog(`❌ Error deteniendo servicio: ${error.message}`, "ERROR");
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  writeLog("📡 Recibida señal SIGINT, deteniendo servicio...");
  try {
    await stopPM2();
    writeLog("✅ Servicio detenido correctamente");
    process.exit(0);
  } catch (error) {
    writeLog(`❌ Error deteniendo servicio: ${error.message}`, "ERROR");
    process.exit(1);
  }
});

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  writeLog(`❌ Error no capturado: ${error.message}`, "ERROR");
  writeLog(`Stack trace: ${error.stack}`, "ERROR");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  writeLog(`❌ Promesa rechazada no manejada: ${reason}`, "ERROR");
  process.exit(1);
});

// Iniciar el servicio
main().catch((error) => {
  writeLog(`❌ Error fatal: ${error.message}`, "ERROR");
  process.exit(1);
});
