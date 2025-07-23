const authService = require("./services/authService");

async function testAuth() {
  try {
    console.log("🧪 Probando autenticación y permisos...");

    // 1. Verificar credenciales del admin
    console.log("\n1. Verificando credenciales del admin...");
    const user = await authService.verifyCredentials("admin", "admin");
    if (user) {
      console.log("✅ Login exitoso:", {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } else {
      console.log("❌ Login fallido");
      return;
    }

    // 2. Generar token
    console.log("\n2. Generando token...");
    const token = authService.generateToken(user);
    console.log("✅ Token generado:", token.substring(0, 50) + "...");

    // 3. Verificar token
    console.log("\n3. Verificando token...");
    const decoded = authService.verifyToken(token);
    if (decoded) {
      console.log("✅ Token válido:", decoded);
    } else {
      console.log("❌ Token inválido");
      return;
    }

    // 4. Verificar permisos de base de datos
    console.log("\n4. Verificando permisos de base de datos...");
    const databases = ["APPDATA", "BD_ABM1", "BD_ABM2"];

    for (const dbName of databases) {
      const hasReadPermission = await authService.checkDatabasePermission(
        user.id,
        dbName,
        "read"
      );
      const hasWritePermission = await authService.checkDatabasePermission(
        user.id,
        dbName,
        "write"
      );
      const hasDeletePermission = await authService.checkDatabasePermission(
        user.id,
        dbName,
        "delete"
      );

      console.log(
        `  ${dbName}: Read=${hasReadPermission}, Write=${hasWritePermission}, Delete=${hasDeletePermission}`
      );
    }

    console.log("\n✅ Todas las pruebas completadas exitosamente");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    process.exit(0);
  }
}

testAuth();
