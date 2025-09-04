const bcrypt = require("bcrypt");
const { getPool } = require("./backend/db");

async function fixAdminPassword() {
  try {
    console.log("🔧 Generando hash correcto para contraseña 'admin'...");

    // Generar hash de la contraseña "admin"
    const password = "admin";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("✅ Hash generado:", hashedPassword);

    // Conectar a la base de datos
    const pool = await getPool();

    // Actualizar la contraseña del usuario admin
    const updateQuery = `
      UPDATE USERS_TABLE 
      SET Contrasena = @hashedPassword 
      WHERE NombreUsuario = 'admin'
    `;

    await pool
      .request()
      .input("hashedPassword", hashedPassword)
      .query(updateQuery);

    console.log("✅ Contraseña del usuario admin actualizada correctamente");

    // Verificar que se actualizó
    const verifyQuery =
      "SELECT Id, NombreUsuario, EsAdmin FROM USERS_TABLE WHERE NombreUsuario = 'admin'";
    const result = await pool.request().query(verifyQuery);

    if (result.recordset.length > 0) {
      const admin = result.recordset[0];
      console.log("✅ Usuario admin verificado:");
      console.log(`   - ID: ${admin.Id}`);
      console.log(`   - Usuario: ${admin.NombreUsuario}`);
      console.log(`   - EsAdmin: ${admin.EsAdmin}`);
    }

    console.log("");
    console.log("🎉 ¡Listo! Ahora puedes hacer login con:");
    console.log("   Usuario: admin");
    console.log("   Contraseña: admin");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

fixAdminPassword();
