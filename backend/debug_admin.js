const { getPool } = require("./db");

async function debugAdmin() {
  try {
    console.log("🔍 Debuggeando valor de EsAdmin...");

    const pool = await getPool();

    // Verificar valor exacto de EsAdmin
    const result = await pool
      .request()
      .input("username", "admin")
      .query(
        "SELECT Id, NombreUsuario, EsAdmin, CAST(EsAdmin AS INT) as EsAdminInt FROM USERS_TABLE WHERE NombreUsuario = @username"
      );

    if (result.recordset.length === 0) {
      console.log("❌ Usuario admin no encontrado");
      return;
    }

    const user = result.recordset[0];
    console.log("👤 Usuario encontrado:");
    console.log(`  - Id: ${user.Id}`);
    console.log(`  - NombreUsuario: ${user.NombreUsuario}`);
    console.log(`  - EsAdmin (original): ${user.EsAdmin}`);
    console.log(`  - EsAdmin (como int): ${user.EsAdminInt}`);
    console.log(`  - EsAdmin === 1: ${user.EsAdmin === 1}`);
    console.log(`  - EsAdmin === true: ${user.EsAdmin === true}`);
    console.log(`  - EsAdmin == 1: ${user.EsAdmin == 1}`);
    console.log(`  - EsAdmin == true: ${user.EsAdmin == true}`);
  } catch (error) {
    console.error("❌ Error debuggeando:", error);
  } finally {
    process.exit(0);
  }
}

debugAdmin();
