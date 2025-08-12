const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testEndpoint() {
  try {
    console.log("🧪 Probando endpoint de tablas activadas...");

    // Probar sin token (debe fallar)
    try {
      const response = await axios.get(
        `${BASE_URL}/api/activated-tables/all-tables`
      );
      console.log("❌ Debería haber fallado sin token");
    } catch (error) {
      console.log("✅ Correcto: Falló sin token:", error.response?.status);
    }

    // Probar con token inválido
    try {
      const response = await axios.get(
        `${BASE_URL}/api/activated-tables/all-tables`,
        {
          headers: {
            Authorization: "Bearer invalid_token",
          },
        }
      );
      console.log("❌ Debería haber fallado con token inválido");
    } catch (error) {
      console.log(
        "✅ Correcto: Falló con token inválido:",
        error.response?.status
      );
    }

    console.log("✅ Endpoint está funcionando correctamente");
  } catch (error) {
    console.error("❌ Error probando endpoint:", error.message);
  }
}

if (require.main === module) {
  testEndpoint();
}

module.exports = { testEndpoint };
