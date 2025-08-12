const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_USER = "testuser_close_visible";
const TEST_PASSWORD = "testpass123";

async function testCloseButtonVisible() {
  console.log(
    "🔴 Probando botón de cerrar visible en el modal de permisos...\n"
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
      "🔴 Instrucciones para probar el botón de cerrar VISIBLE del modal de permisos:"
    );
    console.log("   1. Abre el navegador en http://localhost:5173");
    console.log(
      "   2. Inicia sesión como admin (usuario: admin, contraseña: admin)"
    );
    console.log("   3. Ve a la sección 'Gestión de Usuarios'");
    console.log("   4. Busca el usuario 'testuser_close_visible'");
    console.log("   5. Haz clic en 'Permisos' para abrir el modal de permisos");
    console.log("   6. Verifica que:");
    console.log(
      "      - En la esquina superior derecha del modal hay una X (cruz) para cerrar"
    );
    console.log(
      "      - La X ahora es VISIBLE con color gris (text-gray-600) en lugar de ser transparente"
    );
    console.log("      - La X es más grande y visible (w-6 h-6)");
    console.log(
      "      - Al pasar el mouse sobre la X, cambia a color rojo (hover:bg-red-100 hover:text-red-600)"
    );
    console.log(
      "      - Al hacer clic en la X, el modal se cierra correctamente"
    );
    console.log(
      "      - El botón tiene un tooltip que dice 'Cerrar modal' al pasar el mouse"
    );
    console.log(
      "   7. Verifica que el botón de cerrar sea CLARAMENTE VISIBLE ahora con el color gris base\n"
    );

    console.log(
      "✅ Prueba del botón de cerrar visible configurada correctamente!"
    );
    console.log(
      "   El botón de cerrar en el modal de permisos ahora debería ser VISIBLE con color gris base."
    );
    console.log(
      "   Se ha agregado text-gray-600 para hacer el botón más visible antes del hover."
    );
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );
  }
}

// Ejecutar la prueba
testCloseButtonVisible();
