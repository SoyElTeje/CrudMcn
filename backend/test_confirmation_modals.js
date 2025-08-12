const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_USER = "testuser_modal";
const TEST_PASSWORD = "testpass123";

async function testConfirmationModals() {
  console.log("🧪 Probando funcionalidad de modales de confirmación...\n");

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
        databaseName: "BD_ABM1",
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
        databaseName: "BD_ABM1",
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

    // 6. Probar eliminación de permisos de tabla (esto debería mostrar el modal en el frontend)
    console.log("6. Probando eliminación de permisos de tabla...");
    console.log(
      "   ⚠️  En el frontend, intenta eliminar los permisos de tabla"
    );
    console.log(
      "   ⚠️  Deberías ver un modal de confirmación en lugar de un alert"
    );
    console.log("   ⚠️  Presiona 'Cancelar' para no eliminar realmente\n");

    // 7. Probar eliminación de permisos de base de datos (esto debería mostrar el modal en el frontend)
    console.log("7. Probando eliminación de permisos de base de datos...");
    console.log(
      "   ⚠️  En el frontend, intenta eliminar los permisos de base de datos"
    );
    console.log(
      "   ⚠️  Deberías ver un modal de confirmación en lugar de un alert"
    );
    console.log("   ⚠️  Presiona 'Cancelar' para no eliminar realmente\n");

    // 8. Probar eliminación de usuario (esto debería mostrar el modal en el frontend)
    console.log("8. Probando eliminación de usuario...");
    console.log("   ⚠️  En el frontend, intenta eliminar el usuario de prueba");
    console.log(
      "   ⚠️  Deberías ver un modal de confirmación en lugar de un alert"
    );
    console.log("   ⚠️  Presiona 'Cancelar' para no eliminar realmente\n");

    console.log("🎯 Instrucciones para probar los modales:");
    console.log("   1. Abre el navegador en http://localhost:5173");
    console.log(
      "   2. Inicia sesión como admin (usuario: admin, contraseña: admin)"
    );
    console.log("   3. Ve a la sección 'Gestión de Usuarios'");
    console.log("   4. Busca el usuario 'testuser_modal'");
    console.log("   5. Haz clic en 'Permisos' para abrir el modal de permisos");
    console.log("   6. Intenta eliminar permisos de tabla o base de datos");
    console.log("   7. Intenta eliminar el usuario");
    console.log(
      "   8. Verifica que aparezcan modales de confirmación en lugar de alerts\n"
    );

    console.log(
      "✅ Prueba de modales de confirmación configurada correctamente!"
    );
    console.log(
      "   Los modales deberían aparecer cuando intentes eliminar usuarios o permisos."
    );
    console.log(
      "   Cada modal tiene un botón 'X' para cerrar y botones 'Cancelar' y 'Confirmar'."
    );
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar la prueba
testConfirmationModals();
