const { getPool } = require("./db");
const fs = require("fs");
const path = require("path");

async function setupActivatedTables() {
  try {
    console.log("🔧 Configurando sistema de activación de tablas...");

    const pool = await getPool();

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, "setup_activated_tables.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Ejecutar el script SQL
    await pool.request().query(sql);

    console.log("✅ Sistema de activación de tablas configurado exitosamente");

    // Verificar que las tablas se crearon correctamente
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('ACTIVATED_TABLES', 'TABLE_CONDITIONS')
    `);

    console.log(
      "📋 Tablas creadas:",
      result.recordset.map((r) => r.TABLE_NAME)
    );
  } catch (error) {
    console.error("❌ Error configurando sistema de activación:", error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupActivatedTables()
    .then(() => {
      console.log("✅ Setup completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup falló:", error);
      process.exit(1);
    });
}

module.exports = { setupActivatedTables };
















