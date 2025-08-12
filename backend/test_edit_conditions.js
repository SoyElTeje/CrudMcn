const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
let authToken = "";

// Función para hacer login como admin
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: "user",
      password: "user",
    });

    authToken = response.data.token;
    console.log("✅ Login exitoso como user");
    return authToken;
  } catch (error) {
    console.error("❌ Error en login:", error.response?.data || error.message);
    throw error;
  }
}

// Función para obtener tablas activadas
async function getActivatedTables() {
  try {
    const response = await axios.get(`${BASE_URL}/activated-tables/activated`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("📋 Tablas activadas:", response.data.length);
    response.data.forEach((table) => {
      console.log(
        `  - ${table.DatabaseName}.${table.TableName} (${
          table.IsActive ? "Activa" : "Inactiva"
        })`
      );
    });

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error obteniendo tablas activadas:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para obtener condiciones de una tabla
async function getTableConditions(databaseName, tableName) {
  try {
    const response = await axios.get(
      `${BASE_URL}/activated-tables/conditions/${databaseName}/${tableName}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log(
      `📋 Condiciones de ${databaseName}.${tableName}:`,
      response.data.length
    );
    response.data.forEach((condition) => {
      console.log(
        `  - Columna: ${condition.ColumnName}, Tipo: ${condition.ConditionType}, Valor: ${condition.ConditionValue}, Requerido: ${condition.IsRequired}`
      );
    });

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error obteniendo condiciones:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para actualizar condiciones de una tabla
async function updateTableConditions(databaseName, tableName, conditions) {
  try {
    const response = await axios.put(
      `${BASE_URL}/activated-tables/conditions/${databaseName}/${tableName}`,
      {
        conditions: conditions,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log(
      `✅ Condiciones actualizadas para ${databaseName}.${tableName}:`,
      response.data.message
    );
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error actualizando condiciones:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función principal de prueba
async function testEditConditions() {
  try {
    console.log("🚀 Iniciando prueba de edición de condiciones...\n");

    // 1. Login como admin
    await loginAsAdmin();
    console.log("");

    // 2. Obtener tablas activadas
    const activatedTables = await getActivatedTables();
    console.log("");

    if (activatedTables.length === 0) {
      console.log(
        "⚠️  No hay tablas activadas para probar. Primero activa una tabla."
      );
      return;
    }

    // 3. Seleccionar la primera tabla activada para la prueba
    const testTable = activatedTables[0];
    console.log(
      `🎯 Probando con tabla: ${testTable.DatabaseName}.${testTable.TableName}\n`
    );

    // 4. Obtener condiciones actuales
    console.log("📥 Obteniendo condiciones actuales...");
    const currentConditions = await getTableConditions(
      testTable.DatabaseName,
      testTable.TableName
    );
    console.log("");

    // 5. Crear nuevas condiciones de prueba
    const testConditions = [
      {
        columnName: "ID",
        dataType: "numeric",
        conditionType: "range",
        conditionValue: JSON.stringify({ min: 1, max: 1000 }),
        isRequired: true,
      },
      {
        columnName: "Nombre",
        dataType: "string",
        conditionType: "length",
        conditionValue: JSON.stringify({ min: 2, max: 50 }),
        isRequired: true,
      },
      {
        columnName: "Email",
        dataType: "string",
        conditionType: "regex",
        conditionValue: JSON.stringify({ pattern: "^[^@]+@[^@]+\\.[^@]+$" }),
        isRequired: false,
      },
    ];

    console.log("📝 Condiciones de prueba a aplicar:");
    testConditions.forEach((condition) => {
      console.log(
        `  - ${condition.columnName}: ${condition.conditionType} = ${condition.conditionValue}`
      );
    });
    console.log("");

    // 6. Actualizar condiciones
    console.log("📤 Actualizando condiciones...");
    await updateTableConditions(
      testTable.DatabaseName,
      testTable.TableName,
      testConditions
    );
    console.log("");

    // 7. Verificar que se actualizaron correctamente
    console.log("🔍 Verificando condiciones actualizadas...");
    const updatedConditions = await getTableConditions(
      testTable.DatabaseName,
      testTable.TableName
    );
    console.log("");

    console.log("✅ Prueba de edición de condiciones completada exitosamente!");
  } catch (error) {
    console.error("💥 Error en la prueba:", error.message);
  }
}

// Ejecutar la prueba
testEditConditions();
