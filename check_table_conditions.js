const { getPool } = require("./backend/db");

async function checkTableConditions() {
  try {
    console.log("🔍 Verificando tabla TABLE_CONDITIONS...");

    const pool = await getPool();
    console.log("✅ Conectado a la base de datos");

    // Verificar si la tabla existe
    const tableExistsQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'TABLE_CONDITIONS'
    `;

    const tableExistsResult = await pool.request().query(tableExistsQuery);
    console.log(
      "📊 Tabla TABLE_CONDITIONS existe:",
      tableExistsResult.recordset[0].count > 0
    );

    if (tableExistsResult.recordset[0].count > 0) {
      // Verificar estructura
      const structureQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'TABLE_CONDITIONS'
        ORDER BY ORDINAL_POSITION
      `;

      const structureResult = await pool.request().query(structureQuery);
      console.log("📋 Estructura de TABLE_CONDITIONS:");
      structureResult.recordset.forEach((column, index) => {
        console.log(
          `   ${index + 1}. ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${
            column.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });
    } else {
      console.log("⚠️ La tabla TABLE_CONDITIONS no existe");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

checkTableConditions();





