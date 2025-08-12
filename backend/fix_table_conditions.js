const { getPool } = require("./db");

async function fixTableConditions() {
  try {
    console.log("=== Arreglando Condiciones de Tabla Funcionario ===\n");

    const pool = await getPool();

    // 1. Obtener el ID de la tabla activada
    console.log("1. Obteniendo ID de tabla activada...");
    const tableQuery = `
      SELECT Id FROM ACTIVATED_TABLES 
      WHERE DatabaseName = 'BD_ABM1' 
      AND TableName = 'Funcionario' 
      AND IsActive = 1
    `;

    const tableResult = await pool.request().query(tableQuery);

    if (tableResult.recordset.length === 0) {
      console.log("❌ No se encontró la tabla activada");
      return;
    }

    const activatedTableId = tableResult.recordset[0].Id;
    console.log(`✅ ID de tabla activada: ${activatedTableId}\n`);

    // 2. Verificar condiciones actuales
    console.log("2. Verificando condiciones actuales...");
    const conditionsQuery = `
      SELECT * FROM TABLE_CONDITIONS 
      WHERE ActivatedTableId = @activatedTableId
    `;

    const conditionsResult = await pool
      .request()
      .input("activatedTableId", activatedTableId)
      .query(conditionsQuery);

    console.log("Condiciones actuales:");
    conditionsResult.recordset.forEach((condition) => {
      console.log(`- ID: ${condition.Id}`);
      console.log(`  Columna: ${condition.ColumnName}`);
      console.log(`  Requerido: ${condition.IsRequired}`);
      console.log(`  Tipo: ${condition.DataType}`);
      console.log("");
    });

    // 3. Eliminar condiciones para campos que no existen en la tabla real
    console.log("3. Eliminando condiciones incorrectas...");
    const deleteQuery = `
      DELETE FROM TABLE_CONDITIONS 
      WHERE ActivatedTableId = @activatedTableId 
      AND ColumnName = 'ID'
    `;

    const deleteResult = await pool
      .request()
      .input("activatedTableId", activatedTableId)
      .query(deleteQuery);

    console.log(
      `✅ Eliminadas ${deleteResult.rowsAffected[0]} condiciones incorrectas\n`
    );

    // 4. Verificar condiciones después de la limpieza
    console.log("4. Verificando condiciones después de la limpieza...");
    const finalConditionsResult = await pool
      .request()
      .input("activatedTableId", activatedTableId)
      .query(conditionsQuery);

    console.log("Condiciones finales:");
    finalConditionsResult.recordset.forEach((condition) => {
      console.log(`- Columna: ${condition.ColumnName}`);
      console.log(`  Requerido: ${condition.IsRequired}`);
      console.log(`  Tipo: ${condition.DataType}`);
      console.log("");
    });

    console.log("✅ Limpieza completada exitosamente");
  } catch (error) {
    console.error("Error arreglando condiciones:", error);
  }
}

fixTableConditions();
