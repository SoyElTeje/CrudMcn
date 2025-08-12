const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_DB = "BD_ABM1";
const TEST_USER = "testuser_remove";
const TEST_PASSWORD = "testpass123";

async function testRemovePermissions() {
  console.log("🧪 Probando funcionalidad de eliminación de permisos...\n");

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

    // 3. Asignar permisos de base de datos
    console.log("3. Asignando permisos de base de datos...");
    await axios.post(
      `${BASE_URL}/api/auth/users/${testUserId}/database-permissions`,
      {
        databaseName: TEST_DB,
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
        },
      },
      { headers: adminHeaders }
    );
    console.log("✅ Permisos de base de datos asignados\n");

    // 4. Asignar permisos de tabla específica
    console.log("4. Asignando permisos de tabla específica...");
    await axios.post(
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
    console.log("✅ Permisos de tabla asignados\n");

    // 5. Verificar permisos asignados
    console.log("5. Verificando permisos asignados...");
    const permissionsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/${testUserId}/permissions`,
      { headers: adminHeaders }
    );
    const permissions = permissionsResponse.data;

    console.log("📋 Permisos actuales:");
    console.log(
      "   Bases de datos:",
      permissions.databasePermissions.map((p) => p.databaseName)
    );
    console.log(
      "   Tablas:",
      permissions.tablePermissions.map(
        (p) => `${p.databaseName}.${p.tableName}`
      )
    );
    console.log("");

    // 6. Eliminar permisos de tabla
    console.log("6. Eliminando permisos de tabla...");
    await axios.delete(
      `${BASE_URL}/api/auth/users/${testUserId}/table-permissions`,
      {
        headers: adminHeaders,
        data: {
          databaseName: TEST_DB,
          tableName: "Maquinas",
        },
      }
    );
    console.log("✅ Permisos de tabla eliminados\n");

    // 7. Verificar permisos después de eliminar tabla
    console.log("7. Verificando permisos después de eliminar tabla...");
    const permissionsAfterTableRemoval = await axios.get(
      `${BASE_URL}/api/auth/users/${testUserId}/permissions`,
      { headers: adminHeaders }
    );
    const permissionsAfterTable = permissionsAfterTableRemoval.data;

    console.log("📋 Permisos después de eliminar tabla:");
    console.log(
      "   Bases de datos:",
      permissionsAfterTable.databasePermissions.map((p) => p.databaseName)
    );
    console.log(
      "   Tablas:",
      permissionsAfterTable.tablePermissions.map(
        (p) => `${p.databaseName}.${p.tableName}`
      )
    );

    if (permissionsAfterTable.tablePermissions.length === 0) {
      console.log("✅ Correcto: No quedan permisos de tabla");
    } else {
      console.log("❌ ERROR: Aún quedan permisos de tabla");
    }
    console.log("");

    // 8. Eliminar permisos de base de datos
    console.log("8. Eliminando permisos de base de datos...");
    await axios.delete(
      `${BASE_URL}/api/auth/users/${testUserId}/database-permissions`,
      {
        headers: adminHeaders,
        data: {
          databaseName: TEST_DB,
        },
      }
    );
    console.log("✅ Permisos de base de datos eliminados\n");

    // 9. Verificar permisos finales
    console.log("9. Verificando permisos finales...");
    const finalPermissionsResponse = await axios.get(
      `${BASE_URL}/api/auth/users/${testUserId}/permissions`,
      { headers: adminHeaders }
    );
    const finalPermissions = finalPermissionsResponse.data;

    console.log("📋 Permisos finales:");
    console.log(
      "   Bases de datos:",
      finalPermissions.databasePermissions.map((p) => p.databaseName)
    );
    console.log(
      "   Tablas:",
      finalPermissions.tablePermissions.map(
        (p) => `${p.databaseName}.${p.tableName}`
      )
    );

    if (
      finalPermissions.databasePermissions.length === 0 &&
      finalPermissions.tablePermissions.length === 0
    ) {
      console.log("✅ Correcto: No quedan permisos asignados");
    } else {
      console.log("❌ ERROR: Aún quedan permisos asignados");
    }
    console.log("");

    // 10. Limpiar - eliminar usuario de prueba
    console.log("10. Limpiando - eliminando usuario de prueba...");
    await axios.delete(`${BASE_URL}/api/auth/users/${testUserId}`, {
      headers: adminHeaders,
    });
    console.log("✅ Usuario de prueba eliminado\n");

    console.log(
      "🎉 Prueba de eliminación de permisos completada exitosamente!"
    );
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar la prueba
testRemovePermissions();
