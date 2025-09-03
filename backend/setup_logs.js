const { getPool } = require("./db");
const fs = require("fs");
const path = require("path");

async function setupLogsTable() {
  try {
    console.log("🔧 Configurando tabla de logs del sistema...");

    const pool = await getPool();

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, "setup_logs_table.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Ejecutar el SQL
    await pool.request().query(sqlContent);

    console.log("✅ Tabla LOGS creada exitosamente");

    // Verificar que la tabla existe
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'LOGS'
    `;

    const result = await pool.request().query(checkQuery);

    if (result.recordset[0].count > 0) {
      console.log("✅ Verificación: Tabla LOGS existe en la base de datos");
    } else {
      console.log("❌ Error: La tabla LOGS no se creó correctamente");
    }
  } catch (error) {
    console.error("❌ Error configurando tabla de logs:", error);
  } finally {
    process.exit(0);
  }
}

setupLogsTable();
