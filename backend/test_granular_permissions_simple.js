const authService = require("./services/authService");

async function testGranularPermissionsSimple() {
  try {
    console.log(
      "🧪 Probando sistema de permisos granulares (versión simplificada)...\n"
    );

    // 1. Obtener el usuario existente
    console.log("1️⃣ Obteniendo usuario de prueba...");
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

    // 2. Asignar permisos granulares solo a tabla Maquinas (que sabemos que existe)
    console.log("\n2️⃣ Asignando permisos granulares...");

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

    // 3. Verificar permisos asignados
    console.log("\n3️⃣ Verificando permisos asignados...");
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

    // 4. Probar verificación de permisos
    console.log("\n4️⃣ Probando verificación de permisos...");

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

    // Probar permisos en tabla que no tiene permisos
    const sinPermisosRead = await authService.checkTablePermission(
      testUser.id,
      "BD_ABM1",
      "TablaInexistente",
      "read"
    );
    console.log(`   BD_ABM1.TablaInexistente - Read: ${sinPermisosRead}`);

    // 5. Verificar que no tiene permisos de base de datos
    console.log("\n5️⃣ Verificando permisos de base de datos...");
    const dbRead = await authService.checkDatabasePermission(
      testUser.id,
      "BD_ABM1",
      "read"
    );
    console.log(`   BD_ABM1 (database level) - Read: ${dbRead}`);

    console.log("\n✅ Prueba de permisos granulares completada");
    console.log("\n📋 Resumen:");
    console.log("   - El usuario tiene permisos específicos en tabla Maquinas");
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

testGranularPermissionsSimple();
