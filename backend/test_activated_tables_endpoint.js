const axios = require("axios");

const BASE_URL = "http://localhost:3001";

// Función para obtener token de admin
async function getAdminToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin123",
    });
    return response.data.token;
  } catch (error) {
    console.error(
      "Error obteniendo token de admin:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para hacer requests autenticados
function makeAuthenticatedRequest(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

async function testActivatedTablesEndpoint() {
  try {
    console.log("🧪 Probando endpoints de activación de tablas...\n");

    // 1. Obtener token de admin
    console.log("1. Obteniendo token de admin...");
    const adminToken = await getAdminToken();
    const adminApi = makeAuthenticatedRequest(adminToken);
    console.log("✅ Token obtenido correctamente\n");

    // 2. Obtener todas las tablas disponibles
    console.log("2. Obteniendo todas las tablas disponibles...");
    const allTablesResponse = await adminApi.get(
      "/api/activated-tables/all-tables"
    );
    console.log(
      `✅ Se encontraron ${allTablesResponse.data.length} tablas disponibles`
    );
    console.log(
      "Primeras 5 tablas:",
      allTablesResponse.data
        .slice(0, 5)
        .map((t) => `${t.DatabaseName}.${t.TableName}`)
        .join(", "),
      "\n"
    );

    // 3. Obtener tablas activadas
    console.log("3. Obteniendo tablas activadas...");
    const activatedTablesResponse = await adminApi.get(
      "/api/activated-tables/activated"
    );
    console.log(
      `✅ Hay ${activatedTablesResponse.data.length} tablas activadas`
    );
    activatedTablesResponse.data.forEach((table) => {
      console.log(
        `  - ${table.DatabaseName}.${table.TableName} (${table.Description})`
      );
    });
    console.log();

    // 4. Obtener estructura de una tabla específica
    if (allTablesResponse.data.length > 0) {
      const testTable = allTablesResponse.data[0];
      console.log(
        `4. Obteniendo estructura de ${testTable.DatabaseName}.${testTable.TableName}...`
      );
      try {
        const structureResponse = await adminApi.get(
          `/api/activated-tables/structure/${testTable.DatabaseName}/${testTable.TableName}`
        );
        console.log(
          `✅ Estructura obtenida: ${structureResponse.data.length} columnas`
        );
        structureResponse.data.slice(0, 3).forEach((col) => {
          console.log(`  - ${col.ColumnName} (${col.DataType})`);
        });
        console.log();
      } catch (error) {
        console.log(
          `❌ Error obteniendo estructura: ${
            error.response?.data?.error || error.message
          }\n`
        );
      }
    }

    // 5. Probar activación de una tabla nueva
    console.log("5. Probando activación de tabla...");
    const testDbName = "APPDATA";
    const testTableName = "TEST_ACTIVATION";

    try {
      const activateResponse = await adminApi.post(
        "/api/activated-tables/activate",
        {
          databaseName: testDbName,
          tableName: testTableName,
          description: "Tabla de prueba para activación",
          conditions: [],
        }
      );
      console.log("✅ Tabla activada exitosamente:", activateResponse.data);
    } catch (error) {
      console.log(
        `❌ Error activando tabla: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    console.log();

    // 6. Verificar que la tabla aparece en la lista de activadas
    console.log("6. Verificando lista actualizada de tablas activadas...");
    const updatedActivatedResponse = await adminApi.get(
      "/api/activated-tables/activated"
    );
    console.log(
      `✅ Ahora hay ${updatedActivatedResponse.data.length} tablas activadas`
    );
    updatedActivatedResponse.data.forEach((table) => {
      console.log(
        `  - ${table.DatabaseName}.${table.TableName} (${table.Description})`
      );
    });
    console.log();

    // 7. Probar desactivación de la tabla de prueba
    console.log("7. Probando desactivación de tabla...");
    try {
      const deactivateResponse = await adminApi.post(
        "/api/activated-tables/deactivate",
        {
          databaseName: testDbName,
          tableName: testTableName,
        }
      );
      console.log(
        "✅ Tabla desactivada exitosamente:",
        deactivateResponse.data
      );
    } catch (error) {
      console.log(
        `❌ Error desactivando tabla: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    console.log();

    console.log("🎉 Pruebas de endpoints completadas exitosamente!");
  } catch (error) {
    console.error(
      "❌ Error en las pruebas:",
      error.response?.data || error.message
    );
  }
}

testActivatedTablesEndpoint();
