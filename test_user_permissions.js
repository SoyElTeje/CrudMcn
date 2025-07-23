const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testUserPermissions() {
  console.log("🧪 Probando sistema de permisos de usuario...\n");

  try {
    // 1. Login como admin
    console.log("1️⃣ Login como admin...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    console.log("✅ Login admin exitoso");

    // 2. Login como usuario normal (asumiendo que existe un usuario 'testuser')
    console.log("\n2️⃣ Login como usuario normal...");
    let userToken;
    try {
      const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: "testuser",
        password: "testpass",
      });
      userToken = userLoginResponse.data.token;
      console.log("✅ Login usuario normal exitoso");
    } catch (error) {
      console.log("⚠️ Usuario normal no existe, creando uno...");

      // Crear usuario de prueba
      const createUserResponse = await axios.post(
        `${BASE_URL}/api/auth/users`,
        {
          username: "testuser",
          password: "testpass",
          isAdmin: false,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.log("✅ Usuario de prueba creado");

      // Login con el nuevo usuario
      const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: "testuser",
        password: "testpass",
      });
      userToken = userLoginResponse.data.token;
      console.log("✅ Login usuario normal exitoso");
    }

    // 3. Asignar permisos limitados al usuario
    console.log("\n3️⃣ Asignando permisos limitados...");

    // Asignar permisos de base de datos completa a BD_ABM1
    await axios.post(
      `${BASE_URL}/api/auth/users/2/database-permissions`,
      {
        databaseName: "BD_ABM1",
        canRead: true,
        canWrite: true,
        canDelete: false,
        canCreate: false,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("✅ Permisos de BD_ABM1 asignados");

    // Asignar permisos de tabla específica en BD_ABM2
    await axios.post(
      `${BASE_URL}/api/auth/users/2/table-permissions`,
      {
        databaseName: "BD_ABM2",
        tableName: "Usuarios",
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
    console.log("✅ Permisos de tabla Usuarios en BD_ABM2 asignados");

    // 4. Probar acceso a bases de datos como admin
    console.log("\n4️⃣ Probando acceso como admin...");
    const adminDbsResponse = await axios.get(`${BASE_URL}/api/databases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      `✅ Admin puede ver ${adminDbsResponse.data.length} bases de datos:`,
      adminDbsResponse.data
    );

    // 5. Probar acceso a bases de datos como usuario normal
    console.log("\n5️⃣ Probando acceso como usuario normal...");
    const userDbsResponse = await axios.get(`${BASE_URL}/api/databases`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(
      `✅ Usuario normal puede ver ${userDbsResponse.data.length} bases de datos:`,
      userDbsResponse.data
    );

    // 6. Probar acceso a tablas específicas
    console.log("\n6️⃣ Probando acceso a tablas...");

    // Probar BD_ABM1 (acceso completo)
    try {
      const bd1TablesResponse = await axios.get(
        `${BASE_URL}/api/databases/BD_ABM1/tables`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log(
        `✅ Usuario puede acceder a ${bd1TablesResponse.data.length} tablas en BD_ABM1`
      );
    } catch (error) {
      console.log(
        "❌ Usuario no puede acceder a BD_ABM1:",
        error.response?.data?.error
      );
    }

    // Probar BD_ABM2 (solo tabla específica)
    try {
      const bd2TablesResponse = await axios.get(
        `${BASE_URL}/api/databases/BD_ABM2/tables`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log(
        `✅ Usuario puede acceder a ${bd2TablesResponse.data.length} tablas en BD_ABM2`
      );
    } catch (error) {
      console.log(
        "❌ Usuario no puede acceder a BD_ABM2:",
        error.response?.data?.error
      );
    }

    // Probar APPDATA (sin permisos)
    try {
      const appdataTablesResponse = await axios.get(
        `${BASE_URL}/api/databases/APPDATA/tables`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log(
        `✅ Usuario puede acceder a ${appdataTablesResponse.data.length} tablas en APPDATA`
      );
    } catch (error) {
      console.log(
        "✅ Usuario correctamente bloqueado de APPDATA:",
        error.response?.data?.error
      );
    }

    console.log("\n🎉 Pruebas completadas exitosamente!");
  } catch (error) {
    console.error(
      "❌ Error en las pruebas:",
      error.response?.data || error.message
    );
  }
}

testUserPermissions();
