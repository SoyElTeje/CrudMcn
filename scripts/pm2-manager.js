/**
 * Gestor de PM2 con funcionalidades avanzadas
 * Proporciona comandos para gestión, monitoreo y deployment
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class PM2Manager {
  constructor() {
    this.ecosystemFile = path.join(__dirname, "../ecosystem.config.js");
    this.logsDir = path.join(__dirname, "../logs");
    this.ensureLogsDirectory();
  }

  /**
   * Asegura que el directorio de logs existe
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      console.log("✅ Directorio de logs creado:", this.logsDir);
    }
  }

  /**
   * Ejecuta un comando PM2
   * @param {string} command - Comando PM2 a ejecutar
   * @param {Array} args - Argumentos adicionales
   * @returns {string} Salida del comando
   */
  executePM2Command(command, args = []) {
    try {
      const fullCommand = `pm2 ${command} ${args.join(" ")}`;
      console.log(`🔧 Ejecutando: ${fullCommand}`);
      
      const output = execSync(fullCommand, { 
        encoding: "utf8",
        stdio: "pipe"
      });
      
      return output;
    } catch (error) {
      console.error(`❌ Error ejecutando comando PM2: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicia las aplicaciones
   * @param {string} environment - Ambiente (development, staging, production)
   */
  start(environment = "development") {
    console.log(`🚀 Iniciando aplicaciones en modo ${environment}...`);
    
    try {
      this.executePM2Command("start", [this.ecosystemFile, `--env ${environment}`]);
      console.log("✅ Aplicaciones iniciadas exitosamente");
      
      // Mostrar estado después de iniciar
      setTimeout(() => this.status(), 2000);
    } catch (error) {
      console.error("❌ Error iniciando aplicaciones:", error.message);
      throw error;
    }
  }

  /**
   * Detiene las aplicaciones
   */
  stop() {
    console.log("🛑 Deteniendo aplicaciones...");
    
    try {
      this.executePM2Command("stop", ["all"]);
      console.log("✅ Aplicaciones detenidas exitosamente");
    } catch (error) {
      console.error("❌ Error deteniendo aplicaciones:", error.message);
      throw error;
    }
  }

  /**
   * Reinicia las aplicaciones
   * @param {string} environment - Ambiente
   */
  restart(environment = "development") {
    console.log(`🔄 Reiniciando aplicaciones en modo ${environment}...`);
    
    try {
      this.executePM2Command("restart", [this.ecosystemFile, `--env ${environment}`]);
      console.log("✅ Aplicaciones reiniciadas exitosamente");
      
      // Mostrar estado después de reiniciar
      setTimeout(() => this.status(), 2000);
    } catch (error) {
      console.error("❌ Error reiniciando aplicaciones:", error.message);
      throw error;
    }
  }

  /**
   * Recarga las aplicaciones (zero-downtime)
   * @param {string} environment - Ambiente
   */
  reload(environment = "development") {
    console.log(`🔄 Recargando aplicaciones en modo ${environment}...`);
    
    try {
      this.executePM2Command("reload", [this.ecosystemFile, `--env ${environment}`]);
      console.log("✅ Aplicaciones recargadas exitosamente");
      
      // Mostrar estado después de recargar
      setTimeout(() => this.status(), 2000);
    } catch (error) {
      console.error("❌ Error recargando aplicaciones:", error.message);
      throw error;
    }
  }

  /**
   * Muestra el estado de las aplicaciones
   */
  status() {
    console.log("📊 Estado de las aplicaciones:");
    console.log("=" .repeat(50));
    
    try {
      const output = this.executePM2Command("status");
      console.log(output);
    } catch (error) {
      console.error("❌ Error obteniendo estado:", error.message);
    }
  }

  /**
   * Muestra los logs en tiempo real
   * @param {string} appName - Nombre de la aplicación (opcional)
   * @param {number} lines - Número de líneas a mostrar
   */
  logs(appName = null, lines = 100) {
    const args = appName ? [appName, "--lines", lines] : ["--lines", lines];
    
    console.log(`📋 Mostrando logs${appName ? ` para ${appName}` : " (todas las apps)"}...`);
    console.log("Presiona Ctrl+C para salir");
    
    try {
      const child = spawn("pm2", ["logs", ...args], { stdio: "inherit" });
      
      child.on("error", (error) => {
        console.error("❌ Error mostrando logs:", error.message);
      });
      
      return child;
    } catch (error) {
      console.error("❌ Error mostrando logs:", error.message);
      throw error;
    }
  }

  /**
   * Muestra información detallada de una aplicación
   * @param {string} appName - Nombre de la aplicación
   */
  info(appName) {
    console.log(`ℹ️ Información detallada de ${appName}:`);
    console.log("=" .repeat(50));
    
    try {
      const output = this.executePM2Command("show", [appName]);
      console.log(output);
    } catch (error) {
      console.error("❌ Error obteniendo información:", error.message);
    }
  }

  /**
   * Monitorea las aplicaciones
   */
  monitor() {
    console.log("📊 Iniciando monitor de PM2...");
    console.log("Presiona Ctrl+C para salir");
    
    try {
      const child = spawn("pm2", ["monit"], { stdio: "inherit" });
      
      child.on("error", (error) => {
        console.error("❌ Error iniciando monitor:", error.message);
      });
      
      return child;
    } catch (error) {
      console.error("❌ Error iniciando monitor:", error.message);
      throw error;
    }
  }

  /**
   * Limpia los logs
   */
  flush() {
    console.log("🧹 Limpiando logs...");
    
    try {
      this.executePM2Command("flush");
      console.log("✅ Logs limpiados exitosamente");
    } catch (error) {
      console.error("❌ Error limpiando logs:", error.message);
      throw error;
    }
  }

  /**
   * Elimina todas las aplicaciones
   */
  delete() {
    console.log("🗑️ Eliminando todas las aplicaciones...");
    
    try {
      this.executePM2Command("delete", ["all"]);
      console.log("✅ Aplicaciones eliminadas exitosamente");
    } catch (error) {
      console.error("❌ Error eliminando aplicaciones:", error.message);
      throw error;
    }
  }

  /**
   * Guarda la configuración actual
   */
  save() {
    console.log("💾 Guardando configuración actual...");
    
    try {
      this.executePM2Command("save");
      console.log("✅ Configuración guardada exitosamente");
    } catch (error) {
      console.error("❌ Error guardando configuración:", error.message);
      throw error;
    }
  }

  /**
   * Restaura la configuración guardada
   */
  resurrect() {
    console.log("🔄 Restaurando configuración guardada...");
    
    try {
      this.executePM2Command("resurrect");
      console.log("✅ Configuración restaurada exitosamente");
    } catch (error) {
      console.error("❌ Error restaurando configuración:", error.message);
      throw error;
    }
  }

  /**
   * Actualiza PM2
   */
  update() {
    console.log("⬆️ Actualizando PM2...");
    
    try {
      this.executePM2Command("update");
      console.log("✅ PM2 actualizado exitosamente");
    } catch (error) {
      console.error("❌ Error actualizando PM2:", error.message);
      throw error;
    }
  }

  /**
   * Muestra estadísticas de rendimiento
   */
  stats() {
    console.log("📈 Estadísticas de rendimiento:");
    console.log("=" .repeat(50));
    
    try {
      const output = this.executePM2Command("list");
      console.log(output);
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas:", error.message);
    }
  }

  /**
   * Configura PM2 para inicio automático
   */
  setupStartup() {
    console.log("🔧 Configurando inicio automático...");
    
    try {
      this.executePM2Command("startup");
      console.log("✅ Inicio automático configurado");
      console.log("💡 Ejecuta 'pm2 save' para guardar la configuración actual");
    } catch (error) {
      console.error("❌ Error configurando inicio automático:", error.message);
      throw error;
    }
  }

  /**
   * Desactiva el inicio automático
   */
  unsetupStartup() {
    console.log("🔧 Desactivando inicio automático...");
    
    try {
      this.executePM2Command("unstartup");
      console.log("✅ Inicio automático desactivado");
    } catch (error) {
      console.error("❌ Error desactivando inicio automático:", error.message);
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new PM2Manager();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case "start":
      manager.start(arg1);
      break;
    case "stop":
      manager.stop();
      break;
    case "restart":
      manager.restart(arg1);
      break;
    case "reload":
      manager.reload(arg1);
      break;
    case "status":
      manager.status();
      break;
    case "logs":
      manager.logs(arg1, arg2);
      break;
    case "info":
      manager.info(arg1);
      break;
    case "monitor":
      manager.monitor();
      break;
    case "flush":
      manager.flush();
      break;
    case "delete":
      manager.delete();
      break;
    case "save":
      manager.save();
      break;
    case "resurrect":
      manager.resurrect();
      break;
    case "update":
      manager.update();
      break;
    case "stats":
      manager.stats();
      break;
    case "setup-startup":
      manager.setupStartup();
      break;
    case "unsetup-startup":
      manager.unsetupStartup();
      break;
    default:
      console.log(`
🔧 PM2 Manager - Gestor de aplicaciones AbmMcn

Comandos disponibles:
  start [env]          - Inicia las aplicaciones
  stop                 - Detiene las aplicaciones
  restart [env]        - Reinicia las aplicaciones
  reload [env]         - Recarga las aplicaciones (zero-downtime)
  status               - Muestra el estado de las aplicaciones
  logs [app] [lines]   - Muestra logs en tiempo real
  info <app>           - Muestra información detallada de una app
  monitor              - Inicia el monitor de PM2
  flush                - Limpia los logs
  delete               - Elimina todas las aplicaciones
  save                 - Guarda la configuración actual
  resurrect            - Restaura la configuración guardada
  update               - Actualiza PM2
  stats                - Muestra estadísticas de rendimiento
  setup-startup        - Configura inicio automático
  unsetup-startup      - Desactiva inicio automático

Ejemplos:
  node scripts/pm2-manager.js start production
  node scripts/pm2-manager.js logs abmmcn-backend 50
  node scripts/pm2-manager.js monitor
      `);
  }
}

module.exports = PM2Manager;
