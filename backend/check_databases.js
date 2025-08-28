const { getPool } = require("./db");

async function checkDatabases() {
  try {
    console.log("🔍 Verificando bases de datos disponibles...");

    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT name, database_id, create_date
      FROM sys.databases 
      WHERE state = 0 -- Solo bases de datos online
      AND name NOT IN ('master', 'tempdb', 'model', 'msdb') -- Excluir bases de sistema
      ORDER BY name
    `);

    console.log("📋 Bases de datos disponibles:");
    result.recordset.forEach((db) => {
      console.log(
        `- ${db.name} (ID: ${db.database_id}, Creada: ${db.create_date})`
      );
    });

    console.log(`\n✅ Total de bases de datos: ${result.recordset.length}`);
  } catch (error) {
    console.error("❌ Error verificando bases de datos:", error);
  }
}

if (require.main === module) {
  checkDatabases()
    .then(() => {
      console.log("✅ Verificación completada");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Verificación falló:", error);
      process.exit(1);
    });
}

module.exports = { checkDatabases };









