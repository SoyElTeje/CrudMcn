const authService = require("./services/authService");

async function solveTablePermissions() {
  try {
    console.log(
      "🔧 Solucionando problema de permisos específicos de tabla...\n"
    );

    // 1. Verificar conexión y estructura
    console.log("1️⃣ Verificando conexión y estructura...");

    try {
      const users = await authService.getAllUsers();
      console.log(
        `   ✅ Conexión exitosa. Encontrados ${users.length} usuarios`
      );
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
      console.log(
        "   💡 Asegúrate de que SQL Server esté ejecutándose y la configuración sea correcta"
      );
      return;
    }

    // 2. Crear usuario de prueba
    console.log("\n2️⃣ Configurando usuario de prueba...");

    let testUserId;
    try {
      // Intentar crear usuario de prueba
      await authService.createUser("tabletest", "testpass123", false);
      console.log("   ✅ Usuario tabletest creado");
    } catch (error) {
      if (error.message.includes("duplicate")) {
        console.log("   ℹ️  Usuario tabletest ya existe");
      } else {
        console.log(`   ❌ Error creando usuario: ${error.message}`);
        return;
      }
    }

    // Obtener ID del usuario
    const users = await authService.getAllUsers();
    const testUser = users.find((u) => u.NombreUsuario === "tabletest");
    if (!testUser) {
      console.log("   ❌ No se pudo encontrar el usuario tabletest");
      return;
    }
    testUserId = testUser.Id;
    console.log(`   ✅ Usuario tabletest encontrado con ID: ${testUserId}`);

    // 3. Asignar permisos de prueba
    console.log("\n3️⃣ Asignando permisos de prueba...");

    try {
      // Permisos de base de datos (solo lectura)
      await authService.assignDatabasePermission(testUserId, "BD_ABM1", {
        canRead: true,
        canWrite: false,
        canDelete: false,
      });
      console.log("   ✅ Permisos de lectura asignados a BD_ABM1");

      // Permisos específicos de tabla (lectura y escritura)
      await authService.assignTablePermission(
        testUserId,
        "BD_ABM1",
        "Maquinas",
        {
          canRead: true,
          canWrite: true,
          canDelete: false,
        }
      );
      console.log("   ✅ Permisos específicos asignados a BD_ABM1.Maquinas");

      // Permisos específicos de tabla (solo lectura)
      await authService.assignTablePermission(
        testUserId,
        "BD_ABM1",
        "Usuarios",
        {
          canRead: true,
          canWrite: false,
          canDelete: false,
        }
      );
      console.log(
        "   ✅ Permisos de solo lectura asignados a BD_ABM1.Usuarios"
      );
    } catch (error) {
      console.log(`   ❌ Error asignando permisos: ${error.message}`);
      return;
    }

    // 4. Verificar permisos asignados
    console.log("\n4️⃣ Verificando permisos asignados...");

    try {
      const permissions = await authService.getUserPermissions(testUserId);

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
    } catch (error) {
      console.log(`   ❌ Error verificando permisos: ${error.message}`);
      return;
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
      {
        name: "Acceso a tabla sin permisos",
        database: "BD_ABM2",
        table: "Maquinas",
        operation: "read",
        expected: false,
      },
    ];

    let allTestsPassed = true;

    for (const testCase of testCases) {
      try {
        const result = await authService.checkTablePermission(
          testUserId,
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

    // 6. Resumen y recomendaciones
    console.log("\n6️⃣ Resumen y recomendaciones...");

    if (allTestsPassed) {
      console.log(
        "   🎉 ¡Todos los tests pasaron! El sistema de permisos funciona correctamente."
      );
      console.log("\n   📝 Configuración exitosa:");
      console.log("   - Usuario tabletest creado con ID:", testUserId);
      console.log("   - Permisos de BD asignados a BD_ABM1 (solo lectura)");
      console.log(
        "   - Permisos específicos asignados a BD_ABM1.Maquinas (lectura y escritura)"
      );
      console.log(
        "   - Permisos específicos asignados a BD_ABM1.Usuarios (solo lectura)"
      );
    } else {
      console.log("   ⚠️  Algunos tests fallaron. Revisar la configuración.");
      console.log("\n   🔧 Posibles soluciones:");
      console.log(
        "   1. Verificar que las tablas de permisos existan en la base de datos"
      );
      console.log("   2. Revisar las funciones de asignación de permisos");
      console.log("   3. Verificar la lógica de verificación de permisos");
      console.log(
        "   4. Comprobar que los middlewares usen las funciones correctas"
      );
    }

    console.log("\n🎯 Para usar el sistema:");
    console.log("1. Login con usuario 'tabletest' y contraseña 'testpass123'");
    console.log("2. Probar acceso a diferentes tablas en BD_ABM1");
    console.log("3. Verificar que los permisos se apliquen correctamente");
  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

solveTablePermissions();
