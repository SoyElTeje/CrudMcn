const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testBulkDeleteOperations() {
  console.log("🧪 Iniciando pruebas de eliminación múltiple...\n");

  try {
    // 1. Obtener bases de datos
    console.log("1️⃣ Obteniendo bases de datos...");
    const databasesResponse = await axios.get(`${BASE_URL}/api/databases`);
    const databases = databasesResponse.data;

    if (databases.length === 0) {
      console.log("❌ No se encontraron bases de datos");
      return;
    }

    const testDb = databases[0];
    console.log(`✅ Base de datos seleccionada: ${testDb}`);

    // 2. Obtener tablas
    console.log("\n2️⃣ Obteniendo tablas...");
    const tablesResponse = await axios.get(
      `${BASE_URL}/api/databases/${testDb}/tables`
    );
    const tables = tablesResponse.data;

    if (tables.length === 0) {
      console.log("❌ No se encontraron tablas");
      return;
    }

    const testTable = tables[0].name;
    console.log(`✅ Tabla seleccionada: ${testTable}`);

    // 3. Obtener datos de la tabla
    console.log("\n3️⃣ Obteniendo datos de la tabla...");
    const tableDataResponse = await axios.get(`${BASE_URL}/api/trial/table`, {
      params: { db: testDb, table: testTable },
    });
    const tableData = tableDataResponse.data;

    if (tableData.data.length === 0) {
      console.log(
        "❌ La tabla está vacía, no se pueden realizar pruebas de eliminación"
      );
      return;
    }

    console.log(`✅ Encontrados ${tableData.data.length} registros`);

    // 4. Obtener estructura de la tabla
    console.log("\n4️⃣ Obteniendo estructura de la tabla...");
    const structureResponse = await axios.get(
      `${BASE_URL}/api/databases/${testDb}/tables/${testTable}/structure`
    );
    const tableStructure = structureResponse.data;

    if (tableStructure.primaryKeys.length === 0) {
      console.log(
        "❌ La tabla no tiene claves primarias, no se pueden realizar pruebas de eliminación"
      );
      return;
    }

    console.log(
      `✅ Claves primarias encontradas: ${tableStructure.primaryKeys.join(
        ", "
      )}`
    );

    // 5. Probar eliminación múltiple
    console.log("\n5️⃣ Probando eliminación múltiple...");

    // Seleccionar los primeros 2 registros para eliminar
    const recordsToDelete = tableData.data.slice(0, 2);
    console.log(
      `📝 Registros seleccionados para eliminar: ${recordsToDelete.length}`
    );

    // Mostrar información de los registros a eliminar
    recordsToDelete.forEach((record, index) => {
      console.log(`   Registro ${index + 1}:`);
      tableStructure.primaryKeys.forEach((key) => {
        console.log(`     ${key}: ${record[key]}`);
      });
    });

    // Realizar eliminación múltiple
    const bulkDeleteResponse = await axios.delete(
      `${BASE_URL}/api/databases/${testDb}/tables/${testTable}/records/bulk`,
      {
        data: { records: recordsToDelete },
      }
    );

    console.log("✅ Eliminación múltiple exitosa");
    console.log(`📊 Resultado: ${bulkDeleteResponse.data.message}`);
    console.log(
      `📊 Registros afectados: ${bulkDeleteResponse.data.affectedRows}`
    );

    // 6. Verificar eliminación
    console.log("\n6️⃣ Verificando eliminación...");
    const verifyResponse = await axios.get(`${BASE_URL}/api/trial/table`, {
      params: { db: testDb, table: testTable },
    });
    const verifyData = verifyResponse.data;

    console.log(`📊 Registros restantes: ${verifyData.data.length}`);
    console.log(
      `📊 Registros eliminados: ${
        tableData.data.length - verifyData.data.length
      }`
    );

    if (
      verifyData.data.length ===
      tableData.data.length - recordsToDelete.length
    ) {
      console.log(
        "✅ Verificación exitosa: Los registros fueron eliminados correctamente"
      );
    } else {
      console.log(
        "❌ Error en la verificación: No se eliminaron todos los registros esperados"
      );
    }

    // 7. Probar eliminación individual
    console.log("\n7️⃣ Probando eliminación individual...");

    if (verifyData.data.length > 0) {
      const recordToDelete = verifyData.data[0];
      console.log("📝 Registro seleccionado para eliminación individual:");
      tableStructure.primaryKeys.forEach((key) => {
        console.log(`   ${key}: ${recordToDelete[key]}`);
      });

      // Crear objeto con valores de clave primaria
      const primaryKeyValues = {};
      tableStructure.primaryKeys.forEach((key) => {
        primaryKeyValues[key] = recordToDelete[key];
      });

      const individualDeleteResponse = await axios.delete(
        `${BASE_URL}/api/databases/${testDb}/tables/${testTable}/records`,
        {
          data: { primaryKeyValues },
        }
      );

      console.log("✅ Eliminación individual exitosa");
      console.log(`📊 Resultado: ${individualDeleteResponse.data.message}`);
    } else {
      console.log(
        "⚠️ No hay registros restantes para probar eliminación individual"
      );
    }

    console.log("\n🎉 Todas las pruebas completadas exitosamente!");
  } catch (error) {
    console.error(
      "\n❌ Error durante las pruebas:",
      error.response?.data?.error || error.message
    );

    if (error.response?.data?.details) {
      console.error("📋 Detalles del error:", error.response.data.details);
    }
  }
}

// Ejecutar las pruebas
testBulkDeleteOperations();
