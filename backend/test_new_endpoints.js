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

async function testNewEndpoints() {
  try {
    console.log("🧪 Probando nuevos endpoints de activación de tablas...");

    // 1. Obtener token de admin
    console.log("\n1. Obteniendo token de admin...");
    const token = await getAdminToken();
    console.log("✅ Token obtenido correctamente");

    const api = makeAuthenticatedRequest(token);

    // 2. Probar endpoint de bases de datos
    console.log("\n2. Probando endpoint /api/activated-tables/databases...");
    const databasesResponse = await api.get("/api/activated-tables/databases");
    console.log("✅ Bases de datos obtenidas:", databasesResponse.data);

    if (databasesResponse.data.length > 0) {
      const firstDatabase = databasesResponse.data[0].DatabaseName;

      // 3. Probar endpoint de tablas por base de datos
      console.log(
        `\n3. Probando endpoint /api/activated-tables/tables/${firstDatabase}...`
      );
      const tablesResponse = await api.get(
        `/api/activated-tables/tables/${firstDatabase}`
      );
      console.log("✅ Tablas obtenidas:", tablesResponse.data);

      if (tablesResponse.data.length > 0) {
        const firstTable = tablesResponse.data[0].TableName;

        // 4. Probar endpoint de estructura de tabla
        console.log(
          `\n4. Probando endpoint /api/activated-tables/structure/${firstDatabase}/${firstTable}...`
        );
        const structureResponse = await api.get(
          `/api/activated-tables/structure/${firstDatabase}/${firstTable}`
        );
        console.log("✅ Estructura de tabla obtenida:", structureResponse.data);
      }
    }

    // 5. Probar endpoint de tablas activadas
    console.log("\n5. Probando endpoint /api/activated-tables/activated...");
    const activatedResponse = await api.get("/api/activated-tables/activated");
    console.log("✅ Tablas activadas obtenidas:", activatedResponse.data);

    console.log("\n🎉 Todos los endpoints funcionan correctamente!");
  } catch (error) {
    console.error(
      "❌ Error probando endpoints:",
      error.response?.data || error.message
    );
  }
}

testNewEndpoints();
