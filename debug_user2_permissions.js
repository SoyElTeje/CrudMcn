const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function debugUser2Permissions() {
  console.log("🔍 Debuggeando permisos de user2...\n");

  try {
    // 1. Login como admin
    console.log("1️⃣ Login como admin...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    console.log("✅ Login admin exitoso");

    // 2. Login como user2
    console.log("\n2️⃣ Login como user2...");
    const user2LoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "user2",
      password: "user2",
    });
    const user2Token = user2LoginResponse.data.token;
    console.log("✅ Login user2 exitoso");

    // 3. Verificar permisos actuales de user2
    console.log("\n3️⃣ Verificando permisos actuales de user2...");
    const user2PermissionsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/2/permissions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("📋 Permisos actuales de user2:");
    console.log(JSON.stringify(user2PermissionsResponse.data, null, 2));

    // 4. Probar acceso a bases de datos como user2
    console.log("\n4️⃣ Probando acceso a bases de datos como user2...");
    const user2DbsResponse = await axios.get(`${BASE_URL}/api/databases`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    console.log(
      `✅ user2 puede ver ${user2DbsResponse.data.length} bases de datos:`,
      user2DbsResponse.data
    );

    // 5. Probar acceso a tablas específicas
    console.log("\n5️⃣ Probando acceso a tablas...");

    // Probar BD_ABM1
    try {
      const bd1TablesResponse = await axios.get(
        `${BASE_URL}/api/databases/BD_ABM1/tables`,
        {
          headers: { Authorization: `Bearer ${user2Token}` },
        }
      );
      console.log(
        `✅ user2 puede acceder a ${bd1TablesResponse.data.length} tablas en BD_ABM1:`,
        bd1TablesResponse.data
      );
    } catch (error) {
      console.log(
        "❌ user2 no puede acceder a BD_ABM1:",
        error.response?.data?.error || error.message
      );
    }

    // Probar APPDATA
    try {
      const appdataTablesResponse = await axios.get(
        `${BASE_URL}/api/databases/APPDATA/tables`,
        {
          headers: { Authorization: `Bearer ${user2Token}` },
        }
      );
      console.log(
        `✅ user2 puede acceder a ${appdataTablesResponse.data.length} tablas en APPDATA:`,
        appdataTablesResponse.data
      );
    } catch (error) {
      console.log(
        "✅ user2 correctamente bloqueado de APPDATA:",
        error.response?.data?.error || error.message
      );
    }

    console.log("\n🎉 Debug completado!");
  } catch (error) {
    console.error(
      "❌ Error en el debug:",
      error.response?.data || error.message
    );
  }
}

debugUser2Permissions(); 