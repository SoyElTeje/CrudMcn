const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testEndpoint() {
  console.log("🧪 Probando endpoint HTTP directamente...\n");

  try {
    // 1. Login como admin
    console.log("1️⃣ Login como admin...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    console.log("✅ Login admin exitoso");

    // 2. Probar endpoint de permisos para user2 (ID: 3)
    console.log("\n2️⃣ Probando endpoint /api/auth/users/3/permissions...");
    const permissionsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/3/permissions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("📋 Respuesta del endpoint:");
    console.log(JSON.stringify(permissionsResponse.data, null, 2));

    // 3. Verificar el status code
    console.log(`\n3️⃣ Status code: ${permissionsResponse.status}`);

    console.log("\n🎉 Prueba del endpoint completada!");
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
    }
  }
}

testEndpoint();
