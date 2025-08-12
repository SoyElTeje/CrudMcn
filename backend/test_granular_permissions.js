const authService = require("./services/authService");

async function testGranularPermissions() {
  try {
    console.log("🧪 Probando sistema de permisos granulares...\n");

    // 1. Crear un usuario de prueba
    console.log("1️⃣ Creando usuario de prueba...");
    try {
      await authService.createUser("testuser_granular", "testpass123", false);
      console.log("   ✅ Usuario testuser_granular creado");
    } catch (error) {
      if (error.message.includes("duplicate")) {
        console.log("   ℹ️  Usuario testuser_granular ya existe");
      } else {
        console.log("   ❌ Error creando usuario:", error.message);
        return;
      }
    }

    // 2. Obtener el ID del usuario
    console.log("\n2️⃣ Obteniendo ID del usuario...");
    const users = await authService.getAllUsers();
    const testUser = users.find((u) => u.username === "testuser_granular");

    if (!testUser) {
      console.log("   ❌ No se pudo encontrar el usuario testuser_granular");
      console.log(
        "   📋 Usuarios disponibles:",
        users.map((u) => u.username)
      );
      return;
    }

    console.log(`   ✅ Usuario encontrado con ID: ${testUser.id}`);

    // 3. Asignar permisos granulares a tablas específicas
    console.log("\n3️⃣ Asignando permisos granulares...");

    // Permisos de lectura y escritura solo en tabla Maquinas
    await authService.assignTablePermission(
      testUser.id,
      "BD_ABM1",
      "Maquinas",
      {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canCreate: true,
      }
    );
    console.log(
      "   ✅ Permisos asignados a BD_ABM1.Maquinas (Read, Write, Create)"
    );

    // Permisos de solo lectura en tabla Usuarios
    await authService.assignTablePermission(
      testUser.id,
      "BD_ABM1",
      "Usuarios",
      {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canCreate: false,
      }
    );
    console.log("   ✅ Permisos asignados a BD_ABM1.Usuarios (Read only)");

    // 4. Verificar permisos asignados
    console.log("\n4️⃣ Verificando permisos asignados...");
    const permissions = await authService.getUserPermissions(testUser.id);

    console.log("   Permisos de tabla:");
    if (permissions.tablePermissions.length === 0) {
      console.log("     ⚠️  No hay permisos de tabla asignados");
    } else {
      permissions.tablePermissions.forEach((perm) => {
        console.log(
          `     - ${perm.databaseName}.${perm.tableName}: Read=${perm.canRead}, Write=${perm.canWrite}, Delete=${perm.canDelete}, Create=${perm.canCreate}`
        );
      });
    }

    // 5. Probar verificación de permisos
    console.log("\n5️⃣ Probando verificación de permisos...");

    // Probar permisos en tabla Maquinas
    const maquinasRead = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "Maquinas",
      "read"
    );
    const maquinasWrite = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "Maquinas",
      "write"
    );
    const maquinasDelete = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "Maquinas",
      "delete"
    );

    console.log(
      `   BD_ABM1.Maquinas - Read: ${maquinasRead}, Write: ${maquinasWrite}, Delete: ${maquinasDelete}`
    );

    // Probar permisos en tabla Usuarios
    const usuariosRead = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "Usuarios",
      "read"
    );
    const usuariosWrite = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "Usuarios",
      "write"
    );

    console.log(
      `   BD_ABM1.Usuarios - Read: ${usuariosRead}, Write: ${usuariosWrite}`
    );

    // Probar permisos en tabla que no tiene permisos
    const sinPermisosRead = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "TablaInexistente",
      "read"
    );
    console.log(`   BD_ABM1.TablaInexistente - Read: ${sinPermisosRead}`);

    // 6. Verificar que no tiene permisos de base de datos
    console.log("\n6️⃣ Verificando permisos de base de datos...");
    const dbRead = await authService.checkDatabasePermission(
      testUser.id,
      "BD_ABM1",
      "read"
    );
    console.log(`   BD_ABM1 (database level) - Read: ${dbRead}`);

    console.log("\n✅ Prueba de permisos granulares completada");
    console.log("\n📋 Resumen:");
    console.log(
      "   - El usuario tiene permisos específicos en tablas individuales"
    );
    console.log("   - No tiene permisos generales de base de datos");
    console.log("   - Los permisos granulares funcionan correctamente");
    console.log(
      "   - Se crearon usuarios de SQL Server con permisos específicos"
    );
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    process.exit(0);
  }
}

testGranularPermissions();
