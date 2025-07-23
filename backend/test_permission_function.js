const authService = require("./services/authService");

async function testPermissionFunction() {
  try {
    console.log("🧪 Probando función checkDatabasePermission...\n");

    // 1. Probar con usuario admin
    console.log("1️⃣ Probando con usuario admin (ID: 1)...");
    const adminReadResult = await authService.checkDatabasePermission(
      1,
      "BD_ABM1",
      "read"
    );
    console.log(`  - Admin puede leer BD_ABM1: ${adminReadResult}`);

    // 2. Probar con usuario testuser
    console.log("\n2️⃣ Probando con usuario testuser (ID: 4)...");
    const testUserReadResult = await authService.checkDatabasePermission(
      4,
      "BD_ABM1",
      "read"
    );
    console.log(`  - testuser puede leer BD_ABM1: ${testUserReadResult}`);

    const testUserWriteResult = await authService.checkDatabasePermission(
      4,
      "BD_ABM1",
      "write"
    );
    console.log(
      `  - testuser puede escribir en BD_ABM1: ${testUserWriteResult}`
    );

    const testUserDeleteResult = await authService.checkDatabasePermission(
      4,
      "BD_ABM1",
      "delete"
    );
    console.log(
      `  - testuser puede eliminar en BD_ABM1: ${testUserDeleteResult}`
    );

    // 3. Probar con base de datos sin permisos
    console.log("\n3️⃣ Probando con APPDATA (sin permisos)...");
    const testUserAppdataResult = await authService.checkDatabasePermission(
      4,
      "APPDATA",
      "read"
    );
    console.log(`  - testuser puede leer APPDATA: ${testUserAppdataResult}`);

    // 4. Probar función checkTablePermission
    console.log("\n4️⃣ Probando función checkTablePermission...");
    const testUserTableResult = await authService.checkTablePermission(
      4,
      "BD_ABM2",
      "Usuarios",
      "read"
    );
    console.log(
      `  - testuser puede leer BD_ABM2.Usuarios: ${testUserTableResult}`
    );

    // 5. Probar tabla sin permisos específicos (debería usar permisos de BD)
    console.log("\n5️⃣ Probando tabla sin permisos específicos...");
    const testUserTableNoSpecificResult =
      await authService.checkTablePermission(
        4,
        "BD_ABM1",
        "CualquierTabla",
        "read"
      );
    console.log(
      `  - testuser puede leer cualquier tabla en BD_ABM1: ${testUserTableNoSpecificResult}`
    );

    console.log("\n🎉 Pruebas completadas!");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    process.exit(0);
  }
}

testPermissionFunction();
