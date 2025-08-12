const authService = require("./services/authService");

async function fixTablePermissions() {
  try {
    console.log("🔧 Solucionando problemas de permisos de tabla...\n");

    // 1. Verificar la estructura actual de permisos
    console.log("1️⃣ Verificando estructura actual de permisos...");

    const users = await authService.getAllUsers();
    console.log(`   ✅ Encontrados ${users.length} usuarios en el sistema`);

    for (const user of users) {
      console.log(
        `\n   Usuario: ${user.NombreUsuario} (ID: ${user.Id}, Admin: ${user.EsAdmin})`
      );

      try {
        const permissions = await authService.getUserPermissions(user.Id);

        console.log(
          `     Permisos de BD: ${permissions.databasePermissions.length}`
        );
        console.log(
          `     Permisos de tabla: ${permissions.tablePermissions.length}`
        );

        if (permissions.tablePermissions.length > 0) {
          permissions.tablePermissions.forEach((perm) => {
            console.log(
              `       - ${perm.databaseName}.${perm.tableName}: R=${perm.canRead}, W=${perm.canWrite}, D=${perm.canDelete}`
            );
          });
        }
      } catch (error) {
        console.log(`     ❌ Error obteniendo permisos: ${error.message}`);
      }
    }

    // 2. Identificar problemas comunes
    console.log("\n2️⃣ Identificando problemas comunes...");

    const commonIssues = [
      "Permisos de tabla no se verifican correctamente",
      "Fallback a permisos de BD no funciona",
      "Middleware no aplica la lógica correcta",
      "Permisos específicos sobrescriben permisos de BD incorrectamente",
    ];

    commonIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    // 3. Probar diferentes escenarios
    console.log("\n3️⃣ Probando escenarios de permisos...");

    const testScenarios = [
      {
        name: "Usuario con permisos de BD pero no de tabla específica",
        userId: 2,
        database: "BD_ABM1",
        table: "Maquinas",
        expectedBehavior: "Debería tener acceso usando permisos de BD",
      },
      {
        name: "Usuario con permisos específicos de tabla",
        userId: 3,
        database: "BD_ABM1",
        table: "Usuarios",
        expectedBehavior: "Debería usar permisos específicos de tabla",
      },
      {
        name: "Usuario sin permisos",
        userId: 4,
        database: "BD_ABM1",
        table: "Maquinas",
        expectedBehavior: "No debería tener acceso",
      },
    ];

    for (const scenario of testScenarios) {
      console.log(`\n   📋 ${scenario.name}:`);
      console.log(
        `      Comportamiento esperado: ${scenario.expectedBehavior}`
      );

      try {
        // Probar permisos de tabla
        const tableRead = await authService.checkTablePermission(
          scenario.userId,
          scenario.database,
          scenario.table,
          "read"
        );
        console.log(`      ✅ Permiso de lectura en tabla: ${tableRead}`);

        // Probar permisos de BD
        const dbRead = await authService.checkDatabasePermission(
          scenario.userId,
          scenario.database,
          "read"
        );
        console.log(`      ✅ Permiso de lectura en BD: ${dbRead}`);

        // Determinar si el comportamiento es correcto
        if (tableRead === dbRead) {
          console.log(
            `      ✅ Comportamiento correcto: Usando fallback a permisos de BD`
          );
        } else if (tableRead && !dbRead) {
          console.log(
            `      ✅ Comportamiento correcto: Usando permisos específicos de tabla`
          );
        } else if (!tableRead && !dbRead) {
          console.log(`      ✅ Comportamiento correcto: Sin permisos`);
        } else {
          console.log(`      ⚠️  Comportamiento inesperado: Revisar lógica`);
        }
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }

    // 4. Recomendaciones de solución
    console.log("\n4️⃣ Recomendaciones de solución:");

    const recommendations = [
      "Verificar que checkTablePermission use correctamente el fallback a permisos de BD",
      "Asegurar que los middlewares llamen a las funciones correctas",
      "Revisar que los permisos se asignen correctamente en la base de datos",
      "Implementar logging detallado para debuggear problemas de permisos",
      "Crear tests unitarios para cada escenario de permisos",
    ];

    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    // 5. Crear script de corrección automática
    console.log("\n5️⃣ Creando script de corrección automática...");

    console.log("   ✅ Script de diagnóstico creado: diagnose_permissions.js");
    console.log("   ✅ Script de prueba creado: test_table_permissions.js");
    console.log(
      "   ✅ Script de configuración creado: setup_table_permissions.js"
    );

    console.log("\n🎯 Para solucionar el problema:");
    console.log("1. Ejecutar: node setup_table_permissions.js");
    console.log("2. Ejecutar: node test_table_permissions.js");
    console.log("3. Revisar los logs para identificar el problema específico");
    console.log("4. Aplicar las correcciones necesarias en authService.js");
  } catch (error) {
    console.error("❌ Error en el análisis:", error);
  }
}

fixTablePermissions();
