const { getPool } = require("./db");

async function cleanupSQLUsers() {
  try {
    console.log("🧹 Limpiando usuarios de SQL Server...\n");

    const pool = await getPool();

    // Obtener todas las bases de datos
    const dbsResult = await pool
      .request()
      .query(
        "SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')"
      );

    const databases = dbsResult.recordset.map((row) => row.name);

    console.log(`📋 Bases de datos encontradas: ${databases.join(", ")}`);

    for (const dbName of databases) {
      try {
        console.log(`\n🔧 Limpiando usuarios en ${dbName}...`);

        const targetPool = await getPool(dbName);

        // Obtener usuarios que empiecen con 'user_' (nuestros usuarios de prueba)
        const usersQuery = `
          SELECT name 
          FROM sys.database_principals 
          WHERE name LIKE 'user_%' 
          AND type = 'U'
        `;

        const usersResult = await targetPool.request().query(usersQuery);
        const users = usersResult.recordset.map((row) => row.name);

        if (users.length === 0) {
          console.log(`   ℹ️  No hay usuarios de prueba en ${dbName}`);
          continue;
        }

        console.log(`   📋 Usuarios encontrados: ${users.join(", ")}`);

        // Eliminar cada usuario
        for (const userName of users) {
          try {
            const dropUserQuery = `DROP USER [${userName}]`;
            await targetPool.request().query(dropUserQuery);
            console.log(`   ✅ Usuario ${userName} eliminado de ${dbName}`);
          } catch (error) {
            console.log(
              `   ⚠️  Error eliminando usuario ${userName}: ${error.message}`
            );
          }
        }
      } catch (error) {
        console.log(`   ❌ Error accediendo a ${dbName}: ${error.message}`);
      }
    }

    console.log("\n✅ Limpieza de usuarios completada");
  } catch (error) {
    console.error("❌ Error en la limpieza:", error);
  } finally {
    process.exit(0);
  }
}

cleanupSQLUsers();
