const axios = require("axios");

const BASE_URL = "http://localhost:3001";
let authToken = null;

// Función para obtener token de admin
async function getAdminToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    console.log("✅ Token obtenido correctamente");
    return response.data.token;
  } catch (error) {
    console.error(
      "❌ Error obteniendo token:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para probar múltiples condiciones en el mismo campo
async function testMultipleConditions() {
  try {
    console.log("🧪 Probando múltiples condiciones para el mismo campo...");

    // 1. Obtener token de admin
    authToken = await getAdminToken();

    // 2. Crear múltiples condiciones para el campo ID
    const multipleConditions = [
      {
        columnName: "ID",
        dataType: "int",
        conditionType: "min",
        conditionValue: '{"value":"1"}',
        isRequired: false,
      },
      {
        columnName: "ID",
        dataType: "int",
        conditionType: "max",
        conditionValue: '{"value":"1000"}',
        isRequired: false,
      },
      {
        columnName: "ID",
        dataType: "int",
        conditionType: "required",
        conditionValue: '{"value":true}',
        isRequired: true,
      },
    ];

    console.log("\n📤 Enviando múltiples condiciones para el campo ID...");
    console.log(
      "Condiciones a enviar:",
      JSON.stringify(multipleConditions, null, 2)
    );

    const response = await axios.put(
      `${BASE_URL}/api/activated-tables/conditions/BI_Editor/TEST_ABM`,
      {
        conditions: multipleConditions,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Condiciones creadas exitosamente");
    console.log("Respuesta:", response.data);

    // 3. Verificar que se obtengan todas las condiciones
    console.log("\n📥 Obteniendo condiciones para verificar...");
    const getResponse = await axios.get(
      `${BASE_URL}/api/activated-tables/conditions/BI_Editor/TEST_ABM`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Condiciones obtenidas:");
    console.log("Total de condiciones:", getResponse.data.length);

    // Agrupar por campo
    const conditionsByField = {};
    getResponse.data.forEach((condition) => {
      if (!conditionsByField[condition.columnName]) {
        conditionsByField[condition.columnName] = [];
      }
      conditionsByField[condition.columnName].push(condition);
    });

    Object.entries(conditionsByField).forEach(
      ([fieldName, fieldConditions]) => {
        console.log(`\n🔍 Campo: ${fieldName}`);
        console.log(`   Condiciones: ${fieldConditions.length}`);
        fieldConditions.forEach((condition, index) => {
          console.log(
            `   ${index + 1}. ${condition.conditionType}: ${
              condition.conditionValue
            }`
          );
        });
      }
    );

    console.log(
      "\n🎉 ¡Prueba exitosa! Se pueden crear múltiples condiciones para el mismo campo"
    );
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );

    if (error.response) {
      console.error("📊 Detalles del error:");
      console.error("  - Status:", error.response.status);
      console.error("  - Data:", error.response.data);
    }
  }
}

// Ejecutar la prueba
testMultipleConditions();





















