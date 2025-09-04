require("dotenv").config();
const axios = require("axios");

async function debugFrontendAuth() {
  try {
    console.log("🔍 Verificando autenticación del frontend...");

    // Simular el proceso de login del frontend
    const loginResponse = await axios.post(
      "http://localhost:3001/api/auth/login",
      {
        username: "admin",
        password: "admin",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Token obtenido:", token.substring(0, 50) + "...");

    // Verificar que el token funciona
    const verifyResponse = await axios.get(
      "http://localhost:3001/api/databases",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(
      "✅ Token válido, bases de datos accesibles:",
      verifyResponse.data.length
    );

    // Probar el endpoint específico que usa el frontend
    const tablesResponse = await axios.get(
      "http://localhost:3001/api/databases/BI_Editor/tables",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(
      "✅ Tablas de BI_Editor obtenidas:",
      tablesResponse.data.length
    );
    console.log("Datos:", JSON.stringify(tablesResponse.data, null, 2));

    // Verificar si hay algún problema con CORS
    console.log("\n🌐 Verificando CORS...");
    try {
      const corsResponse = await axios.options(
        "http://localhost:3001/api/databases",
        {
          headers: {
            Origin: "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
          },
        }
      );
      console.log("✅ CORS configurado correctamente");
    } catch (error) {
      console.log("⚠️ CORS puede tener problemas:", error.message);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }
  }
}

debugFrontendAuth();
