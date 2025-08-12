const authService = require("./services/authService");

async function diagnosePermissions() {
  try {
    console.log("🔍 Diagnóstico del sistema de permisos...\n");

    // Simular un usuario no admin con permisos específicos de tabla
    const testUserId = 2; // Asumiendo que existe un usuario con ID 2
    const testDatabase = "BD_ABM1";
    const testTable = "Maquinas";

    console.log("1️⃣ Probando verificación de permisos de tabla...");

    // Probar verificación de permisos de tabla
    const tableReadPermission = await authService.checkTablePermission(
      testUserId,
      testDatabase,
      testTable,
      "read"
    );

    console.log(
      `   - Usuario ${testUserId} puede leer ${testDatabase}.${testTable}: ${tableReadPermission}`
    );

    // Probar verificación de permisos de base de datos
    const dbReadPermission = await authService.checkDatabasePermission(
      testUserId,
      testDatabase,
      "read"
    );

    console.log(
      `   - Usuario ${testUserId} puede leer ${testDatabase}: ${dbReadPermission}`
    );

    console.log("\n2️⃣ Problema identificado:");
    console.log(
      "   - El middleware requireReadPermission verifica permisos de tabla"
    );
    console.log(
      "   - Pero la función checkTablePermission falla si no hay permisos específicos de tabla"
    );
    console.log(
      "   - No está verificando correctamente los permisos de base de datos como fallback"
    );

    console.log("\n3️⃣ Solución propuesta:");
    console.log(
      "   - Modificar checkTablePermission para verificar permisos de BD como fallback"
    );
    console.log("   - Asegurar que los middlewares usen la lógica correcta");
    console.log("   - Verificar que los permisos se asignen correctamente");
  } catch (error) {
    console.error("❌ Error en el diagnóstico:", error);
  }
}

diagnosePermissions();
