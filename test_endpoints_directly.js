const axios = require("axios");

// Configuración base
const BASE_URL = "http://localhost:3001";
const API_URL = `${BASE_URL}/api`;

// Función para hacer login y obtener token
async function login() {
  try {
    console.log("🔐 Intentando hacer login...");

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: "admin",
      password: "admin",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso, token obtenido");

    return token;
  } catch (error) {
    console.error("❌ Error en login:", error.response?.data || error.message);
    throw error;
  }
}

// Función para probar endpoint de bases de datos
async function testDatabases(token) {
  try {
    console.log("\n📚 Probando endpoint /api/databases...");

    const response = await axios.get(`${API_URL}/databases`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Endpoint /api/databases exitoso");
    console.log("📋 Bases de datos disponibles:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error en /api/databases:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para probar endpoint de tablas activadas
async function testActivatedTables(token) {
  try {
    console.log("\n📋 Probando endpoint /api/activated-tables/activated...");

    const response = await axios.get(`${API_URL}/activated-tables/activated`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Endpoint /api/activated-tables/activated exitoso");
    console.log("📋 Tablas activadas:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error en /api/activated-tables/activated:",
      error.response?.data || error.message
    );
    console.error("🔍 Detalles del error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
}

// Función para probar endpoint de usuarios
async function testUsers(token) {
  try {
    console.log("\n👥 Probando endpoint /api/auth/users...");

    const response = await axios.get(`${API_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Endpoint /api/auth/users exitoso");
    console.log("📋 Usuarios:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error en /api/auth/users:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para probar endpoint de tablas de una base de datos específica
async function testTablesByDatabase(token, databaseName) {
  try {
    console.log(
      `\n📊 Probando endpoint /api/databases/${databaseName}/tables...`
    );

    const response = await axios.get(
      `${API_URL}/databases/${databaseName}/tables`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Endpoint /api/databases/${databaseName}/tables exitoso`);
    console.log(`📋 Tablas en ${databaseName}:`, response.data);

    return response.data;
  } catch (error) {
    console.error(
      `❌ Error en /api/databases/${databaseName}/tables:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función principal
async function testAllEndpoints() {
  try {
    console.log("🚀 Iniciando pruebas de endpoints...\n");

    // 1. Login
    const token = await login();

    // 2. Probar endpoint de usuarios
    await testUsers(token);

    // 3. Probar endpoint de bases de datos
    const databases = await testDatabases(token);

    // 4. Probar endpoint de tablas activadas
    await testActivatedTables(token);

    // 5. Probar endpoint de tablas para cada base de datos
    for (const db of databases) {
      if (db.name !== "APPDATA") {
        // Saltar APPDATA
        try {
          await testTablesByDatabase(token, db.name);
        } catch (error) {
          console.log(`⚠️ No se pudieron obtener tablas de ${db.name}`);
        }
      }
    }

    console.log("\n🎉 Todas las pruebas completadas!");
  } catch (error) {
    console.error("\n💥 Error general en las pruebas:", error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAllEndpoints();
}

module.exports = { testAllEndpoints };
