const authService = require("./services/authService");

async function testTablePermissions() {
  try {
    console.log("🧪 Probando permisos específicos de tabla...\n");

    // Simular diferentes escenarios
    const testCases = [
      {
        userId: 1,
        databaseName: "BD_ABM1",
        tableName: "Maquinas",
        description: "Usuario admin",
      },
      {
        userId: 2,
        databaseName: "BD_ABM1",
        tableName: "Maquinas",
        description: "Usuario normal con permisos de tabla",
      },
      {
        userId: 3,
        databaseName: "BD_ABM1",
        tableName: "Maquinas",
        description: "Usuario normal con permisos de BD",
      },
      {
        userId: 4,
        databaseName: "BD_ABM1",
        tableName: "Maquinas",
        description: "Usuario sin permisos",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.description}:`);
      console.log(`   Usuario ID: ${testCase.userId}`);
      console.log(`   Base de datos: ${testCase.databaseName}`);
      console.log(`   Tabla: ${testCase.tableName}`);

      try {
        // Probar permisos de tabla
        const tableRead = await authService.checkTablePermission(
          testCase.userId,
          testCase.databaseName,
          testCase.tableName,
          "read"
        );
        console.log(`   ✅ Permiso de lectura en tabla: ${tableRead}`);

        const tableWrite = await authService.checkTablePermission(
          testCase.userId,
          testCase.databaseName,
          testCase.tableName,
          "write"
        );
        console.log(`   ✅ Permiso de escritura en tabla: ${tableWrite}`);

        // Probar permisos de base de datos
        const dbRead = await authService.checkDatabasePermission(
          testCase.userId,
          testCase.databaseName,
          "read"
        );
        console.log(`   ✅ Permiso de lectura en BD: ${dbRead}`);

        const dbWrite = await authService.checkDatabasePermission(
          testCase.userId,
          testCase.databaseName,
          "write"
        );
        console.log(`   ✅ Permiso de escritura en BD: ${dbWrite}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log("\n🎯 Análisis del problema:");
    console.log(
      "1. Si un usuario tiene permisos de BD pero no de tabla específica:"
    );
    console.log(
      "   - checkTablePermission debería devolver true (fallback a permisos de BD)"
    );
    console.log("   - requireReadPermission debería permitir el acceso");
    console.log("2. Si un usuario tiene permisos de tabla específica:");
    console.log(
      "   - checkTablePermission debería usar esos permisos específicos"
    );
    console.log("3. Si un usuario no tiene permisos de BD ni de tabla:");
    console.log("   - checkTablePermission debería devolver false");
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

testTablePermissions();
