const { getPool } = require("./db");

async function testUsersTable() {
  try {
    console.log("🔍 Verificando tabla USERS_TABLE...");

    const pool = await getPool();
    console.log("✅ Conectado a la base de datos");

    // Verificar si la tabla existe
    const tableExistsQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'USERS_TABLE'
    `;

    const tableExistsResult = await pool.request().query(tableExistsQuery);
    console.log(
      "📊 Tabla USERS_TABLE existe:",
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
        WHERE TABLE_NAME = 'USERS_TABLE'
        ORDER BY ORDINAL_POSITION
      `;

      const structureResult = await pool.request().query(structureQuery);
      console.log("📋 Estructura de USERS_TABLE:");
      structureResult.recordset.forEach((column, index) => {
        console.log(
          `   ${index + 1}. ${column.COLUMN_NAME} (${column.DATA_TYPE}, ${
            column.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });

      // Verificar datos
      const dataQuery = "SELECT COUNT(*) as count FROM USERS_TABLE";
      const dataResult = await pool.request().query(dataQuery);
      console.log(
        `📊 Registros en USERS_TABLE: ${dataResult.recordset[0].count}`
      );

      if (dataResult.recordset[0].count > 0) {
        const sampleQuery = "SELECT TOP 3 * FROM USERS_TABLE";
        const sampleResult = await pool.request().query(sampleQuery);
        console.log("📋 Muestra de datos:");
        sampleResult.recordset.forEach((row, index) => {
          console.log(`   Registro ${index + 1}:`, row);
        });
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

testUsersTable();






