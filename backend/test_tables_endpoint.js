const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testTablesEndpoint() {
  try {
    console.log("🧪 Probando endpoint de tablas...\n");

    // 1. Login como usuario testuser
    console.log("1️⃣ Login como usuario testuser...");
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testuser",
      password: "testpass",
    });
    const userToken = userLoginResponse.data.token;
    console.log("✅ Login exitoso");

    // 2. Probar acceso a tablas de BD_ABM1
    console.log("\n2️⃣ Probando acceso a tablas de BD_ABM1...");
    try {
      const tablesResponse = await axios.get(
        `${BASE_URL}/api/databases/BD_ABM1/tables`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log(
        `✅ Usuario puede acceder a ${tablesResponse.data.length} tablas en BD_ABM1:`,
        tablesResponse.data
      );
    } catch (error) {
      console.log(
        "❌ Error accediendo a tablas de BD_ABM1:",
        error.response?.data?.error
      );
    }

    // 3. Probar acceso a tablas de BD_ABM2
    console.log("\n3️⃣ Probando acceso a tablas de BD_ABM2...");
    try {
      const tablesResponse = await axios.get(
        `${BASE_URL}/api/databases/BD_ABM2/tables`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log(
        `✅ Usuario puede acceder a ${tablesResponse.data.length} tablas en BD_ABM2:`,
        tablesResponse.data
      );
    } catch (error) {
      console.log(
        "❌ Error accediendo a tablas de BD_ABM2:",
        error.response?.data?.error
      );
    }

    // 4. Probar acceso a APPDATA (sin permisos)
    console.log("\n4️⃣ Probando acceso a APPDATA (sin permisos)...");
    try {
      const tablesResponse = await axios.get(
        `${BASE_URL}/api/databases/APPDATA/tables`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log(
        `✅ Usuario puede acceder a ${tablesResponse.data.length} tablas en APPDATA:`,
        tablesResponse.data
      );
    } catch (error) {
      console.log(
        "✅ Usuario correctamente bloqueado de APPDATA:",
        error.response?.data?.error
      );
    }

    console.log("\n🎉 Pruebas completadas!");
  } catch (error) {
    console.error(
      "❌ Error en las pruebas:",
      error.response?.data || error.message
    );
  }
}

testTablesEndpoint();
