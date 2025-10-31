const { getPool } = require("./backend/db");

async function checkExistingTables() {
  try {
    console.log("🔍 Verificando tablas existentes en APPDATA...");

    const pool = await getPool();

    // Obtener todas las tablas
    const query = `
      SELECT 
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    const result = await pool.request().query(query);

    console.log("📋 Tablas existentes en APPDATA:");
    result.recordset.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME} (${table.TABLE_TYPE})`);
    });

    console.log(`\n📊 Total de tablas: ${result.recordset.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

checkExistingTables();
























