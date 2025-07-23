const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function checkUserPermissions() {
  console.log("🔍 Verificando permisos del usuario de prueba...\n");

  try {
    // 1. Login como admin
    console.log("1️⃣ Login como admin...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    console.log("✅ Login admin exitoso");

    // 2. Obtener usuarios
    console.log("\n2️⃣ Obteniendo usuarios...");
    const usersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const testUser = usersResponse.data.find(
      (user) => user.username === "testuser"
    );
    if (!testUser) {
      throw new Error("No se pudo encontrar el usuario de prueba");
    }
    console.log(`✅ Usuario de prueba encontrado:`, testUser);

    // 3. Obtener permisos del usuario
    console.log("\n3️⃣ Obteniendo permisos del usuario...");
    const permissionsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/${testUser.id}/permissions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(
      "✅ Permisos del usuario:",
      JSON.stringify(permissionsResponse.data, null, 2)
    );

    // 4. Login como usuario de prueba
    console.log("\n4️⃣ Login como usuario de prueba...");
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testuser",
      password: "testpass",
    });
    const userToken = userLoginResponse.data.token;
    console.log("✅ Login usuario de prueba exitoso");

    // 5. Probar acceso a bases de datos
    console.log("\n5️⃣ Probando acceso a bases de datos...");
    const userDbsResponse = await axios.get(`${BASE_URL}/api/databases`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(
      `✅ Usuario puede ver ${userDbsResponse.data.length} bases de datos:`,
      userDbsResponse.data
    );

    // 6. Probar acceso a tablas de BD_ABM1
    if (userDbsResponse.data.includes("BD_ABM1")) {
      console.log("\n6️⃣ Probando acceso a tablas de BD_ABM1...");
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
    }

    console.log("\n🎉 Verificación completada!");
  } catch (error) {
    console.error(
      "❌ Error en la verificación:",
      error.response?.data || error.message
    );
  }
}

checkUserPermissions();
