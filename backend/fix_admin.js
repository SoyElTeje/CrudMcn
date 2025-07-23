const { getPool } = require("./db");

async function fixAdmin() {
  try {
    console.log("🔧 Corrigiendo estado de admin...");

    const pool = await getPool();

    // Verificar estado actual
    const currentResult = await pool
      .request()
      .input("username", "admin")
      .query(
        "SELECT Id, NombreUsuario, EsAdmin FROM USERS_TABLE WHERE NombreUsuario = @username"
      );

    if (currentResult.recordset.length === 0) {
      console.log("❌ Usuario admin no encontrado");
      return;
    }

    const user = currentResult.recordset[0];
    console.log(
      `👤 Estado actual: ${user.NombreUsuario}, EsAdmin: ${user.EsAdmin}`
    );

    // Actualizar a admin
    await pool
      .request()
      .input("userId", user.Id)
      .query("UPDATE USERS_TABLE SET EsAdmin = 1 WHERE Id = @userId");

    console.log("✅ Usuario admin actualizado correctamente");

    // Verificar el cambio
    const updatedResult = await pool
      .request()
      .input("username", "admin")
      .query(
        "SELECT Id, NombreUsuario, EsAdmin FROM USERS_TABLE WHERE NombreUsuario = @username"
      );

    const updatedUser = updatedResult.recordset[0];
    console.log(
      `👤 Estado actualizado: ${updatedUser.NombreUsuario}, EsAdmin: ${updatedUser.EsAdmin}`
    );
  } catch (error) {
    console.error("❌ Error corrigiendo admin:", error);
  } finally {
    process.exit(0);
  }
}

fixAdmin();
