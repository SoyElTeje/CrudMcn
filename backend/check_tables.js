const { getPool } = require("./db");

async function checkTables() {
  try {
    console.log("🔍 Verificando tablas en la base de datos...");

    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_SCHEMA
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log("📋 Tablas encontradas:");
    result.recordset.forEach((table) => {
      console.log(`- ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });

    console.log(`\n✅ Total de tablas: ${result.recordset.length}`);
  } catch (error) {
    console.error("❌ Error verificando tablas:", error);
  }
}

if (require.main === module) {
  checkTables()
    .then(() => {
      console.log("✅ Verificación completada");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Verificación falló:", error);
      process.exit(1);
    });
}

module.exports = { checkTables };




































