/**
 * Sistema de monitoreo avanzado para AbmMcn
 * Proporciona monitoreo de salud, rendimiento y alertas
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

class MonitoringSystem {
  constructor() {
    this.projectRoot = path.join(__dirname, "..");
    this.logsDir = path.join(this.projectRoot, "logs");
    this.backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    this.healthCheckInterval = 30000; // 30 segundos
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Ejecuta un comando y retorna la salida
   * @param {string} command - Comando a ejecutar
   * @returns {string} Salida del comando
   */
  executeCommand(command) {
    try {
      const output = execSync(command, { 
        encoding: "utf8",
        stdio: "pipe"
      });
      return output;
    } catch (error) {
      throw new Error(`Error ejecutando comando: ${error.message}`);
    }
  }

  /**
   * Verifica el estado de PM2
   * @returns {Object} Estado de PM2
   */
  getPM2Status() {
    try {
      const output = this.executeCommand("pm2 jlist");
      const processes = JSON.parse(output);
      
      return {
        status: "healthy",
        processes: processes.map(proc => ({
          name: proc.name,
          status: proc.pm2_env.status,
          cpu: proc.monit.cpu,
          memory: proc.monit.memory,
          uptime: proc.pm2_env.pm_uptime,
          restarts: proc.pm2_env.restart_time
        }))
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message
      };
    }
  }

  /**
   * Verifica la salud del backend
   * @returns {Promise<Object>} Estado de salud del backend
   */
  async checkBackendHealth() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/health`, {
        timeout: 5000
      });
      
      return {
        status: "healthy",
        responseTime: response.data.responseTime || 0,
        uptime: response.data.uptime,
        memory: response.data.memory,
        environment: response.data.environment
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Verifica la salud del frontend
   * @returns {Promise<Object>} Estado de salud del frontend
   */
  async checkFrontendHealth() {
    try {
      const response = await axios.get(this.frontendUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      return {
        status: "healthy",
        statusCode: response.status,
        responseTime: response.headers["x-response-time"] || 0
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Verifica el uso de disco
   * @returns {Object} Información del uso de disco
   */
  getDiskUsage() {
    try {
      const output = this.executeCommand("df -h");
      const lines = output.split("\n");
      const rootLine = lines.find(line => line.includes("/"));
      
      if (rootLine) {
        const parts = rootLine.split(/\s+/);
        return {
          status: "healthy",
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usage: parts[4]
        };
      }
      
      return { status: "unknown" };
    } catch (error) {
      return {
        status: "error",
        error: error.message
      };
    }
  }

  /**
   * Verifica el uso de memoria del sistema
   * @returns {Object} Información de memoria
   */
  getSystemMemory() {
    try {
      const output = this.executeCommand("free -m");
      const lines = output.split("\n");
      const memLine = lines[1];
      const parts = memLine.split(/\s+/);
      
      return {
        status: "healthy",
        total: parseInt(parts[1]),
        used: parseInt(parts[2]),
        free: parseInt(parts[3]),
        available: parseInt(parts[6]) || parseInt(parts[3])
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message
      };
    }
  }

  /**
   * Verifica el uso de CPU
   * @returns {Object} Información de CPU
   */
  getCPUUsage() {
    try {
      const output = this.executeCommand("top -bn1 | grep 'Cpu(s)'");
      const cpuMatch = output.match(/(\d+\.\d+)%us/);
      
      if (cpuMatch) {
        return {
          status: "healthy",
          usage: parseFloat(cpuMatch[1])
        };
      }
      
      return { status: "unknown" };
    } catch (error) {
      return {
        status: "error",
        error: error.message
      };
    }
  }

  /**
   * Verifica el tamaño de los logs
   * @returns {Object} Información de logs
   */
  getLogsInfo() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return { status: "no_logs" };
      }

      const files = fs.readdirSync(this.logsDir);
      const logFiles = files.filter(file => file.endsWith(".log"));
      
      let totalSize = 0;
      const fileSizes = {};
      
      for (const file of logFiles) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        totalSize += size;
        fileSizes[file] = {
          size: size,
          sizeMB: (size / 1024 / 1024).toFixed(2),
          modified: stats.mtime
        };
      }

      return {
        status: "healthy",
        totalFiles: logFiles.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        files: fileSizes
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message
      };
    }
  }

  /**
   * Ejecuta un health check completo
   * @returns {Promise<Object>} Resultado del health check
   */
  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    console.log(`🔍 Health Check - ${timestamp}`);
    console.log("=" .repeat(50));

    const results = {
      timestamp,
      overall: "healthy",
      checks: {}
    };

    // PM2 Status
    console.log("📊 Verificando estado de PM2...");
    results.checks.pm2 = this.getPM2Status();
    console.log(`   Estado: ${results.checks.pm2.status}`);

    // Backend Health
    console.log("🔧 Verificando salud del backend...");
    results.checks.backend = await this.checkBackendHealth();
    console.log(`   Estado: ${results.checks.backend.status}`);

    // Frontend Health
    console.log("🌐 Verificando salud del frontend...");
    results.checks.frontend = await this.checkFrontendHealth();
    console.log(`   Estado: ${results.checks.frontend.status}`);

    // System Resources
    console.log("💾 Verificando recursos del sistema...");
    results.checks.disk = this.getDiskUsage();
    results.checks.memory = this.getSystemMemory();
    results.checks.cpu = this.getCPUUsage();
    
    console.log(`   Disco: ${results.checks.disk.status}`);
    console.log(`   Memoria: ${results.checks.memory.status}`);
    console.log(`   CPU: ${results.checks.cpu.status}`);

    // Logs
    console.log("📋 Verificando logs...");
    results.checks.logs = this.getLogsInfo();
    console.log(`   Estado: ${results.checks.logs.status}`);

    // Determinar estado general
    const unhealthyChecks = Object.values(results.checks).filter(
      check => check.status === "unhealthy" || check.status === "error"
    );

    if (unhealthyChecks.length > 0) {
      results.overall = "unhealthy";
      console.log("❌ Health Check: UNHEALTHY");
    } else {
      console.log("✅ Health Check: HEALTHY");
    }

    console.log("=" .repeat(50));
    return results;
  }

  /**
   * Inicia el monitoreo continuo
   * @param {number} interval - Intervalo en milisegundos
   */
  startMonitoring(interval = this.healthCheckInterval) {
    if (this.isMonitoring) {
      console.log("⚠️ El monitoreo ya está ejecutándose");
      return;
    }

    console.log(`🔄 Iniciando monitoreo continuo (intervalo: ${interval}ms)...`);
    this.isMonitoring = true;

    // Ejecutar health check inmediatamente
    this.performHealthCheck();

    // Configurar intervalo
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error("❌ Error en monitoreo:", error.message);
      }
    }, interval);
  }

  /**
   * Detiene el monitoreo continuo
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log("⚠️ El monitoreo no está ejecutándose");
      return;
    }

    console.log("🛑 Deteniendo monitoreo...");
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log("✅ Monitoreo detenido");
  }

  /**
   * Genera un reporte de salud
   * @returns {Promise<Object>} Reporte completo
   */
  async generateHealthReport() {
    console.log("📊 Generando reporte de salud...");
    
    const healthCheck = await this.performHealthCheck();
    
    const report = {
      ...healthCheck,
      summary: {
        totalChecks: Object.keys(healthCheck.checks).length,
        healthyChecks: Object.values(healthCheck.checks).filter(
          check => check.status === "healthy"
        ).length,
        unhealthyChecks: Object.values(healthCheck.checks).filter(
          check => check.status === "unhealthy" || check.status === "error"
        ).length
      }
    };

    console.log("📈 Resumen del reporte:");
    console.log(`   Total de verificaciones: ${report.summary.totalChecks}`);
    console.log(`   Verificaciones saludables: ${report.summary.healthyChecks}`);
    console.log(`   Verificaciones no saludables: ${report.summary.unhealthyChecks}`);

    return report;
  }

  /**
   * Limpia logs antiguos
   * @param {number} days - Días de antigüedad para limpiar
   */
  cleanOldLogs(days = 7) {
    console.log(`🧹 Limpiando logs más antiguos que ${days} días...`);
    
    try {
      if (!fs.existsSync(this.logsDir)) {
        console.log("ℹ️ No hay directorio de logs");
        return;
      }

      const files = fs.readdirSync(this.logsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let cleanedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith(".log")) {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            const size = stats.size;
            fs.unlinkSync(filePath);
            cleanedCount++;
            totalSize += size;
            console.log(`   Eliminado: ${file} (${(size / 1024 / 1024).toFixed(2)} MB)`);
          }
        }
      }

      console.log(`✅ Limpieza completada: ${cleanedCount} archivos, ${(totalSize / 1024 / 1024).toFixed(2)} MB liberados`);
    } catch (error) {
      console.error("❌ Error limpiando logs:", error.message);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const monitor = new MonitoringSystem();
  const command = process.argv[2];
  const arg1 = process.argv[3];

  switch (command) {
    case "check":
      monitor.performHealthCheck().catch(console.error);
      break;
    case "monitor":
      const interval = arg1 ? parseInt(arg1) * 1000 : 30000;
      monitor.startMonitoring(interval);
      
      // Manejar Ctrl+C
      process.on("SIGINT", () => {
        console.log("\n🛑 Deteniendo monitoreo...");
        monitor.stopMonitoring();
        process.exit(0);
      });
      break;
    case "report":
      monitor.generateHealthReport().catch(console.error);
      break;
    case "clean-logs":
      const days = arg1 ? parseInt(arg1) : 7;
      monitor.cleanOldLogs(days);
      break;
    default:
      console.log(`
📊 Sistema de Monitoreo - AbmMcn

Comandos disponibles:
  check                    - Ejecuta un health check completo
  monitor [interval]       - Inicia monitoreo continuo (intervalo en segundos)
  report                   - Genera un reporte de salud completo
  clean-logs [days]        - Limpia logs más antiguos que N días (default: 7)

Ejemplos:
  node scripts/monitor.js check
  node scripts/monitor.js monitor 60
  node scripts/monitor.js report
  node scripts/monitor.js clean-logs 14
      `);
  }
}

module.exports = MonitoringSystem;
