const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_DB = "BD_ABM1";
const TEST_USER = "testuser_filtered";
const TEST_PASSWORD = "testpass123";

async function testFilteredTablesEndpoint() {
  console.log("🧪 Probando endpoint de tablas filtradas por permisos...\n");

  try {
    // 1. Login como admin
    console.log("1. Iniciando sesión como admin...");
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });
    const adminToken = adminLoginResponse.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log("✅ Login como admin exitoso\n");

    // 2. Crear usuario de prueba
    console.log("2. Creando usuario de prueba...");
    const createUserResponse = await axios.post(
      `${BASE_URL}/api/auth/users`,
      {
        username: TEST_USER,
        password: TEST_PASSWORD,
        isAdmin: false,
      },
      { headers: adminHeaders }
    );
    const testUserId = createUserResponse.data.user.id;
    console.log("✅ Usuario de prueba creado\n");

    // 3. Obtener todas las tablas de la base de datos (como admin)
    console.log(
      "3. Obteniendo todas las tablas de la base de datos (como admin)..."
    );
    const allTablesResponse = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables`,
      {
        headers: adminHeaders,
      }
    );
    const allTables = allTablesResponse.data;
    console.log(
      `✅ Admin puede ver ${allTables.length} tablas:`,
      allTables.map((t) => t.name)
    );
    console.log("");

    // 4. Login como usuario de prueba (sin permisos)
    console.log("4. Iniciando sesión como usuario de prueba...");
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: TEST_USER,
      password: TEST_PASSWORD,
    });
    const userToken = userLoginResponse.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };
    console.log("✅ Login como usuario de prueba exitoso\n");

    // 5. Intentar obtener tablas sin permisos
    console.log("5. Intentando obtener tablas sin permisos...");
    try {
      const noPermissionsResponse = await axios.get(
        `${BASE_URL}/api/databases/${TEST_DB}/tables`,
        {
          headers: userHeaders,
        }
      );
      console.log("❌ ERROR: El usuario sin permisos pudo obtener tablas");
      console.log("Tablas obtenidas:", noPermissionsResponse.data);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("✅ Correcto: Usuario sin permisos no puede listar tablas");
      } else {
        console.log(
          "❌ Error inesperado:",
          error.response?.data || error.message
        );
      }
    }
    console.log("");

    // 6. Asignar permisos solo en la tabla "Maquinas"
    console.log('6. Asignando permisos solo en la tabla "Maquinas"...');
    const assignPermissionResponse = await axios.post(
      `${BASE_URL}/api/auth/users/${testUserId}/table-permissions`,
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
    console.log("✅ Permisos asignados en tabla Maquinas\n");

    // 7. Obtener tablas con permisos limitados
    console.log("7. Obteniendo tablas con permisos limitados...");
    const filteredTablesResponse = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables`,
      {
        headers: userHeaders,
      }
    );
    const filteredTables = filteredTablesResponse.data;
    console.log(
      `✅ Usuario con permisos limitados puede ver ${filteredTables.length} tablas:`,
      filteredTables.map((t) => t.name)
    );

    // Verificar que solo ve la tabla "Maquinas"
    if (filteredTables.length === 1 && filteredTables[0].name === "Maquinas") {
      console.log('✅ Correcto: Solo se muestra la tabla "Maquinas"');
    } else {
      console.log("❌ ERROR: Se muestran tablas incorrectas");
    }
    console.log("");

    // 8. Verificar que no puede acceder a otras tablas
    console.log("8. Verificando que no puede acceder a otras tablas...");
    const otherTables = allTables.filter((t) => t.name !== "Maquinas");
    if (otherTables.length > 0) {
      const testTable = otherTables[0];
      try {
        await axios.get(
          `${BASE_URL}/api/databases/${TEST_DB}/tables/${testTable.name}/records`,
          {
            headers: userHeaders,
          }
        );
        console.log(
          `❌ ERROR: Usuario pudo acceder a tabla ${testTable.name} sin permisos`
        );
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(
            `✅ Correcto: Usuario no puede acceder a tabla ${testTable.name} sin permisos`
          );
        } else {
          console.log(
            `❌ Error inesperado al acceder a ${testTable.name}:`,
            error.response?.data || error.message
          );
        }
      }
    }
    console.log("");

    // 9. Verificar que puede acceder a la tabla "Maquinas"
    console.log('9. Verificando que puede acceder a la tabla "Maquinas"...');
    try {
      const maquinasResponse = await axios.get(
        `${BASE_URL}/api/databases/${TEST_DB}/tables/Maquinas/records`,
        {
          headers: userHeaders,
        }
      );
      console.log(
        "✅ Correcto: Usuario puede acceder a tabla Maquinas con permisos"
      );
    } catch (error) {
      console.log(
        "❌ ERROR: Usuario no puede acceder a tabla Maquinas:",
        error.response?.data || error.message
      );
    }
    console.log("");

    console.log("🎉 Prueba completada exitosamente!");
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar la prueba
testFilteredTablesEndpoint();
