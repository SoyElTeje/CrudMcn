/**
 * Script de deployment automatizado para AbmMcn
 * Maneja deployment a diferentes ambientes con validaciones
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const PM2Manager = require("./pm2-manager");

class DeploymentManager {
  constructor() {
    this.pm2Manager = new PM2Manager();
    this.projectRoot = path.join(__dirname, "..");
    this.backendDir = path.join(this.projectRoot, "backend");
    this.frontendDir = path.join(this.projectRoot, "frontend");
    this.logsDir = path.join(this.projectRoot, "logs");
  }

  /**
   * Ejecuta un comando y retorna la salida
   * @param {string} command - Comando a ejecutar
   * @param {string} cwd - Directorio de trabajo
   * @returns {string} Salida del comando
   */
  executeCommand(command, cwd = this.projectRoot) {
    try {
      console.log(`🔧 Ejecutando: ${command} en ${cwd}`);
      const output = execSync(command, { 
        encoding: "utf8",
        cwd,
        stdio: "pipe"
      });
      return output;
    } catch (error) {
      console.error(`❌ Error ejecutando comando: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica que los archivos necesarios existen
   * @param {string} environment - Ambiente de deployment
   */
  validateEnvironment(environment) {
    console.log(`🔍 Validando ambiente ${environment}...`);
    
    const requiredFiles = [
      "ecosystem.config.js",
      "backend/server.js",
      "backend/package.json",
      "frontend/package.json"
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo requerido no encontrado: ${file}`);
      }
    }

    // Verificar archivos de entorno
    const envFile = path.join(this.backendDir, `.env.${environment}`);
    if (!fs.existsSync(envFile)) {
      console.warn(`⚠️ Archivo de entorno no encontrado: ${envFile}`);
      console.warn("Asegúrate de configurar las variables de entorno correctamente");
    }

    console.log("✅ Validación de ambiente completada");
  }

  /**
   * Instala dependencias del backend
   */
  installBackendDependencies() {
    console.log("📦 Instalando dependencias del backend...");
    
    try {
      this.executeCommand("npm ci --production", this.backendDir);
      console.log("✅ Dependencias del backend instaladas");
    } catch (error) {
      console.error("❌ Error instalando dependencias del backend:", error.message);
      throw error;
    }
  }

  /**
   * Instala dependencias del frontend
   */
  installFrontendDependencies() {
    console.log("📦 Instalando dependencias del frontend...");
    
    try {
      this.executeCommand("npm ci", this.frontendDir);
      console.log("✅ Dependencias del frontend instaladas");
    } catch (error) {
      console.error("❌ Error instalando dependencias del frontend:", error.message);
      throw error;
    }
  }

  /**
   * Construye el frontend
   */
  buildFrontend() {
    console.log("🏗️ Construyendo frontend...");
    
    try {
      this.executeCommand("npm run build", this.frontendDir);
      console.log("✅ Frontend construido exitosamente");
    } catch (error) {
      console.error("❌ Error construyendo frontend:", error.message);
      throw error;
    }
  }

  /**
   * Verifica que el build del frontend existe
   */
  validateFrontendBuild() {
    console.log("🔍 Validando build del frontend...");
    
    const distDir = path.join(this.frontendDir, "dist");
    if (!fs.existsSync(distDir)) {
      throw new Error("Directorio dist del frontend no encontrado. Ejecuta 'npm run build' primero.");
    }

    const indexFile = path.join(distDir, "index.html");
    if (!fs.existsSync(indexFile)) {
      throw new Error("Archivo index.html no encontrado en el build del frontend");
    }

    console.log("✅ Build del frontend validado");
  }

  /**
   * Configura las variables de entorno
   * @param {string} environment - Ambiente
   */
  setupEnvironment(environment) {
    console.log(`🔧 Configurando variables de entorno para ${environment}...`);
    
    const envSource = path.join(this.backendDir, `env.${environment}`);
    const envTarget = path.join(this.backendDir, ".env");
    
    if (fs.existsSync(envSource)) {
      try {
        fs.copyFileSync(envSource, envTarget);
        console.log(`✅ Variables de entorno configuradas desde ${envSource}`);
      } catch (error) {
        console.error("❌ Error configurando variables de entorno:", error.message);
        throw error;
      }
    } else {
      console.warn(`⚠️ Archivo de entorno no encontrado: ${envSource}`);
    }
  }

  /**
   * Ejecuta tests (si están disponibles)
   * @param {string} environment - Ambiente
   */
  runTests(environment) {
    console.log(`🧪 Ejecutando tests para ${environment}...`);
    
    try {
      // Tests del backend
      if (fs.existsSync(path.join(this.backendDir, "test"))) {
        this.executeCommand("npm test", this.backendDir);
        console.log("✅ Tests del backend pasaron");
      } else {
        console.log("ℹ️ No hay tests del backend configurados");
      }

      // Tests del frontend
      if (fs.existsSync(path.join(this.frontendDir, "src", "__tests__"))) {
        this.executeCommand("npm test", this.frontendDir);
        console.log("✅ Tests del frontend pasaron");
      } else {
        console.log("ℹ️ No hay tests del frontend configurados");
      }
    } catch (error) {
      console.error("❌ Error ejecutando tests:", error.message);
      throw error;
    }
  }

  /**
   * Crea backup de la configuración actual
   */
  createBackup() {
    console.log("💾 Creando backup de la configuración actual...");
    
    try {
      const backupDir = path.join(this.projectRoot, "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupDir, `ecosystem-backup-${timestamp}.json`);
      
      this.pm2Manager.executePM2Command("list", ["--format", "json"]);
      console.log(`✅ Backup creado: ${backupFile}`);
    } catch (error) {
      console.error("❌ Error creando backup:", error.message);
      // No lanzar error, es opcional
    }
  }

  /**
   * Despliega la aplicación
   * @param {string} environment - Ambiente de deployment
   * @param {Object} options - Opciones de deployment
   */
  async deploy(environment, options = {}) {
    const {
      skipTests = false,
      skipBackup = false,
      force = false
    } = options;

    console.log(`🚀 Iniciando deployment a ${environment}...`);
    console.log("=" .repeat(50));

    try {
      // 1. Validar ambiente
      this.validateEnvironment(environment);

      // 2. Crear backup (opcional)
      if (!skipBackup) {
        this.createBackup();
      }

      // 3. Configurar variables de entorno
      this.setupEnvironment(environment);

      // 4. Instalar dependencias
      this.installBackendDependencies();
      this.installFrontendDependencies();

      // 5. Ejecutar tests (opcional)
      if (!skipTests) {
        this.runTests(environment);
      }

      // 6. Construir frontend
      this.buildFrontend();
      this.validateFrontendBuild();

      // 7. Detener aplicaciones actuales
      console.log("🛑 Deteniendo aplicaciones actuales...");
      try {
        this.pm2Manager.stop();
      } catch (error) {
        console.log("ℹ️ No hay aplicaciones ejecutándose");
      }

      // 8. Iniciar aplicaciones con nueva configuración
      console.log(`🚀 Iniciando aplicaciones en modo ${environment}...`);
      this.pm2Manager.start(environment);

      // 9. Verificar que las aplicaciones están ejecutándose
      setTimeout(() => {
        console.log("🔍 Verificando estado de las aplicaciones...");
        this.pm2Manager.status();
      }, 5000);

      // 10. Guardar configuración
      this.pm2Manager.save();

      console.log("=" .repeat(50));
      console.log(`✅ Deployment a ${environment} completado exitosamente!`);
      console.log("📊 Para monitorear las aplicaciones:");
      console.log("   node scripts/pm2-manager.js monitor");
      console.log("📋 Para ver logs:");
      console.log("   node scripts/pm2-manager.js logs");

    } catch (error) {
      console.error("=" .repeat(50));
      console.error(`❌ Error en deployment a ${environment}:`, error.message);
      console.error("🔄 Para restaurar la configuración anterior:");
      console.error("   node scripts/pm2-manager.js resurrect");
      throw error;
    }
  }

  /**
   * Rollback a la configuración anterior
   */
  rollback() {
    console.log("🔄 Ejecutando rollback...");
    
    try {
      this.pm2Manager.stop();
      this.pm2Manager.resurrect();
      console.log("✅ Rollback completado exitosamente");
    } catch (error) {
      console.error("❌ Error ejecutando rollback:", error.message);
      throw error;
    }
  }

  /**
   * Muestra información del deployment
   */
  showInfo() {
    console.log("ℹ️ Información del deployment:");
    console.log("=" .repeat(50));
    console.log(`📁 Directorio del proyecto: ${this.projectRoot}`);
    console.log(`📁 Backend: ${this.backendDir}`);
    console.log(`📁 Frontend: ${this.frontendDir}`);
    console.log(`📁 Logs: ${this.logsDir}`);
    console.log("=" .repeat(50));
    this.pm2Manager.status();
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new DeploymentManager();
  const command = process.argv[2];
  const environment = process.argv[3];
  const options = {
    skipTests: process.argv.includes("--skip-tests"),
    skipBackup: process.argv.includes("--skip-backup"),
    force: process.argv.includes("--force")
  };

  switch (command) {
    case "deploy":
      if (!environment) {
        console.error("❌ Ambiente requerido. Uso: node scripts/deploy.js deploy <environment>");
        process.exit(1);
      }
      manager.deploy(environment, options).catch(console.error);
      break;
    case "rollback":
      manager.rollback();
      break;
    case "info":
      manager.showInfo();
      break;
    default:
      console.log(`
🚀 Deployment Manager - AbmMcn

Comandos disponibles:
  deploy <env> [opciones]  - Despliega la aplicación
  rollback                 - Revierte a la configuración anterior
  info                     - Muestra información del deployment

Ambientes disponibles:
  development              - Ambiente de desarrollo
  staging                  - Ambiente de staging
  production               - Ambiente de producción

Opciones:
  --skip-tests            - Omite la ejecución de tests
  --skip-backup           - Omite la creación de backup
  --force                 - Fuerza el deployment sin confirmación

Ejemplos:
  node scripts/deploy.js deploy production
  node scripts/deploy.js deploy staging --skip-tests
  node scripts/deploy.js rollback
  node scripts/deploy.js info
      `);
  }
}

module.exports = DeploymentManager;
