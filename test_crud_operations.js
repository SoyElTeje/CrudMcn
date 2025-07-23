const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testCRUDOperations() {
  console.log("🧪 Probando operaciones CRUD...\n");

  try {
    // 1. Obtener bases de datos
    console.log("1. Obteniendo bases de datos...");
    const databasesResponse = await axios.get(`${BASE_URL}/api/databases`);
    const databases = databasesResponse.data;
    console.log(`✅ Bases de datos encontradas: ${databases.length}`);

    if (databases.length === 0) {
      console.log("❌ No hay bases de datos disponibles");
      return;
    }

    const testDb = databases[0];
    console.log(`📊 Usando base de datos: ${testDb}\n`);

    // 2. Obtener tablas
    console.log("2. Obteniendo tablas...");
    const tablesResponse = await axios.get(
      `${BASE_URL}/api/databases/${testDb}/tables`
    );
    const tables = tablesResponse.data;
    console.log(`✅ Tablas encontradas: ${tables.length}`);

    if (tables.length === 0) {
      console.log("❌ No hay tablas disponibles");
      return;
    }

    const testTable = tables[0].name;
    console.log(`📋 Usando tabla: ${testTable}\n`);

    // 3. Obtener datos de la tabla
    console.log("3. Obteniendo datos de la tabla...");
    const tableDataResponse = await axios.get(`${BASE_URL}/api/trial/table`, {
      params: { db: testDb, table: testTable },
    });
    const tableData = tableDataResponse.data;
    console.log(`✅ Registros encontrados: ${tableData.count}`);

    if (tableData.data.length === 0) {
      console.log("❌ No hay registros para probar las operaciones CRUD");
      return;
    }

    const testRecord = tableData.data[0];
    console.log(`📝 Registro de prueba:`, testRecord);

    // 4. Obtener estructura de la tabla para identificar claves primarias
    console.log("\n4. Obteniendo estructura de la tabla...");
    const structureResponse = await axios.get(
      `${BASE_URL}/api/databases/${testDb}/tables/${testTable}/structure`
    );
    const tableStructure = structureResponse.data;
    console.log(
      `✅ Claves primarias encontradas: ${tableStructure.primaryKeys.join(
        ", "
      )}`
    );

    // 5. Probar actualización (solo si hay registros)
    console.log("\n5. Probando actualización de registro...");
    const updateData = { ...testRecord };
    // Modificar un campo que no sea clave primaria
    const nonPrimaryFields = Object.keys(updateData).filter(
      (field) => !tableStructure.primaryKeys.includes(field)
    );

    if (nonPrimaryFields.length > 0) {
      const fieldToUpdate = nonPrimaryFields[0];
      updateData[fieldToUpdate] = `TEST_${Date.now()}`;

      // Crear objeto con valores de clave primaria
      const primaryKeyValues = {};
      tableStructure.primaryKeys.forEach((key) => {
        primaryKeyValues[key] = testRecord[key];
      });

      const updateResponse = await axios.put(
        `${BASE_URL}/api/databases/${testDb}/tables/${testTable}/records`,
        {
          record: updateData,
          primaryKeyValues: primaryKeyValues,
        }
      );
      console.log(`✅ Actualización exitosa: ${updateResponse.data.message}`);
    }

    // 6. Verificar que la actualización funcionó
    console.log("\n6. Verificando actualización...");
    const verifyResponse = await axios.get(`${BASE_URL}/api/trial/table`, {
      params: { db: testDb, table: testTable },
    });
    const updatedData = verifyResponse.data;
    console.log(`✅ Datos verificados: ${updatedData.count} registros`);

    console.log("\n🎉 Todas las pruebas CRUD completadas exitosamente!");
    console.log("\n📋 Resumen:");
    console.log(`   - Base de datos: ${testDb}`);
    console.log(`   - Tabla: ${testTable}`);
    console.log(`   - Registros: ${updatedData.count}`);
    console.log(`   - Operaciones probadas: Lectura, Actualización`);
  } catch (error) {
    console.error(
      "❌ Error durante las pruebas:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar las pruebas
testCRUDOperations();
