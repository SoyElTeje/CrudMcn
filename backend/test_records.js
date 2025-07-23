const authService = require("./services/authService");

async function testRecords() {
  try {
    console.log("🧪 Probando endpoint de registros...");

    // 1. Obtener token de admin
    const user = await authService.verifyCredentials("admin", "admin");
    if (!user) {
      console.log("❌ Login fallido");
      return;
    }

    const token = authService.generateToken(user);
    console.log("✅ Token generado");

    // 2. Simular request al endpoint de registros
    const { getPool } = require("./db");

    const dbName = "BD_ABM1";
    const tableName = "Maquinas";
    const limit = 10;
    const offset = 0;

    console.log(`\n📋 Probando: ${dbName}.${tableName}`);

    try {
      const pool = await getPool(dbName);
      console.log(`✅ Conectado a base de datos: ${dbName}`);

      const result = await pool
        .request()
        .input("limit", parseInt(limit))
        .input("offset", parseInt(offset))
        .query(
          `SELECT * FROM [${tableName}] ORDER BY (SELECT NULL) OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
        );

      console.log(`✅ Registros obtenidos: ${result.recordset.length}`);
      console.log("📊 Primeros registros:");
      result.recordset.slice(0, 3).forEach((record, index) => {
        console.log(
          `  ${index + 1}.`,
          Object.keys(record)
            .slice(0, 5)
            .map((key) => `${key}: ${record[key]}`)
            .join(", ")
        );
      });
    } catch (error) {
      console.error(
        `❌ Error obteniendo registros de ${tableName}:`,
        error.message
      );
    }

    // 3. Probar otra tabla
    const tableName2 = "Funcionario";
    console.log(`\n📋 Probando: ${dbName}.${tableName2}`);

    try {
      const pool = await getPool(dbName);
      const result = await pool
        .request()
        .input("limit", parseInt(limit))
        .input("offset", parseInt(offset))
        .query(
          `SELECT * FROM [${tableName2}] ORDER BY (SELECT NULL) OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
        );

      console.log(`✅ Registros obtenidos: ${result.recordset.length}`);
      console.log("📊 Primeros registros:");
      result.recordset.slice(0, 3).forEach((record, index) => {
        console.log(
          `  ${index + 1}.`,
          Object.keys(record)
            .slice(0, 5)
            .map((key) => `${key}: ${record[key]}`)
            .join(", ")
        );
      });
    } catch (error) {
      console.error(
        `❌ Error obteniendo registros de ${tableName2}:`,
        error.message
      );
    }

    console.log("\n✅ Pruebas completadas");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    process.exit(0);
  }
}

testRecords();
