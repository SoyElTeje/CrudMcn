const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function fixUser2Permissions() {
  console.log("🔧 Corrigiendo permisos de user2...\n");

  try {
    // 1. Login como admin
    console.log("1️⃣ Login como admin...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    console.log("✅ Login admin exitoso");

    // 2. Asignar permisos correctos a user2 para BD_ABM1
    console.log("\n2️⃣ Asignando permisos de lectura a user2 para BD_ABM1...");
    await axios.post(
      `${BASE_URL}/api/auth/users/3/database-permissions`,
      {
        databaseName: "BD_ABM1",
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: false,
          canCreate: false,
        },
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("✅ Permisos de BD_ABM1 asignados correctamente");

    // 3. Verificar permisos actualizados
    console.log("\n3️⃣ Verificando permisos actualizados...");
    const user2PermissionsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/3/permissions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("📋 Permisos actualizados de user2:");
    console.log(JSON.stringify(user2PermissionsResponse.data, null, 2));

    // 4. Probar acceso como user2
    console.log("\n4️⃣ Probando acceso como user2...");
    const user2LoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "user2",
      password: "user2",
    });
    const user2Token = user2LoginResponse.data.token;

    // Probar acceso a tablas de BD_ABM1
    try {
      const bd1TablesResponse = await axios.get(
        `${BASE_URL}/api/databases/BD_ABM1/tables`,
        {
          headers: { Authorization: `Bearer ${user2Token}` },
        }
      );
      console.log(
        `✅ user2 ahora puede acceder a ${bd1TablesResponse.data.length} tablas en BD_ABM1:`,
        bd1TablesResponse.data
      );
    } catch (error) {
      console.log(
        "❌ user2 aún no puede acceder a BD_ABM1:",
        error.response?.data?.error || error.message
      );
    }

    console.log("\n🎉 Corrección de permisos completada!");
  } catch (error) {
    console.error(
      "❌ Error al corregir permisos:",
      error.response?.data || error.message
    );
  }
}

fixUser2Permissions();
