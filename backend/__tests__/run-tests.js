/**
 * Script para ejecutar todos los tests
 * Proporciona diferentes opciones de ejecución
 */

const { execSync } = require("child_process");
const path = require("path");

class TestRunner {
  constructor() {
    this.projectRoot = path.join(__dirname, "..");
    this.testDir = path.join(__dirname);
  }

  /**
   * Ejecuta comando y retorna la salida
   * @param {string} command - Comando a ejecutar
   * @returns {string} Salida del comando
   */
  executeCommand(command) {
    try {
      console.log(`🔧 Ejecutando: ${command}`);
      const output = execSync(command, { 
        encoding: "utf8",
        cwd: this.projectRoot,
        stdio: "pipe"
      });
      return output;
    } catch (error) {
      console.error(`❌ Error ejecutando comando: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ejecuta todos los tests
   */
  runAllTests() {
    console.log("🧪 Ejecutando todos los tests...");
    console.log("=" .repeat(50));

    try {
      const output = this.executeCommand("npm test");
      console.log(output);
      console.log("✅ Todos los tests completados exitosamente");
    } catch (error) {
      console.error("❌ Algunos tests fallaron");
      throw error;
    }
  }

  /**
   * Ejecuta tests con coverage
   */
  runTestsWithCoverage() {
    console.log("📊 Ejecutando tests con coverage...");
    console.log("=" .repeat(50));

    try {
      const output = this.executeCommand("npm run test:coverage");
      console.log(output);
      console.log("✅ Tests con coverage completados exitosamente");
    } catch (error) {
      console.error("❌ Error ejecutando tests con coverage");
      throw error;
    }
  }

  /**
   * Ejecuta tests en modo watch
   */
  runTestsWatch() {
    console.log("👀 Ejecutando tests en modo watch...");
    console.log("Presiona Ctrl+C para salir");
    console.log("=" .repeat(50));

    try {
      this.executeCommand("npm run test:watch");
    } catch (error) {
      console.error("❌ Error ejecutando tests en modo watch");
      throw error;
    }
  }

  /**
   * Ejecuta tests específicos
   * @param {string} pattern - Patrón de tests a ejecutar
   */
  runSpecificTests(pattern) {
    console.log(`🎯 Ejecutando tests que coincidan con: ${pattern}`);
    console.log("=" .repeat(50));

    try {
      const output = this.executeCommand(`npx jest --testPathPattern="${pattern}"`);
      console.log(output);
      console.log("✅ Tests específicos completados exitosamente");
    } catch (error) {
      console.error("❌ Error ejecutando tests específicos");
      throw error;
    }
  }

  /**
   * Ejecuta tests de un directorio específico
   * @param {string} directory - Directorio de tests
   */
  runTestsFromDirectory(directory) {
    console.log(`📁 Ejecutando tests del directorio: ${directory}`);
    console.log("=" .repeat(50));

    try {
      const output = this.executeCommand(`npx jest ${directory}`);
      console.log(output);
      console.log("✅ Tests del directorio completados exitosamente");
    } catch (error) {
      console.error("❌ Error ejecutando tests del directorio");
      throw error;
    }
  }

  /**
   * Ejecuta tests de servicios
   */
  runServiceTests() {
    this.runTestsFromDirectory("__tests__/services");
  }

  /**
   * Ejecuta tests de middleware
   */
  runMiddlewareTests() {
    this.runTestsFromDirectory("__tests__/middleware");
  }

  /**
   * Ejecuta tests de rutas
   */
  runRouteTests() {
    this.runTestsFromDirectory("__tests__/routes");
  }

  /**
   * Ejecuta tests de integración
   */
  runIntegrationTests() {
    this.runTestsFromDirectory("__tests__/integration");
  }

  /**
   * Limpia archivos de coverage
   */
  cleanCoverage() {
    console.log("🧹 Limpiando archivos de coverage...");
    
    try {
      this.executeCommand("rm -rf coverage");
      console.log("✅ Archivos de coverage limpiados");
    } catch (error) {
      console.log("ℹ️ No hay archivos de coverage para limpiar");
    }
  }

  /**
   * Muestra estadísticas de tests
   */
  showTestStats() {
    console.log("📊 Estadísticas de tests:");
    console.log("=" .repeat(50));

    try {
      const output = this.executeCommand("npx jest --listTests");
      const tests = output.split("\n").filter(line => line.trim());
      
      console.log(`Total de archivos de test: ${tests.length}`);
      
      const services = tests.filter(test => test.includes("/services/"));
      const middleware = tests.filter(test => test.includes("/middleware/"));
      const routes = tests.filter(test => test.includes("/routes/"));
      const integration = tests.filter(test => test.includes("/integration/"));
      
      console.log(`Tests de servicios: ${services.length}`);
      console.log(`Tests de middleware: ${middleware.length}`);
      console.log(`Tests de rutas: ${routes.length}`);
      console.log(`Tests de integración: ${integration.length}`);
      
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas de tests");
    }
  }
}

// CLI Interface
if (require.main === module) {
  const runner = new TestRunner();
  const command = process.argv[2];
  const arg1 = process.argv[3];

  switch (command) {
    case "all":
      runner.runAllTests();
      break;
    case "coverage":
      runner.runTestsWithCoverage();
      break;
    case "watch":
      runner.runTestsWatch();
      break;
    case "specific":
      if (!arg1) {
        console.error("❌ Patrón requerido. Uso: node run-tests.js specific <pattern>");
        process.exit(1);
      }
      runner.runSpecificTests(arg1);
      break;
    case "services":
      runner.runServiceTests();
      break;
    case "middleware":
      runner.runMiddlewareTests();
      break;
    case "routes":
      runner.runRouteTests();
      break;
    case "integration":
      runner.runIntegrationTests();
      break;
    case "clean":
      runner.cleanCoverage();
      break;
    case "stats":
      runner.showTestStats();
      break;
    default:
      console.log(`
🧪 Test Runner - AbmMcn

Comandos disponibles:
  all                    - Ejecuta todos los tests
  coverage               - Ejecuta tests con coverage
  watch                  - Ejecuta tests en modo watch
  specific <pattern>     - Ejecuta tests que coincidan con el patrón
  services               - Ejecuta tests de servicios
  middleware             - Ejecuta tests de middleware
  routes                 - Ejecuta tests de rutas
  integration            - Ejecuta tests de integración
  clean                  - Limpia archivos de coverage
  stats                  - Muestra estadísticas de tests

Ejemplos:
  node __tests__/run-tests.js all
  node __tests__/run-tests.js coverage
  node __tests__/run-tests.js specific "auth"
  node __tests__/run-tests.js services
  node __tests__/run-tests.js stats
      `);
  }
}

module.exports = TestRunner;
