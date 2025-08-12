const { getPool } = require("./db");

async function testActivatedTables() {
  try {
    console.log("🔍 Probando sistema de activación de tablas...");

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

    // 2. Verificar estructura de ACTIVATED_TABLES
    console.log("\n2. Verificando estructura de ACTIVATED_TABLES...");
    const structureResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ACTIVATED_TABLES'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("Estructura de ACTIVATED_TABLES:");
    structureResult.recordset.forEach((col) => {
      console.log(
        `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`
      );
    });

    // 3. Verificar datos existentes
    console.log("\n3. Verificando datos existentes...");
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

    // 5. Verificar que aparece en la consulta de tablas activadas
    console.log("\n5. Verificando consulta de tablas activadas...");
    const activatedResult = await pool.request().query(`
      SELECT 
        at.Id,
        at.DatabaseName,
        at.TableName,
        at.IsActive,
        at.Description,
        at.CreatedAt,
        at.UpdatedAt,
        u.Username as CreatedByUsername,
        u2.Username as UpdatedByUsername
      FROM ACTIVATED_TABLES at
      LEFT JOIN USERS u ON at.CreatedBy = u.Id
      LEFT JOIN USERS u2 ON at.UpdatedBy = u2.Id
      WHERE at.IsActive = 1
      ORDER BY at.DatabaseName, at.TableName
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

testActivatedTables();
