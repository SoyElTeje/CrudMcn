const { getPool } = require("./db");

async function debugAllPermissions() {
  console.log("🔍 Debuggeando todos los permisos en la base de datos...\n");

  try {
    const pool = await getPool();

    // Verificar todos los usuarios
    console.log("1️⃣ Verificando todos los usuarios...");
    const usersQuery = "SELECT Id, NombreUsuario FROM USERS_TABLE ORDER BY Id";
    const usersResult = await pool.request().query(usersQuery);
    console.log("📋 Usuarios en el sistema:");
    console.log(JSON.stringify(usersResult.recordset, null, 2));

    // Verificar todos los permisos de base de datos
    console.log("\n2️⃣ Verificando todos los permisos de base de datos...");
    const allDbPermissionsQuery = `
      SELECT UserId, DatabaseName, CanRead, CanWrite, CanDelete 
      FROM USER_DATABASE_PERMISSIONS 
      ORDER BY UserId, DatabaseName
    `;
    const allDbPermissionsResult = await pool
      .request()
      .query(allDbPermissionsQuery);
    console.log("📋 Todos los permisos de base de datos:");
    console.log(JSON.stringify(allDbPermissionsResult.recordset, null, 2));

    // Verificar todos los permisos de tabla
    console.log("\n3️⃣ Verificando todos los permisos de tabla...");
    const allTablePermissionsQuery = `
      SELECT UserId, DatabaseName, TableName, CanRead, CanWrite, CanDelete 
      FROM USER_TABLE_PERMISSIONS 
      ORDER BY UserId, DatabaseName, TableName
    `;
    const allTablePermissionsResult = await pool
      .request()
      .query(allTablePermissionsQuery);
    console.log("📋 Todos los permisos de tabla:");
    console.log(JSON.stringify(allTablePermissionsResult.recordset, null, 2));

    console.log("\n🎉 Debug de todos los permisos completado!");
  } catch (error) {
    console.error("❌ Error en el debug:", error);
  }
}

debugAllPermissions();
