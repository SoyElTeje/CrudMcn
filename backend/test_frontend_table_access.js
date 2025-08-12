const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
let authToken = "";

// Función para hacer login
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: "user",
      password: "user",
    });

    authToken = response.data.token;
    console.log("✅ Login exitoso");
    return authToken;
  } catch (error) {
    console.error("❌ Error en login:", error.response?.data || error.message);
    throw error;
  }
}

// Función para simular el acceso del frontend a una tabla activada
async function testFrontendTableAccess() {
  try {
    console.log("🔍 Simulando acceso del frontend a tabla activada...");

    // 1. Obtener tablas activadas
    const activatedTablesResponse = await axios.get(
      `${BASE_URL}/activated-tables/activated`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log(
      "📋 Tablas activadas encontradas:",
      activatedTablesResponse.data.length
    );

    if (activatedTablesResponse.data.length === 0) {
      console.log("⚠️  No hay tablas activadas para probar");
      return;
    }

    // 2. Seleccionar la primera tabla activada
    const testTable = activatedTablesResponse.data[0];
    console.log(
      `🎯 Probando con tabla: ${testTable.DatabaseName}.${testTable.TableName}`
    );

    // 3. Simular la llamada que hace el frontend
    const response = await axios.get(
      `${BASE_URL}/databases/${testTable.DatabaseName}/tables/${testTable.TableName}/records`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          limit: 100,
          offset: 0,
        },
      }
    );

    console.log("✅ Acceso exitoso desde el frontend");
    console.log(`📊 Registros encontrados: ${response.data.count}`);
    console.log("📋 Datos de respuesta:", {
      database: response.data.database,
      table: response.data.table,
      count: response.data.count,
      dataLength: response.data.data.length,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error en acceso del frontend:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);

    // Si es un error 400, mostrar más detalles
    if (error.response?.status === 400) {
      console.log("\n🔍 Detalles del error 400:");
      console.log("URL:", error.config?.url);
      console.log("Method:", error.config?.method);
      console.log("Headers:", error.config?.headers);
      console.log("Params:", error.config?.params);
    }

    throw error;
  }
}

// Función principal
async function main() {
  try {
    console.log("🚀 Iniciando prueba de acceso del frontend...\n");

    // 1. Login
    await login();
    console.log("");

    // 2. Probar acceso del frontend
    await testFrontendTableAccess();
    console.log("");

    console.log("✅ Prueba completada exitosamente");
  } catch (error) {
    console.error("💥 Error en la prueba:", error.message);
  }
}

// Ejecutar la prueba
main();
