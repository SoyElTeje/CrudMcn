const { getPool } = require("./db");

async function testActivatedTablesSimple() {
  try {
    console.log(
      "🔍 Probando sistema de activación de tablas (versión simple)..."
    );

    const pool = await getPool();

    // 1. Verificar si las tablas existen
    console.log("\n1. Verificando existencia de tablas...");
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('ACTIVATED_TABLES', 'TABLE_CONDITIONS')
    `);

    console.log(
      "Tablas encontradas:",
      tablesResult.recordset.map((r) => r.TABLE_NAME)
    );

    // 2. Verificar datos existentes en ACTIVATED_TABLES
    console.log("\n2. Verificando datos existentes en ACTIVATED_TABLES...");
    const dataResult = await pool.request().query(`
      SELECT 
        Id,
        DatabaseName,
        TableName,
        IsActive,
        Description,
        CreatedAt,
        UpdatedAt,
        CreatedBy,
        UpdatedBy
      FROM ACTIVATED_TABLES
      ORDER BY CreatedAt DESC
    `);

    console.log(`Registros encontrados: ${dataResult.recordset.length}`);
    dataResult.recordset.forEach((record) => {
      console.log(
        `  - ID: ${record.Id}, DB: ${record.DatabaseName}, Table: ${record.TableName}, Active: ${record.IsActive}`
      );
    });

    // 3. Verificar si existe la tabla USERS
    console.log("\n3. Verificando existencia de tabla USERS...");
    const usersResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'USERS'
    `);

    if (usersResult.recordset.length > 0) {
      console.log("✅ Tabla USERS existe");

      // Verificar datos en USERS
      const usersData = await pool.request().query(`
        SELECT Id, Username FROM USERS
      `);
      console.log(`Usuarios encontrados: ${usersData.recordset.length}`);
      usersData.recordset.forEach((user) => {
        console.log(`  - ID: ${user.Id}, Username: ${user.Username}`);
      });
    } else {
      console.log("❌ Tabla USERS no existe");
    }

    // 4. Probar inserción de una tabla de prueba
    console.log("\n4. Probando inserción de tabla de prueba...");
    const testResult = await pool
      .request()
      .input("databaseName", "TEST_DB")
      .input("tableName", "TEST_TABLE")
      .input("description", "Tabla de prueba")
      .input("userId", 1).query(`
        INSERT INTO ACTIVATED_TABLES (DatabaseName, TableName, Description, CreatedBy, UpdatedBy)
        OUTPUT INSERTED.Id
        VALUES (@databaseName, @tableName, @description, @userId, @userId)
      `);

    console.log(
      "Tabla de prueba insertada con ID:",
      testResult.recordset[0].Id
    );

    // 5. Verificar que aparece en la consulta simple de tablas activadas
    console.log("\n5. Verificando consulta simple de tablas activadas...");
    const activatedResult = await pool.request().query(`
      SELECT 
        Id,
        DatabaseName,
        TableName,
        IsActive,
        Description,
        CreatedAt,
        UpdatedAt
      FROM ACTIVATED_TABLES
      WHERE IsActive = 1
      ORDER BY DatabaseName, TableName
    `);

    console.log(
      `Tablas activadas encontradas: ${activatedResult.recordset.length}`
    );
    activatedResult.recordset.forEach((table) => {
      console.log(
        `  - ${table.DatabaseName}.${table.TableName} (${table.Description})`
      );
    });

    // 6. Limpiar tabla de prueba
    console.log("\n6. Limpiando tabla de prueba...");
    await pool
      .request()
      .input("databaseName", "TEST_DB")
      .input("tableName", "TEST_TABLE").query(`
        DELETE FROM ACTIVATED_TABLES 
        WHERE DatabaseName = @databaseName AND TableName = @tableName
      `);

    console.log("✅ Pruebas completadas exitosamente");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    process.exit(0);
  }
}

testActivatedTablesSimple();
