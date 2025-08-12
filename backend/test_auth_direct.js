const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testAuthDirect() {
  try {
    console.log("🧪 Probando autenticación directamente...");

    // Probar login con admin
    console.log("\n1. Probando login con admin/admin123...");
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: "admin",
        password: "admin",
      });
      console.log("✅ Login exitoso:", response.data);

      // Probar un endpoint protegido
      console.log("\n2. Probando endpoint protegido...");
      const protectedResponse = await axios.get(
        `${BASE_URL}/api/activated-tables/all-tables`,
        {
          headers: {
            Authorization: `Bearer ${response.data.token}`,
          },
        }
      );
      console.log(
        "✅ Endpoint protegido funcionando:",
        protectedResponse.data.length,
        "tablas encontradas"
      );
    } catch (error) {
      console.log("❌ Error en login:", error.response?.data || error.message);
    }
  } catch (error) {
    console.error("❌ Error general:", error.message);
  }
}

if (require.main === module) {
  testAuthDirect();
}

module.exports = { testAuthDirect };
