const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_USER = "testuser_listing";
const TEST_PASSWORD = "testpass123";
const TEST_DB = "BD_ABM1";

async function testTableListingPermissions() {
  console.log("🧪 Probando permisos para listar tablas...\n");

  try {
    // 1. Crear usuario de prueba (usando admin)
    console.log("1. Creando usuario de prueba...");

    // Primero hacer login como admin
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };

    const createUserResponse = await axios.post(
      `${BASE_URL}/api/auth/users`,
      {
        username: TEST_USER,
        password: TEST_PASSWORD,
      },
      { headers: adminHeaders }
    );
    console.log("✅ Usuario creado:", createUserResponse.data);

    // 2. Obtener token de autenticación
    console.log("\n2. Obteniendo token de autenticación...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: TEST_USER,
      password: TEST_PASSWORD,
    });
    const token = loginResponse.data.token;
    console.log("✅ Token obtenido");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 3. Intentar listar tablas sin permisos (debería fallar)
    console.log("\n3. Intentando listar tablas sin permisos...");
    try {
      await axios.get(`${BASE_URL}/api/databases/${TEST_DB}/tables`, {
        headers,
      });
      console.log("❌ ERROR: Debería haber fallado sin permisos");
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("✅ Correcto: Acceso denegado sin permisos");
      } else {
        console.log("❌ Error inesperado:", error.response?.data);
      }
    }

    // 4. Obtener ID del usuario para asignar permisos
    console.log("\n4. Obteniendo ID del usuario...");
    const usersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
      headers: adminHeaders,
    });
    const testUser = usersResponse.data.find((u) => u.username === TEST_USER);
    if (!testUser) {
      throw new Error("No se pudo encontrar el usuario de prueba");
    }
    console.log("✅ ID del usuario:", testUser.id);

    // 5. Asignar permisos de tabla específica
    console.log("\n5. Asignando permisos de tabla específica...");
    await axios.post(
      `${BASE_URL}/api/auth/users/${testUser.id}/table-permissions`,
      {
        databaseName: TEST_DB,
        tableName: "Maquinas",
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canCreate: true,
        },
      },
      { headers: adminHeaders }
    );
    console.log("✅ Permisos de tabla asignados");

    // 6. Intentar listar tablas con permisos de tabla específica (debería funcionar)
    console.log(
      "\n6. Intentando listar tablas con permisos de tabla específica..."
    );
    try {
      const tablesResponse = await axios.get(
        `${BASE_URL}/api/databases/${TEST_DB}/tables`,
        { headers }
      );
      console.log("✅ Correcto: Se pueden listar las tablas");
      console.log("📋 Tablas encontradas:", tablesResponse.data.length);
      tablesResponse.data.forEach((table) => {
        console.log(`   - ${table.schema}.${table.name}`);
      });
    } catch (error) {
      console.log("❌ Error listando tablas:", error.response?.data);
    }

    // 7. Verificar que no puede acceder a otras tablas sin permisos
    console.log("\n7. Verificando acceso a tabla sin permisos...");
    try {
      await axios.get(
        `${BASE_URL}/api/databases/${TEST_DB}/tables/Usuarios/records`,
        { headers }
      );
      console.log(
        "❌ ERROR: Debería haber fallado al acceder a tabla sin permisos"
      );
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("✅ Correcto: Acceso denegado a tabla sin permisos");
      } else {
        console.log("❌ Error inesperado:", error.response?.data);
      }
    }

    // 8. Verificar que puede acceder a la tabla con permisos
    console.log("\n8. Verificando acceso a tabla con permisos...");
    try {
      const recordsResponse = await axios.get(
        `${BASE_URL}/api/databases/${TEST_DB}/tables/Maquinas/records`,
        { headers }
      );
      console.log("✅ Correcto: Puede acceder a tabla con permisos");
      console.log(`📊 Registros encontrados: ${recordsResponse.data.length}`);
    } catch (error) {
      console.log(
        "❌ Error accediendo a tabla con permisos:",
        error.response?.data
      );
    }

    console.log("\n🎉 Prueba completada exitosamente!");
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar la prueba
testTableListingPermissions();
