const bcrypt = require("bcrypt");
const { getPool } = require("./db");

async function fixAdminCredentials() {
  try {
    console.log("🔧 Verificando y corrigiendo credenciales del admin...");

    const pool = await getPool();

    // Verificar si el admin existe
    const checkAdminQuery =
      "SELECT * FROM USERS_TABLE WHERE NombreUsuario = 'admin'";
    const adminResult = await pool.request().query(checkAdminQuery);

    if (adminResult.recordset.length === 0) {
      console.log("❌ El usuario admin no existe");
      return;
    }

    const admin = adminResult.recordset[0];
    console.log("📋 Admin encontrado:", {
      Id: admin.Id,
      NombreUsuario: admin.NombreUsuario,
      EsAdmin: admin.EsAdmin,
      Activo: admin.Activo,
    });

    // Verificar si la contraseña está hasheada
    const isHashed =
      admin.Contrasena.startsWith("$2b$") ||
      admin.Contrasena.startsWith("$2a$");
    console.log("🔐 Contraseña hasheada:", isHashed);

    if (!isHashed) {
      console.log("🔄 Hasheando contraseña del admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await pool
        .request()
        .input("adminId", admin.Id)
        .input("hashedPassword", hashedPassword)
        .query(
          "UPDATE USERS_TABLE SET Contrasena = @hashedPassword WHERE Id = @adminId"
        );

      console.log("✅ Contraseña del admin hasheada correctamente");
    } else {
      console.log("✅ La contraseña ya está hasheada");
    }

    // Verificar que el admin tenga EsAdmin = true
    if (!admin.EsAdmin) {
      console.log("🔄 Configurando admin como administrador...");
      await pool
        .request()
        .input("adminId", admin.Id)
        .query("UPDATE USERS_TABLE SET EsAdmin = 1 WHERE Id = @adminId");

      console.log("✅ Admin configurado como administrador");
    } else {
      console.log("✅ Admin ya tiene permisos de administrador");
    }

    // Verificar que el admin esté activo
    if (!admin.Activo) {
      console.log("🔄 Activando cuenta del admin...");
      await pool
        .request()
        .input("adminId", admin.Id)
        .query("UPDATE USERS_TABLE SET Activo = 1 WHERE Id = @adminId");

      console.log("✅ Cuenta del admin activada");
    } else {
      console.log("✅ Admin ya está activo");
    }

    console.log("✅ Credenciales del admin verificadas y corregidas");
  } catch (error) {
    console.error("❌ Error corrigiendo credenciales:", error);
  }
}

if (require.main === module) {
  fixAdminCredentials()
    .then(() => {
      console.log("✅ Proceso completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Proceso falló:", error);
      process.exit(1);
    });
}

module.exports = { fixAdminCredentials };
