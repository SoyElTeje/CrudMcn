const { getPool } = require("./db");

async function debugPermissions() {
  try {
    console.log("🔍 Verificando permisos en la base de datos...\n");

    const pool = await getPool();

    // 1. Verificar usuarios
    console.log("1️⃣ Usuarios en el sistema:");
    const usersResult = await pool.request().query(`
      SELECT Id, NombreUsuario, EsAdmin 
      FROM USERS_TABLE 
      ORDER BY Id
    `);
    usersResult.recordset.forEach((user) => {
      console.log(
        `  - ID: ${user.Id}, Usuario: ${user.NombreUsuario}, Admin: ${user.EsAdmin}`
      );
    });

    // 2. Verificar permisos de base de datos
    console.log("\n2️⃣ Permisos de base de datos:");
    const dbPermissionsResult = await pool.request().query(`
      SELECT UserId, DatabaseName, CanRead, CanWrite, CanDelete 
      FROM USER_DATABASE_PERMISSIONS 
      ORDER BY UserId, DatabaseName
    `);
    dbPermissionsResult.recordset.forEach((perm) => {
      console.log(
        `  - Usuario ${perm.UserId} -> ${perm.DatabaseName}: Read=${perm.CanRead}, Write=${perm.CanWrite}, Delete=${perm.CanDelete}`
      );
    });

    // 3. Verificar permisos de tabla
    console.log("\n3️⃣ Permisos de tabla:");
    const tablePermissionsResult = await pool.request().query(`
      SELECT UserId, DatabaseName, TableName, CanRead, CanWrite, CanDelete 
      FROM USER_TABLE_PERMISSIONS 
      ORDER BY UserId, DatabaseName, TableName
    `);
    tablePermissionsResult.recordset.forEach((perm) => {
      console.log(
        `  - Usuario ${perm.UserId} -> ${perm.DatabaseName}.${perm.TableName}: Read=${perm.CanRead}, Write=${perm.CanWrite}, Delete=${perm.CanDelete}`
      );
    });

    // 4. Verificar permisos de todos los usuarios
    console.log("\n4️⃣ Permisos de todos los usuarios:");
    for (const user of usersResult.recordset) {
      console.log(`\n  Usuario: ${user.NombreUsuario} (ID: ${user.Id})`);

      const userDbPerms = await pool.request().input("userId", user.Id).query(`
        SELECT DatabaseName, CanRead, CanWrite, CanDelete 
        FROM USER_DATABASE_PERMISSIONS 
        WHERE UserId = @userId
      `);
      if (userDbPerms.recordset.length > 0) {
        console.log("    Permisos de base de datos:");
        userDbPerms.recordset.forEach((perm) => {
          console.log(
            `      - ${perm.DatabaseName}: Read=${perm.CanRead}, Write=${perm.CanWrite}, Delete=${perm.CanDelete}`
          );
        });
      } else {
        console.log("    Sin permisos de base de datos");
      }

      const userTablePerms = await pool.request().input("userId", user.Id)
        .query(`
        SELECT DatabaseName, TableName, CanRead, CanWrite, CanDelete 
        FROM USER_TABLE_PERMISSIONS 
        WHERE UserId = @userId
      `);
      if (userTablePerms.recordset.length > 0) {
        console.log("    Permisos de tabla:");
        userTablePerms.recordset.forEach((perm) => {
          console.log(
            `      - ${perm.DatabaseName}.${perm.TableName}: Read=${perm.CanRead}, Write=${perm.CanWrite}, Delete=${perm.CanDelete}`
          );
        });
      } else {
        console.log("    Sin permisos de tabla");
      }
    }

    console.log("\n🎉 Verificación completada!");
  } catch (error) {
    console.error("❌ Error en la verificación:", error);
  } finally {
    process.exit(0);
  }
}

debugPermissions();
