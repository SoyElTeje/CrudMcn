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

async function testValidationSystem() {
  try {
    console.log("🧪 Probando sistema de validación de condiciones...");

    // 1. Obtener token de admin
    console.log("\n1. Obteniendo token de admin...");
    const token = await getAdminToken();
    console.log("✅ Token obtenido correctamente");

    const api = makeAuthenticatedRequest(token);

    // 2. Obtener bases de datos disponibles
    console.log("\n2. Obteniendo bases de datos disponibles...");
    const databasesResponse = await api.get("/api/activated-tables/databases");
    console.log("✅ Bases de datos obtenidas:", databasesResponse.data);

    if (databasesResponse.data.length === 0) {
      console.log("❌ No hay bases de datos disponibles para probar");
      return;
    }

    const testDatabase = databasesResponse.data[0].DatabaseName;

    // 3. Obtener tablas de la base de datos
    console.log(`\n3. Obteniendo tablas de ${testDatabase}...`);
    const tablesResponse = await api.get(
      `/api/activated-tables/tables/${testDatabase}`
    );
    console.log("✅ Tablas obtenidas:", tablesResponse.data);

    if (tablesResponse.data.length === 0) {
      console.log("❌ No hay tablas disponibles para probar");
      return;
    }

    const testTable = tablesResponse.data[0].TableName;

    // 4. Probar validación con datos que deberían fallar
    console.log(
      `\n4. Probando validación con datos inválidos en ${testDatabase}.${testTable}...`
    );

    // Datos de prueba que probablemente fallen en validación
    const invalidData = {
      // Intentar insertar datos que probablemente no cumplan las condiciones
      testField: "valor_invalido",
      numericField: "no_es_numero",
      dateField: "fecha_invalida",
      requiredField: "", // Campo requerido vacío
    };

    try {
      await api.post(
        `/api/databases/${testDatabase}/tables/${testTable}/records`,
        {
          record: invalidData,
        }
      );
      console.log(
        "❌ La validación no detectó errores cuando debería haberlos"
      );
    } catch (error) {
      if (
        error.response?.data?.details &&
        Array.isArray(error.response.data.details)
      ) {
        console.log("✅ Validación funcionando correctamente!");
        console.log("📋 Errores detectados:");
        error.response.data.details.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      } else {
        console.log("⚠️ Error de validación, pero no en el formato esperado:");
        console.log("Error:", error.response?.data || error.message);
      }
    }

    // 5. Probar endpoint de validación específico
    console.log(`\n5. Probando endpoint de validación específico...`);
    try {
      const validationResponse = await api.post(
        `/api/activated-tables/validate/${testDatabase}/${testTable}`,
        {
          data: invalidData,
        }
      );
      console.log("✅ Respuesta de validación:", validationResponse.data);
    } catch (error) {
      console.log(
        "⚠️ Error en endpoint de validación:",
        error.response?.data || error.message
      );
    }

    console.log("\n🎉 Pruebas de validación completadas!");
  } catch (error) {
    console.error(
      "❌ Error en las pruebas:",
      error.response?.data || error.message
    );
  }
}

testValidationSystem();
