const activatedTablesService = require("./services/activatedTablesService");

async function testServiceDirect() {
  try {
    console.log("🔍 Probando servicio activatedTablesService directamente...");

    // Probar getActivatedTables
    console.log("\n1️⃣ Probando getActivatedTables()...");
    try {
      const activatedTables = await activatedTablesService.getActivatedTables();
      console.log("✅ getActivatedTables() exitoso");
      console.log("📋 Tablas activadas:", activatedTables);
    } catch (error) {
      console.error("❌ Error en getActivatedTables():", error.message);
      console.error("🔍 Stack trace:", error.stack);
    }

    console.log("\n🎉 Prueba completada!");
  } catch (error) {
    console.error("💥 Error general:", error.message);
  } finally {
    process.exit(0);
  }
}

testServiceDirect();





