const axios = require("axios");
const { getPool } = require("../backend/db");
require("dotenv").config();

const HEALTH_CHECK_CONFIG = {
  backendUrl: process.env.BACKEND_URL || "http://localhost:3001",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  timeout: 10000,
  retries: 3,
  retryDelay: 2000,
};

class HealthChecker {
  constructor() {
    this.status = {
      timestamp: new Date().toISOString(),
      overall: "healthy",
      services: {},
      details: {},
    };
  }

  async checkBackend() {
    try {
      console.log("🔍 Verificando backend...");

      const response = await axios.get(
        `${HEALTH_CHECK_CONFIG.backendUrl}/api/health`,
        {
          timeout: HEALTH_CHECK_CONFIG.timeout,
        }
      );

      if (response.status === 200) {
        this.status.services.backend = "healthy";
        this.status.details.backend = {
          status: response.status,
          responseTime: response.headers["x-response-time"] || "N/A",
          version: response.data.version || "N/A",
        };
        console.log("✅ Backend: HEALTHY");
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.status.services.backend = "unhealthy";
      this.status.details.backend = {
        error: error.message,
        code: error.code || "UNKNOWN",
      };
      console.log("❌ Backend: UNHEALTHY -", error.message);
    }
  }

  async checkDatabase() {
    try {
      console.log("🔍 Verificando base de datos...");

      const pool = await getPool();
      const startTime = Date.now();

      const result = await pool
        .request()
        .query("SELECT 1 as test, GETDATE() as server_time");
      const responseTime = Date.now() - startTime;

      await pool.close();

      this.status.services.database = "healthy";
      this.status.details.database = {
        responseTime: `${responseTime}ms`,
        serverTime: result.recordset[0].server_time,
        connection: "successful",
      };
      console.log("✅ Base de datos: HEALTHY");
    } catch (error) {
      this.status.services.database = "unhealthy";
      this.status.details.database = {
        error: error.message,
        code: error.code || "UNKNOWN",
      };
      console.log("❌ Base de datos: UNHEALTHY -", error.message);
    }
  }

  async checkFrontend() {
    try {
      console.log("🔍 Verificando frontend...");

      const response = await axios.get(HEALTH_CHECK_CONFIG.frontendUrl, {
        timeout: HEALTH_CHECK_CONFIG.timeout,
      });

      if (response.status === 200) {
        this.status.services.frontend = "healthy";
        this.status.details.frontend = {
          status: response.status,
          responseTime: response.headers["x-response-time"] || "N/A",
        };
        console.log("✅ Frontend: HEALTHY");
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.status.services.frontend = "unhealthy";
      this.status.details.frontend = {
        error: error.message,
        code: error.code || "UNKNOWN",
      };
      console.log("❌ Frontend: UNHEALTHY -", error.message);
    }
  }

  async checkDiskSpace() {
    try {
      console.log("🔍 Verificando espacio en disco...");

      const fs = require("fs");
      const path = require("path");

      // Verificar directorio de la aplicación
      const appDir = path.join(__dirname, "..");
      const stats = fs.statfsSync(appDir);

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const usagePercentage = (usedSpace / totalSpace) * 100;

      this.status.services.disk = usagePercentage < 90 ? "healthy" : "warning";
      this.status.details.disk = {
        totalSpace: `${(totalSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeSpace: `${(freeSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercentage: `${usagePercentage.toFixed(2)}%`,
      };

      if (usagePercentage < 90) {
        console.log("✅ Espacio en disco: HEALTHY");
      } else {
        console.log(
          "⚠️  Espacio en disco: WARNING -",
          `${usagePercentage.toFixed(2)}% usado`
        );
      }
    } catch (error) {
      this.status.services.disk = "unhealthy";
      this.status.details.disk = {
        error: error.message,
      };
      console.log("❌ Espacio en disco: UNHEALTHY -", error.message);
    }
  }

  async checkMemoryUsage() {
    try {
      console.log("🔍 Verificando uso de memoria...");

      const os = require("os");
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const usagePercentage = (usedMemory / totalMemory) * 100;

      this.status.services.memory =
        usagePercentage < 85 ? "healthy" : "warning";
      this.status.details.memory = {
        totalMemory: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercentage: `${usagePercentage.toFixed(2)}%`,
      };

      if (usagePercentage < 85) {
        console.log("✅ Memoria: HEALTHY");
      } else {
        console.log(
          "⚠️  Memoria: WARNING -",
          `${usagePercentage.toFixed(2)}% usado`
        );
      }
    } catch (error) {
      this.status.services.memory = "unhealthy";
      this.status.details.memory = {
        error: error.message,
      };
      console.log("❌ Memoria: UNHEALTHY -", error.message);
    }
  }

  async runAllChecks() {
    console.log("🚀 Iniciando verificación de salud del sistema...\n");

    await Promise.all([
      this.checkBackend(),
      this.checkDatabase(),
      this.checkFrontend(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
    ]);

    // Determinar estado general
    const unhealthyServices = Object.values(this.status.services).filter(
      (status) => status === "unhealthy"
    );
    const warningServices = Object.values(this.status.services).filter(
      (status) => status === "warning"
    );

    if (unhealthyServices.length > 0) {
      this.status.overall = "unhealthy";
    } else if (warningServices.length > 0) {
      this.status.overall = "warning";
    } else {
      this.status.overall = "healthy";
    }

    console.log("\n📊 RESUMEN DEL ESTADO:");
    console.log(`Estado general: ${this.status.overall.toUpperCase()}`);

    Object.entries(this.status.services).forEach(([service, status]) => {
      const emoji =
        status === "healthy" ? "✅" : status === "warning" ? "⚠️" : "❌";
      console.log(`${emoji} ${service}: ${status.toUpperCase()}`);
    });

    return this.status;
  }

  generateReport() {
    const report = {
      ...this.status,
      generatedAt: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    return report;
  }
}

// Ejecutar verificación
async function main() {
  const checker = new HealthChecker();
  const status = await checker.runAllChecks();

  // Generar reporte detallado
  const report = checker.generateReport();

  // Guardar reporte en archivo si se solicita
  if (process.argv.includes("--save")) {
    const fs = require("fs");
    const path = require("path");
    const reportsDir = path.join(__dirname, "..", "logs", "health-reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportFile = path.join(reportsDir, `health-report-${timestamp}.json`);

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportFile}`);
  }

  // Salir con código de error si hay servicios no saludables
  if (status.overall === "unhealthy") {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = HealthChecker;














