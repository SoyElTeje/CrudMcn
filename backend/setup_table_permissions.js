const authService = require("./services/authService");

async function setupTablePermissions() {
  try {
    console.log("🔧 Configurando permisos específicos de tabla...\n");

    // 1. Crear un usuario de prueba si no existe
    console.log("1️⃣ Creando usuario de prueba...");
    try {
      await authService.createUser("testuser", "testpass123", false);
      console.log("   ✅ Usuario testuser creado");
    } catch (error) {
      if (error.message.includes("duplicate")) {
        console.log("   ℹ️  Usuario testuser ya existe");
      } else {
        console.log("   ❌ Error creando usuario:", error.message);
      }
    }

    // 2. Obtener el ID del usuario testuser
    console.log("\n2️⃣ Obteniendo ID del usuario testuser...");
    const users = await authService.getAllUsers();
    const testUser = users.find((u) => u.NombreUsuario === "testuser");

    if (!testUser) {
      console.log("   ❌ No se pudo encontrar el usuario testuser");
      return;
    }

    console.log(`   ✅ Usuario testuser encontrado con ID: ${testUser.Id}`);

    // 3. Asignar permisos específicos de tabla
    console.log("\n3️⃣ Asignando permisos específicos de tabla...");

    // Permisos de lectura en tabla específica
    await authService.assignTablePermission(
      testUser.Id,
      "BD_ABM1",
      "Maquinas",
      {
        canRead: true,
        canWrite: false,
        canDelete: false,
      }
    );
    console.log("   ✅ Permisos de lectura asignados a BD_ABM1.Maquinas");

    // Permisos de escritura en otra tabla
    await authService.assignTablePermission(
      testUser.Id,
      "BD_ABM1",
      "Usuarios",
      {
        canRead: true,
        canWrite: true,
        canDelete: false,
      }
    );
    console.log("   ✅ Permisos de escritura asignados a BD_ABM1.Usuarios");

    // 4. Verificar los permisos asignados
    console.log("\n4️⃣ Verificando permisos asignados...");
    const permissions = await authService.getUserPermissions(testUser.Id);

    console.log("   Permisos de base de datos:");
    permissions.databasePermissions.forEach((perm) => {
      console.log(
        `     - ${perm.databaseName}: Read=${perm.canRead}, Write=${perm.canWrite}, Delete=${perm.canDelete}`
      );
    });

    console.log("   Permisos de tabla:");
    permissions.tablePermissions.forEach((perm) => {
      console.log(
        `     - ${perm.databaseName}.${perm.tableName}: Read=${perm.canRead}, Write=${perm.canWrite}, Delete=${perm.canDelete}`
      );
    });

    // 5. Probar verificación de permisos
    console.log("\n5️⃣ Probando verificación de permisos...");

    // Probar acceso a tabla con permisos específicos
    const canReadMaquinas = await authService.checkTablePermission(
      testUser.Id,
      "BD_ABM1",
      "Maquinas",
      "read"
    );
    console.log(`   ✅ Puede leer BD_ABM1.Maquinas: ${canReadMaquinas}`);

    const canWriteMaquinas = await authService.checkTablePermission(
      testUser.Id,
      "BD_ABM1",
      "Maquinas",
      "write"
    );
    console.log(
      `   ✅ Puede escribir en BD_ABM1.Maquinas: ${canWriteMaquinas}`
    );

    // Probar acceso a tabla con permisos de escritura
    const canWriteUsuarios = await authService.checkTablePermission(
      testUser.Id,
      "BD_ABM1",
      "Usuarios",
      "write"
    );
    console.log(
      `   ✅ Puede escribir en BD_ABM1.Usuarios: ${canWriteUsuarios}`
    );

    // Probar acceso a tabla sin permisos específicos
    const canReadOtherTable = await authService.checkTablePermission(
      testUser.Id,
      "BD_ABM1",
      "OtraTabla",
      "read"
    );
    console.log(
      `   ✅ Puede leer BD_ABM1.OtraTabla (fallback a permisos de BD): ${canReadOtherTable}`
    );

    console.log("\n🎉 Configuración completada exitosamente!");
    console.log("\n📝 Resumen:");
    console.log(
      "- Usuario testuser tiene permisos específicos de lectura en BD_ABM1.Maquinas"
    );
    console.log(
      "- Usuario testuser tiene permisos específicos de escritura en BD_ABM1.Usuarios"
    );
    console.log(
      "- Para otras tablas, se usan los permisos de base de datos como fallback"
    );
  } catch (error) {
    console.error("❌ Error en la configuración:", error);
  }
}

setupTablePermissions();
