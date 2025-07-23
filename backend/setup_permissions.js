const { getPool } = require("./db");
const authService = require("./services/authService");

async function setupDefaultPermissions() {
  try {
    console.log("🔧 Configurando permisos por defecto...");

    const pool = await getPool();

    // Obtener el usuario admin
    const adminResult = await pool
      .request()
      .input("username", "admin")
      .query("SELECT Id FROM USERS_TABLE WHERE NombreUsuario = @username");

    if (adminResult.recordset.length === 0) {
      console.log("❌ Usuario admin no encontrado");
      return;
    }

    const adminId = adminResult.recordset[0].Id;
    console.log(`✅ Usuario admin encontrado con ID: ${adminId}`);

    // Obtener todas las bases de datos
    const databasesResult = await pool
      .request()
      .query(
        "SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')"
      );

    const databases = databasesResult.recordset.map((row) => row.name);
    console.log(`📋 Bases de datos encontradas: ${databases.join(", ")}`);

    // Asignar permisos completos al admin en todas las bases de datos
    for (const dbName of databases) {
      try {
        await authService.assignDatabasePermission(adminId, dbName, {
          canRead: true,
          canWrite: true,
          canDelete: true,
        });
        console.log(`✅ Permisos asignados para base de datos: ${dbName}`);
      } catch (error) {
        console.log(
          `⚠️  Error asignando permisos para ${dbName}:`,
          error.message
        );
      }
    }

    console.log("✅ Permisos por defecto configurados exitosamente");
  } catch (error) {
    console.error("❌ Error configurando permisos:", error);
  } finally {
    process.exit(0);
  }
}

setupDefaultPermissions();
