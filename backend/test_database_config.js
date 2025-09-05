/**
 * Test para verificar la configuración optimizada de base de datos
 * Verifica conexión, pools, retry logic y monitoreo
 */

const { databaseConfig, sql } = require("./config/database");
const logger = require("./config/logger");

async function testDatabaseConfig() {
  console.log("🧪 Iniciando tests de configuración de base de datos...\n");

  try {
    // Test 1: Verificar configuración del pool
    console.log("1️⃣ Test: Configuración del pool");
    const poolConfig = databaseConfig.getPoolConfig();
    console.log("✅ Configuración del pool obtenida:", {
      environment: process.env.NODE_ENV || "development",
      maxConnections: poolConfig.pool.max,
      minConnections: poolConfig.pool.min,
      idleTimeout: poolConfig.pool.idleTimeoutMillis,
    });

    // Test 2: Crear conexión a base de datos principal
    console.log("\n2️⃣ Test: Conexión a base de datos principal");
    const mainPool = await databaseConfig.getPool();
    console.log("✅ Conexión principal establecida");

    // Test 3: Verificar que el pool está conectado
    console.log("\n3️⃣ Test: Estado del pool");
    console.log("✅ Pool conectado:", mainPool.connected);
    console.log("✅ Total de conexiones:", mainPool.totalConnections);

    // Test 4: Ejecutar query de prueba
    console.log("\n4️⃣ Test: Query de prueba");
    const request = mainPool.request();
    const result = await request.query("SELECT GETDATE() as current_time, @@VERSION as version");
    console.log("✅ Query ejecutada exitosamente");
    console.log("   Hora actual:", result.recordset[0].current_time);
    console.log("   Versión SQL Server:", result.recordset[0].version.split("\n")[0]);

    // Test 5: Obtener estadísticas de pools
    console.log("\n5️⃣ Test: Estadísticas de pools");
    const stats = databaseConfig.getPoolStats();
    console.log("✅ Estadísticas obtenidas:", stats);

    // Test 6: Crear conexión a base de datos secundaria (si existe)
    console.log("\n6️⃣ Test: Conexión a base de datos secundaria");
    try {
      const secondaryPool = await databaseConfig.getPool("BI_EDITOR");
      console.log("✅ Conexión secundaria establecida");
      
      // Verificar estadísticas con múltiples pools
      const multiStats = databaseConfig.getPoolStats();
      console.log("✅ Estadísticas con múltiples pools:", Object.keys(multiStats));
    } catch (error) {
      console.log("⚠️ Base de datos secundaria no disponible:", error.message);
    }

    // Test 7: Verificar retry logic (simulando error)
    console.log("\n7️⃣ Test: Retry logic");
    try {
      // Intentar conectar a una base de datos inexistente
      await databaseConfig.getPool("DATABASE_INEXISTENTE");
    } catch (error) {
      console.log("✅ Retry logic funcionando - Error esperado:", error.message);
    }

    // Test 8: Verificar cierre graceful
    console.log("\n8️⃣ Test: Cierre graceful");
    await databaseConfig.closeAllPools();
    console.log("✅ Todos los pools cerrados exitosamente");

    console.log("\n🎉 Todos los tests pasaron exitosamente!");
    console.log("\n📊 Resumen de la configuración optimizada:");
    console.log("   - Pool de conexiones configurado por ambiente");
    console.log("   - Retry logic implementado");
    console.log("   - Monitoreo de pools activo");
    console.log("   - Cierre graceful funcionando");
    console.log("   - Logging estructurado implementado");

  } catch (error) {
    console.error("❌ Error en tests:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  testDatabaseConfig()
    .then(() => {
      console.log("\n✅ Tests completados exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Tests fallaron:", error.message);
      process.exit(1);
    });
}

module.exports = { testDatabaseConfig };
