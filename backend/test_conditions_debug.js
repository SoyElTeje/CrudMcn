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

// Función para probar la actualización de condiciones
async function testUpdateConditions() {
  try {
    console.log("🧪 Probando actualización de condiciones...");

    // 1. Obtener token de admin
    authToken = await getAdminToken();

    // 2. Crear una condición de prueba
    const testCondition = {
      columnName: "ID",
      dataType: "int",
      conditionType: "min",
      conditionValue: '{"value":"1"}',
      isRequired: false,
    };

    console.log(
      "📋 Condición de prueba:",
      JSON.stringify(testCondition, null, 2)
    );

    // 3. Intentar actualizar condiciones
    const response = await axios.put(
      `${BASE_URL}/api/activated-tables/conditions/BI_Editor/TEST_ABM`,
      {
        conditions: [testCondition],
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Condiciones actualizadas exitosamente:", response.data);
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );

    if (error.response) {
      console.error("📊 Detalles del error:");
      console.error("  - Status:", error.response.status);
      console.error("  - Data:", error.response.data);
      console.error("  - Headers:", error.response.headers);
    }
  }
}

// Ejecutar la prueba
testUpdateConditions();
