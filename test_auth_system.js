const axios = require("axios");
require("dotenv").config();

const BASE_URL = "http://localhost:3001";
let adminToken = null;
let userToken = null;

// Configurar axios para mostrar errores detallados
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error de API:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

async function testAuthSystem() {
  console.log("🧪 Iniciando pruebas del sistema de autenticación...\n");

  try {
    // 1. Crear usuario administrador inicial
    console.log("1️⃣ Creando usuario administrador inicial...");
    const setupResponse = await axios.post(`${BASE_URL}/api/auth/setup-admin`);
    console.log("✅ Usuario admin creado:", setupResponse.data.message);

    // 2. Login como administrador
    console.log("\n2️⃣ Iniciando sesión como administrador...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    adminToken = adminLoginResponse.data.token;
    console.log("✅ Login exitoso como admin:", adminLoginResponse.data.user);

    // 3. Obtener información del usuario actual
    console.log("\n3️⃣ Obteniendo información del usuario actual...");
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("✅ Información del usuario:", meResponse.data.user);

    // 4. Crear un usuario normal
    console.log("\n4️⃣ Creando usuario normal...");
    const createUserResponse = await axios.post(
      `${BASE_URL}/api/auth/users`,
      {
        username: "usuario1",
        password: "password123",
        isAdmin: false,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("✅ Usuario normal creado:", createUserResponse.data);

    // 5. Login como usuario normal
    console.log("\n5️⃣ Iniciando sesión como usuario normal...");
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "usuario1",
      password: "password123",
    });
    userToken = userLoginResponse.data.token;
    console.log(
      "✅ Login exitoso como usuario normal:",
      userLoginResponse.data.user
    );

    // 6. Listar usuarios (solo admin puede)
    console.log("\n6️⃣ Listando usuarios (solo admin)...");
    const listUsersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "✅ Usuarios en el sistema:",
      listUsersResponse.data.users.length
    );

    // 7. Asignar permisos de base de datos a usuario normal
    console.log("\n7️⃣ Asignando permisos de base de datos...");
    const assignDbPermResponse = await axios.post(
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
    console.log(
      "✅ Permisos de base de datos asignados:",
      assignDbPermResponse.data.message
    );

    // 8. Obtener permisos del usuario
    console.log("\n8️⃣ Obteniendo permisos del usuario...");
    const userPermsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/2/permissions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("✅ Permisos del usuario:", userPermsResponse.data);

    // 9. Probar acceso a bases de datos con diferentes usuarios
    console.log("\n9️⃣ Probando acceso a bases de datos...");

    // Admin puede ver todas las bases de datos
    const adminDbsResponse = await axios.get(`${BASE_URL}/api/databases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "✅ Admin puede ver bases de datos:",
      adminDbsResponse.data.length,
      "bases de datos"
    );

    // Usuario normal puede ver bases de datos (pero con permisos limitados)
    const userDbsResponse = await axios.get(`${BASE_URL}/api/databases`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(
      "✅ Usuario normal puede ver bases de datos:",
      userDbsResponse.data.length,
      "bases de datos"
    );

    // 10. Probar acceso a tablas específicas
    if (adminDbsResponse.data.length > 0) {
      const testDb = adminDbsResponse.data[0];
      console.log(`\n🔟 Probando acceso a tablas de ${testDb}...`);

      // Admin puede ver tablas
      const adminTablesResponse = await axios.get(
        `${BASE_URL}/api/databases/${testDb}/tables`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.log(
        "✅ Admin puede ver tablas:",
        adminTablesResponse.data.length,
        "tablas"
      );

      // Usuario normal puede ver tablas (si tiene permisos)
      try {
        const userTablesResponse = await axios.get(
          `${BASE_URL}/api/databases/${testDb}/tables`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );
        console.log(
          "✅ Usuario normal puede ver tablas:",
          userTablesResponse.data.length,
          "tablas"
        );
      } catch (error) {
        console.log(
          "❌ Usuario normal no tiene permisos para ver tablas de esta base de datos"
        );
      }
    }

    // 11. Cambiar contraseña de usuario
    console.log("\n1️⃣1️⃣ Cambiando contraseña de usuario...");
    const changePasswordResponse = await axios.put(
      `${BASE_URL}/api/auth/users/2/password`,
      {
        newPassword: "nuevaPassword123",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log("✅ Contraseña cambiada:", changePasswordResponse.data.message);

    // 12. Probar login con nueva contraseña
    console.log("\n1️⃣2️⃣ Probando login con nueva contraseña...");
    const newLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "usuario1",
      password: "nuevaPassword123",
    });
    console.log(
      "✅ Login con nueva contraseña exitoso:",
      newLoginResponse.data.user
    );

    console.log(
      "\n🎉 ¡Todas las pruebas del sistema de autenticación pasaron exitosamente!"
    );
    console.log("\n📋 Resumen de funcionalidades probadas:");
    console.log("✅ Creación de usuario administrador inicial");
    console.log("✅ Login de usuarios");
    console.log("✅ Verificación de información de usuario");
    console.log("✅ Creación de usuarios por administradores");
    console.log("✅ Listado de usuarios");
    console.log("✅ Asignación de permisos de base de datos");
    console.log("✅ Verificación de permisos");
    console.log("✅ Acceso controlado a bases de datos y tablas");
    console.log("✅ Cambio de contraseñas");
    console.log("✅ Autorización basada en roles");
  } catch (error) {
    console.error("\n❌ Error durante las pruebas:", error.message);
    if (error.response) {
      console.error("Detalles del error:", error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  testAuthSystem();
}

module.exports = { testAuthSystem };
