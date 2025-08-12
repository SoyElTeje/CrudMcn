const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_USER = "testuser_red_modals";
const TEST_PASSWORD = "testpass123";

async function testRedConfirmationModals() {
  console.log(
    "🔴 Probando modales de confirmación rojos para eliminar permisos...\n"
  );

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

    console.log(
      "🔴 Instrucciones para probar los modales de confirmación rojos:"
    );
    console.log("   1. Abre el navegador en http://localhost:5173");
    console.log(
      "   2. Inicia sesión como admin (usuario: admin, contraseña: admin)"
    );
    console.log("   3. Ve a la sección 'Gestión de Usuarios'");
    console.log("   4. Busca el usuario 'testuser_red_modals'");
    console.log("   5. Haz clic en 'Permisos' para abrir el modal de permisos");
    console.log("   6. Verifica que:");
    console.log(
      "      - Los botones X para eliminar permisos sean ROJOS INTENSOS"
    );
    console.log(
      "      - Haz clic en el botón X de un permiso de base de datos"
    );
    console.log(
      "      - El modal de confirmación debe aparecer con botones ROJOS (variant='danger')"
    );
    console.log("      - Haz clic en el botón X de un permiso de tabla");
    console.log(
      "      - El modal de confirmación debe aparecer con botones ROJOS (variant='danger')"
    );
    console.log(
      "      - Presiona 'Cancelar' en ambos modales para no eliminar realmente"
    );
    console.log(
      "   7. Verifica que todos los modales de confirmación sean ROJOS, no naranjas\n"
    );

    console.log(
      "✅ Prueba de modales de confirmación rojos configurada correctamente!"
    );
    console.log(
      "   Los modales de confirmación para eliminar permisos ahora deberían ser ROJOS (variant='danger')."
    );
    console.log(
      "   Todos los modales de confirmación (usuario y permisos) deberían tener el mismo color rojo."
    );
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar la prueba
testRedConfirmationModals();
