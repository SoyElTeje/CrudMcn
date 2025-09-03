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

// Función para probar la obtención de condiciones
async function testGetConditions() {
  try {
    console.log("🧪 Probando obtención de condiciones...");

    // 1. Obtener token de admin
    authToken = await getAdminToken();

    // 2. Obtener condiciones de la tabla TEST_ABM
    console.log("\n📤 Obteniendo condiciones de BI_Editor.TEST_ABM...");
    const response = await axios.get(
      `${BASE_URL}/api/activated-tables/conditions/BI_Editor/TEST_ABM`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Respuesta del backend:", response.data);
    console.log("📊 Tipo de datos:", typeof response.data);
    console.log("📊 Es array:", Array.isArray(response.data));
    console.log("📊 Longitud:", response.data?.length);

    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      console.log("\n🔍 Detalles de la primera condición:");
      const firstCondition = response.data[0];
      console.log("  - Id:", firstCondition.Id);
      console.log("  - ColumnName:", firstCondition.ColumnName);
      console.log("  - DataType:", firstCondition.DataType);
      console.log("  - ConditionType:", firstCondition.ConditionType);
      console.log("  - ConditionValue:", firstCondition.ConditionValue);
      console.log("  - IsRequired:", firstCondition.IsRequired);
      console.log("  - IsActive:", firstCondition.IsActive);
    } else {
      console.log("⚠️ No se encontraron condiciones");
    }
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
testGetConditions();

