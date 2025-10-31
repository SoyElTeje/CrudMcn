const { getPool } = require("./backend/db");

async function testSimpleQuery() {
  try {
    console.log("🔍 Probando consulta simple de ACTIVATED_TABLES...");

    const pool = await getPool();
    console.log("✅ Conectado a la base de datos");

    // Consulta simple sin JOINs
    const query = `
      SELECT 
        Id,
        DatabaseName,
        TableName,
        IsActive,
        Description,
        FechaCreacion,
        FechaModificacion,
        CreatedBy,
        UpdatedBy
      FROM ACTIVATED_TABLES 
      WHERE IsActive = 1
      ORDER BY DatabaseName, TableName
    `;

    console.log("📋 Ejecutando consulta...");
    const result = await pool.request().query(query);

    console.log("✅ Consulta exitosa");
    console.log("📊 Registros encontrados:", result.recordset.length);

    if (result.recordset.length > 0) {
      console.log("📋 Datos:");
      result.recordset.forEach((row, index) => {
        console.log(
          `   ${index + 1}. ${row.DatabaseName}.${row.TableName} (Activo: ${
            row.IsActive
          })`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("🔍 Stack trace:", error.stack);
  } finally {
    process.exit(0);
  }
}

testSimpleQuery();
























