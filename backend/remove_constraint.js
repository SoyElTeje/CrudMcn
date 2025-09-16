const sql = require("mssql");

const config = {
  server: "localhost",
  database: "APPDATA",
  user: "sa",
  password: "123456",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function removeUniqueConstraint() {
  try {
    console.log("🔧 Conectando a la base de datos APPDATA...");
    const pool = await sql.connect(config);

    console.log("✅ Conectado exitosamente");

    // Verificar si la restricción existe
    console.log("🔍 Verificando si existe la restricción única...");
    const checkResult = await pool.request().query(`
      SELECT * FROM sys.objects 
      WHERE object_id = OBJECT_ID(N'[dbo].[UQ_TABLE_CONDITIONS]') 
      AND type = 'UQ'
    `);

    if (checkResult.recordset.length > 0) {
      console.log("⚠️ Restricción única encontrada, eliminándola...");

      // Eliminar la restricción única
      await pool.request().query(`
        ALTER TABLE TABLE_CONDITIONS 
        DROP CONSTRAINT UQ_TABLE_CONDITIONS
      `);

      console.log("✅ Restricción única UQ_TABLE_CONDITIONS eliminada");
    } else {
      console.log("ℹ️ La restricción única UQ_TABLE_CONDITIONS no existe");
    }

    // Crear un nuevo índice que permita múltiples condiciones por campo
    console.log("🔍 Verificando si existe el nuevo índice...");
    const indexResult = await pool.request().query(`
      SELECT * FROM sys.indexes 
      WHERE name = 'IX_TABLE_CONDITIONS_FIELD_ORDER'
    `);

    if (indexResult.recordset.length === 0) {
      console.log("🔧 Creando nuevo índice para múltiples condiciones...");

      await pool.request().query(`
        CREATE INDEX IX_TABLE_CONDITIONS_FIELD_ORDER 
        ON TABLE_CONDITIONS(ActivatedTableId, ColumnName, ConditionType)
      `);

      console.log("✅ Nuevo índice IX_TABLE_CONDITIONS_FIELD_ORDER creado");
    } else {
      console.log("ℹ️ El índice IX_TABLE_CONDITIONS_FIELD_ORDER ya existe");
    }

    console.log("");
    console.log(
      "🎉 Ahora se pueden crear múltiples condiciones para el mismo campo"
    );
    console.log("📋 Ejemplo de condiciones permitidas:");
    console.log("   - Campo ID: condición min > 0");
    console.log("   - Campo ID: condición max < 1000");
    console.log("   - Campo ID: condición required = true");
    console.log("");
    console.log(
      "💡 Las condiciones se aplicarán en secuencia durante la validación"
    );

    await pool.close();
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.code === "ELOGIN") {
      console.error("💡 Verifica las credenciales de la base de datos");
    } else if (error.code === "ESOCKET") {
      console.error("💡 Verifica que SQL Server esté ejecutándose");
    }
  }
}

// Ejecutar la función
removeUniqueConstraint();












