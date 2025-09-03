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

// Función para simular exactamente lo que envía el frontend
async function simulateFrontendRequest() {
  try {
    console.log("🧪 Simulando request del frontend...");

    // 1. Obtener token de admin
    authToken = await getAdminToken();

    // 2. Simular la condición exacta que envía el frontend
    // Según el log del frontend: {columnName: 'ID', dataType: 'int', conditionType: 'min', conditionValue: '{"value":"1"}', isRequired: false}
    const frontendCondition = {
      columnName: "ID",
      dataType: "int",
      conditionType: "min",
      conditionValue: '{"value":"1"}',
      isRequired: false,
    };

    console.log(
      "📋 Condición del frontend:",
      JSON.stringify(frontendCondition, null, 2)
    );

    // 3. Verificar que todos los campos estén presentes y sean válidos
    console.log("🔍 Validando campos:");
    console.log(
      "  - columnName:",
      typeof frontendCondition.columnName,
      frontendCondition.columnName
    );
    console.log(
      "  - dataType:",
      typeof frontendCondition.dataType,
      frontendCondition.dataType
    );
    console.log(
      "  - conditionType:",
      typeof frontendCondition.conditionType,
      frontendCondition.conditionType
    );
    console.log(
      "  - conditionValue:",
      typeof frontendCondition.conditionValue,
      frontendCondition.conditionValue
    );
    console.log(
      "  - isRequired:",
      typeof frontendCondition.isRequired,
      frontendCondition.isRequired
    );

    // 4. Intentar actualizar condiciones
    console.log("\n📤 Enviando request al backend...");
    const response = await axios.put(
      `${BASE_URL}/api/activated-tables/conditions/BI_Editor/TEST_ABM`,
      {
        conditions: [frontendCondition],
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Respuesta del backend:", response.data);
  } catch (error) {
    console.error(
      "❌ Error en la simulación:",
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

// Ejecutar la simulación
simulateFrontendRequest();

