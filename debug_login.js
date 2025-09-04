const bcrypt = require("bcrypt");
const { getPool } = require("./backend/db");

async function debugLogin() {
  try {
    console.log("🔍 Diagnosticando problema de login...");
    console.log("");

    // Conectar a la base de datos
    const pool = await getPool();

    // 1. Verificar que el usuario admin existe
    console.log("1️⃣ Verificando usuario admin...");
    const adminQuery =
      "SELECT * FROM USERS_TABLE WHERE NombreUsuario = 'admin'";
    const adminResult = await pool.request().query(adminQuery);

    if (adminResult.recordset.length === 0) {
      console.log("❌ Usuario admin no encontrado");
      return;
    }

    const admin = adminResult.recordset[0];
    console.log("✅ Usuario admin encontrado:");
    console.log(`   - ID: ${admin.Id}`);
    console.log(`   - NombreUsuario: ${admin.NombreUsuario}`);
    console.log(`   - EsAdmin: ${admin.EsAdmin}`);
    console.log(`   - Activo: ${admin.Activo}`);
    console.log(
      `   - Contraseña (longitud): ${
        admin.Contrasena ? admin.Contrasena.length : 0
      }`
    );
    console.log(
      `   - Contraseña (inicio): ${
        admin.Contrasena ? admin.Contrasena.substring(0, 10) + "..." : "NULL"
      }`
    );
    console.log("");

    // 2. Verificar si la contraseña está hasheada
    console.log("2️⃣ Verificando hash de contraseña...");
    const isHashed =
      admin.Contrasena &&
      (admin.Contrasena.startsWith("$2b$") ||
        admin.Contrasena.startsWith("$2a$"));

    console.log(`   - ¿Está hasheada?: ${isHashed}`);
    console.log("");

    // 3. Probar diferentes contraseñas
    console.log("3️⃣ Probando contraseñas...");

    const testPasswords = ["admin", "admin123", "password", ""];

    for (const testPassword of testPasswords) {
      if (admin.Contrasena) {
        try {
          const isValid = await bcrypt.compare(testPassword, admin.Contrasena);
          console.log(
            `   - "${testPassword}": ${isValid ? "✅ VÁLIDA" : "❌ inválida"}`
          );
        } catch (error) {
          console.log(`   - "${testPassword}": ❌ Error al verificar`);
        }
      } else {
        console.log(`   - "${testPassword}": ❌ No hay contraseña almacenada`);
      }
    }
    console.log("");

    // 4. Generar nuevo hash para "admin"
    console.log("4️⃣ Generando nuevo hash para 'admin'...");
    const newHash = await bcrypt.hash("admin", 10);
    console.log(`   - Nuevo hash: ${newHash}`);
    console.log("");

    // 5. Actualizar contraseña
    console.log("5️⃣ Actualizando contraseña...");
    const updateQuery = `
      UPDATE USERS_TABLE 
      SET Contrasena = @newHash 
      WHERE NombreUsuario = 'admin'
    `;

    await pool.request().input("newHash", newHash).query(updateQuery);

    console.log("✅ Contraseña actualizada");
    console.log("");

    // 6. Verificar que funciona
    console.log("6️⃣ Verificando nueva contraseña...");
    const testNewPassword = await bcrypt.compare("admin", newHash);
    console.log(
      `   - "admin" con nuevo hash: ${
        testNewPassword ? "✅ VÁLIDA" : "❌ inválida"
      }`
    );
    console.log("");

    console.log("🎉 ¡Diagnóstico completado!");
    console.log("Ahora intenta hacer login con:");
    console.log("   Usuario: admin");
    console.log("   Contraseña: admin");
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error.message);
  } finally {
    process.exit(0);
  }
}

debugLogin();
