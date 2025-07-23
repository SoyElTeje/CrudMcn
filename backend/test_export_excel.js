const axios = require("axios");

// Configuración
const BASE_URL = "http://localhost:3001";
const TEST_DB = process.env.TEST_DB || "APPDATA";
const TEST_TABLE = process.env.TEST_TABLE || "USERS_TABLE";

// Función para obtener token de autenticación
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    if (response.data.success) {
      return response.data.token;
    } else {
      throw new Error("Login failed");
    }
  } catch (error) {
    console.error(
      "Error getting auth token:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para probar exportación de toda la tabla
async function testExportAllRecords(token) {
  console.log("\n📊 Probando exportación de toda la tabla...");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/export-excel?exportType=all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "stream",
      }
    );

    console.log("✅ Exportación de toda la tabla exitosa");
    console.log("📁 Archivo descargado correctamente");
    console.log("📋 Headers de respuesta:", response.headers);

    return true;
  } catch (error) {
    console.error(
      "❌ Error en exportación de toda la tabla:",
      error.response?.data || error.message
    );
    return false;
  }
}

// Función para probar exportación de página actual
async function testExportCurrentPage(token) {
  console.log("\n📊 Probando exportación de página actual...");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/export-excel?exportType=current_page&limit=5&offset=0`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "stream",
      }
    );

    console.log("✅ Exportación de página actual exitosa");
    console.log("📁 Archivo descargado correctamente");
    console.log("📋 Headers de respuesta:", response.headers);

    return true;
  } catch (error) {
    console.error(
      "❌ Error en exportación de página actual:",
      error.response?.data || error.message
    );
    return false;
  }
}

// Función para probar exportación con parámetros inválidos
async function testExportInvalidParams(token) {
  console.log("\n📊 Probando exportación con parámetros inválidos...");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/export-excel?exportType=current_page`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("❌ No debería haber sido exitoso");
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Error 400 esperado para parámetros inválidos");
      console.log("📋 Mensaje de error:", error.response.data.error);
      return true;
    } else {
      console.error(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

// Función para probar exportación sin autenticación
async function testExportWithoutAuth() {
  console.log("\n📊 Probando exportación sin autenticación...");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/export-excel?exportType=all`
    );

    console.log("❌ No debería haber sido exitoso");
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("✅ Error 401 esperado para falta de autenticación");
      return true;
    } else {
      console.error(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
      return false;
    }
  }
}

// Función principal de pruebas
async function runTests() {
  console.log("🚀 Iniciando pruebas de exportación a Excel");
  console.log(`📋 Base de datos: ${TEST_DB}`);
  console.log(`📋 Tabla: ${TEST_TABLE}`);

  let passedTests = 0;
  let totalTests = 0;

  try {
    // Obtener token de autenticación
    console.log("\n🔐 Obteniendo token de autenticación...");
    const token = await getAuthToken();
    console.log("✅ Token obtenido correctamente");

    // Ejecutar pruebas
    totalTests++;
    if (await testExportAllRecords(token)) passedTests++;

    totalTests++;
    if (await testExportCurrentPage(token)) passedTests++;

    totalTests++;
    if (await testExportInvalidParams(token)) passedTests++;

    totalTests++;
    if (await testExportWithoutAuth()) passedTests++;
  } catch (error) {
    console.error("❌ Error en la ejecución de pruebas:", error.message);
  }

  // Resumen de resultados
  console.log("\n📊 Resumen de pruebas:");
  console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("🎉 ¡Todas las pruebas pasaron exitosamente!");
  } else {
    console.log("⚠️  Algunas pruebas fallaron");
  }
}

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testExportAllRecords,
  testExportCurrentPage,
  testExportInvalidParams,
  testExportWithoutAuth,
};
