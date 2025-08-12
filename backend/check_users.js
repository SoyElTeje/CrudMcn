const { getPool } = require("./db");

async function checkUsers() {
  try {
    console.log("🔍 Verificando usuarios en el sistema...");

    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT Id, NombreUsuario, EsAdmin, Activo, FechaCreacion
      FROM USERS_TABLE
      ORDER BY Id
    `);

    console.log("📋 Usuarios encontrados:");
    result.recordset.forEach((user) => {
      console.log(
        `- ID: ${user.Id}, Username: ${user.NombreUsuario}, Admin: ${user.EsAdmin}, Activo: ${user.Activo}`
      );
    });

    console.log(`\n✅ Total de usuarios: ${result.recordset.length}`);
  } catch (error) {
    console.error("❌ Error verificando usuarios:", error);
  }
}

if (require.main === module) {
  checkUsers()
    .then(() => {
      console.log("✅ Verificación completada");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Verificación falló:", error);
      process.exit(1);
    });
}

module.exports = { checkUsers };
