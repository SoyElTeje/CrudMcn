const { getPool } = require("./db");

async function checkPermissions() {
  try {
    console.log("🔍 Verificando permisos asignados...");

    const pool = await getPool();

    // Verificar permisos de base de datos del admin
    const dbPermissionsResult = await pool.request().input("userId", 1).query(`
        SELECT DatabaseName, CanRead, CanWrite, CanDelete 
        FROM USER_DATABASE_PERMISSIONS 
        WHERE UserId = @userId
      `);

    console.log("📋 Permisos de base de datos del admin:");
    dbPermissionsResult.recordset.forEach((perm) => {
      console.log(
        `  - ${perm.DatabaseName}: Read=${perm.CanRead}, Write=${perm.CanWrite}, Delete=${perm.CanDelete}`
      );
    });

    // Verificar que el usuario admin tiene EsAdmin = 1
    const adminResult = await pool
      .request()
      .input("userId", 1)
      .query(
        "SELECT NombreUsuario, EsAdmin FROM USERS_TABLE WHERE Id = @userId"
      );

    if (adminResult.recordset.length > 0) {
      const admin = adminResult.recordset[0];
      console.log(
        `👤 Usuario admin: ${admin.NombreUsuario}, EsAdmin: ${admin.EsAdmin}`
      );
    }
  } catch (error) {
    console.error("❌ Error verificando permisos:", error);
  } finally {
    process.exit(0);
  }
}

checkPermissions();
