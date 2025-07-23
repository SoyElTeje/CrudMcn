const { getPool } = require("./db");

async function debugPermissionValues() {
  console.log("🔍 Debuggeando valores de permisos en la base de datos...\n");

  try {
    const pool = await getPool();

    // Verificar permisos de base de datos para user2
    console.log("1️⃣ Verificando permisos de base de datos para user2...");
    const dbPermissionsQuery = `
      SELECT UserId, DatabaseName, CanRead, CanWrite, CanDelete 
      FROM USER_DATABASE_PERMISSIONS 
      WHERE UserId = 3
    `;
    const dbPermissionsResult = await pool.request().query(dbPermissionsQuery);
    console.log("📋 Permisos de base de datos para user2:");
    console.log(JSON.stringify(dbPermissionsResult.recordset, null, 2));

    // Verificar permisos de tabla para user2
    console.log("\n2️⃣ Verificando permisos de tabla para user2...");
    const tablePermissionsQuery = `
      SELECT UserId, DatabaseName, TableName, CanRead, CanWrite, CanDelete 
      FROM USER_TABLE_PERMISSIONS 
      WHERE UserId = 3
    `;
    const tablePermissionsResult = await pool
      .request()
      .query(tablePermissionsQuery);
    console.log("📋 Permisos de tabla para user2:");
    console.log(JSON.stringify(tablePermissionsResult.recordset, null, 2));

    // Verificar todos los usuarios
    console.log("\n3️⃣ Verificando todos los usuarios...");
    const usersQuery = "SELECT Id, NombreUsuario FROM USERS_TABLE";
    const usersResult = await pool.request().query(usersQuery);
    console.log("📋 Usuarios en el sistema:");
    console.log(JSON.stringify(usersResult.recordset, null, 2));

    console.log("\n🎉 Debug de valores completado!");
  } catch (error) {
    console.error("❌ Error en el debug:", error);
  }
}

debugPermissionValues();
