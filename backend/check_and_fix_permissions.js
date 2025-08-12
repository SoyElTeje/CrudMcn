const authService = require("./services/authService");

async function checkAndFixPermissions() {
  try {
    console.log("🔍 Verificando usuarios y asignando permisos...\n");

    // 1. Obtener usuarios existentes
    console.log("1️⃣ Usuarios existentes:");
    const users = await authService.getAllUsers();

    if (users.length === 0) {
      console.log("   ❌ No hay usuarios en el sistema");
      return;
    }

    users.forEach((user) => {
      console.log(
        `   - ID: ${user.Id}, Usuario: ${user.NombreUsuario}, Admin: ${user.EsAdmin}`
      );
    });

    // 2. Seleccionar un usuario no admin para pruebas
    const testUser = users.find(
      (u) => !u.EsAdmin && u.NombreUsuario !== "admin"
    );

    if (!testUser) {
      console.log("\n   ❌ No se encontró un usuario no admin para pruebas");
      console.log("   💡 Creando usuario de prueba...");

      try {
        await authService.createUser("testuser", "testpass123", false);
        console.log("   ✅ Usuario testuser creado");

        // Obtener el usuario recién creado
        const newUsers = await authService.getAllUsers();
        const newTestUser = newUsers.find(
          (u) => u.NombreUsuario === "testuser"
        );

        if (newTestUser) {
          console.log(
            `   ✅ Usuario testuser encontrado con ID: ${newTestUser.Id}`
          );
          await assignPermissions(newTestUser.Id);
        } else {
          console.log("   ❌ No se pudo encontrar el usuario recién creado");
        }
      } catch (error) {
        console.log(`   ❌ Error creando usuario: ${error.message}`);
      }
    } else {
      console.log(
        `\n2️⃣ Usando usuario existente: ${testUser.NombreUsuario} (ID: ${testUser.Id})`
      );
      await assignPermissions(testUser.Id);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function assignPermissions(userId) {
  try {
    console.log("\n3️⃣ Asignando permisos de prueba...");

    // Asignar permisos de base de datos (solo lectura)
    await authService.assignDatabasePermission(userId, "BD_ABM1", {
      canRead: true,
      canWrite: false,
      canDelete: false,
    });
    console.log("   ✅ Permisos de lectura asignados a BD_ABM1");

    // Asignar permisos específicos de tabla (lectura y escritura)
    await authService.assignTablePermission(userId, "BD_ABM1", "Maquinas", {
      canRead: true,
      canWrite: true,
      canDelete: false,
    });
    console.log("   ✅ Permisos específicos asignados a BD_ABM1.Maquinas");

    // Asignar permisos específicos de tabla (solo lectura)
    await authService.assignTablePermission(userId, "BD_ABM1", "Usuarios", {
      canRead: true,
      canWrite: false,
      canDelete: false,
    });
    console.log("   ✅ Permisos de solo lectura asignados a BD_ABM1.Usuarios");

    // 4. Verificar permisos asignados
    console.log("\n4️⃣ Verificando permisos asignados...");
    const permissions = await authService.getUserPermissions(userId);

    console.log("   Permisos de base de datos:");
    if (permissions.databasePermissions.length === 0) {
      console.log("     ⚠️  No hay permisos de base de datos asignados");
    } else {
      permissions.databasePermissions.forEach((perm) => {
        console.log(
          `     - ${perm.databaseName}: Read=${perm.canRead}, Write=${perm.canWrite}, Delete=${perm.canDelete}`
        );
      });
    }

    console.log("   Permisos de tabla:");
    if (permissions.tablePermissions.length === 0) {
      console.log("     ⚠️  No hay permisos de tabla asignados");
    } else {
      permissions.tablePermissions.forEach((perm) => {
        console.log(
          `     - ${perm.databaseName}.${perm.tableName}: Read=${perm.canRead}, Write=${perm.canWrite}, Delete=${perm.canDelete}`
        );
      });
    }

    // 5. Probar verificación de permisos
    console.log("\n5️⃣ Probando verificación de permisos...");

    const testCases = [
      {
        name: "Acceso a tabla con permisos específicos (lectura)",
        database: "BD_ABM1",
        table: "Maquinas",
        operation: "read",
        expected: true,
      },
      {
        name: "Acceso a tabla con permisos específicos (escritura)",
        database: "BD_ABM1",
        table: "Maquinas",
        operation: "write",
        expected: true,
      },
      {
        name: "Acceso a tabla con permisos específicos (eliminación)",
        database: "BD_ABM1",
        table: "Maquinas",
        operation: "delete",
        expected: false,
      },
      {
        name: "Acceso a tabla con permisos de BD (fallback)",
        database: "BD_ABM1",
        table: "OtraTabla",
        operation: "read",
        expected: true,
      },
      {
        name: "Acceso a tabla con permisos de BD (fallback - escritura)",
        database: "BD_ABM1",
        table: "OtraTabla",
        operation: "write",
        expected: false,
      },
    ];

    let allTestsPassed = true;

    for (const testCase of testCases) {
      try {
        const result = await authService.checkTablePermission(
          userId,
          testCase.database,
          testCase.table,
          testCase.operation
        );

        const status = result === testCase.expected ? "✅" : "❌";
        const expectedText = testCase.expected ? "permitido" : "denegado";
        const actualText = result ? "permitido" : "denegado";

        console.log(
          `   ${status} ${testCase.name}: ${actualText} (esperado: ${expectedText})`
        );

        if (result !== testCase.expected) {
          allTestsPassed = false;
        }
      } catch (error) {
        console.log(
          `   ❌ Error en prueba: ${testCase.name} - ${error.message}`
        );
        allTestsPassed = false;
      }
    }

    // 6. Resumen
    console.log("\n6️⃣ Resumen:");
    if (allTestsPassed) {
      console.log(
        "   🎉 ¡Todos los tests pasaron! El sistema de permisos funciona correctamente."
      );
      console.log("\n   📝 Configuración exitosa:");
      console.log(`   - Usuario ID: ${userId}`);
      console.log("   - Permisos de BD asignados a BD_ABM1 (solo lectura)");
      console.log(
        "   - Permisos específicos asignados a BD_ABM1.Maquinas (lectura y escritura)"
      );
      console.log(
        "   - Permisos específicos asignados a BD_ABM1.Usuarios (solo lectura)"
      );
    } else {
      console.log("   ⚠️  Algunos tests fallaron. Revisar la configuración.");
    }

    console.log("\n🎯 Para probar el sistema:");
    console.log("1. Login con el usuario configurado");
    console.log("2. Probar acceso a diferentes tablas en BD_ABM1");
    console.log("3. Verificar que los permisos se apliquen correctamente");
  } catch (error) {
    console.error("❌ Error asignando permisos:", error);
  }
}

checkAndFixPermissions();
