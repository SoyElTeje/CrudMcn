require("dotenv").config();
const axios = require("axios");

async function testEndpoint() {
  try {
    console.log("🔍 Probando endpoint de tablas...");

    // Primero hacer login para obtener token
    const loginResponse = await axios.post(
      "http://localhost:3001/api/auth/login",
      {
        username: "admin",
        password: "admin",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso, token obtenido");

    // Probar endpoint de bases de datos
    console.log("\n📊 Probando /api/databases...");
    const databasesResponse = await axios.get(
      "http://localhost:3001/api/databases",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Bases de datos accesibles:", databasesResponse.data);

    // Probar endpoint de tablas para BI_Editor
    console.log("\n📋 Probando /api/databases/BI_Editor/tables...");
    try {
      const tablesResponse = await axios.get(
        "http://localhost:3001/api/databases/BI_Editor/tables",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ Tablas de BI_Editor:", tablesResponse.data);
    } catch (error) {
      console.log("❌ Error obteniendo tablas de BI_Editor:");
      console.log("Status:", error.response?.status);
      console.log("Error:", error.response?.data);
    }

    // Probar endpoint de tablas activadas
    console.log("\n🎯 Probando /api/activated-tables/activated...");
    try {
      const activatedResponse = await axios.get(
        "http://localhost:3001/api/activated-tables/activated",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ Tablas activadas:", activatedResponse.data);
    } catch (error) {
      console.log("❌ Error obteniendo tablas activadas:");
      console.log("Status:", error.response?.status);
      console.log("Error:", error.response?.data);
    }
  } catch (error) {
    console.error("❌ Error general:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }
  }
}

testEndpoint();
