const bcrypt = require("bcrypt");
const { getPool } = require("./db");

async function debugAuth() {
  try {
    console.log("🔍 Debuggeando proceso de autenticación...");

    const pool = await getPool();

    // 1. Obtener el usuario admin
    console.log("\n1. Obteniendo usuario admin...");
    const adminQuery =
      "SELECT * FROM USERS_TABLE WHERE NombreUsuario = 'admin'";
    const adminResult = await pool.request().query(adminQuery);

    if (adminResult.recordset.length === 0) {
      console.log("❌ Usuario admin no encontrado");
      return;
    }

    const admin = adminResult.recordset[0];
    console.log("✅ Admin encontrado:", {
      Id: admin.Id,
      NombreUsuario: admin.NombreUsuario,
      EsAdmin: admin.EsAdmin,
      Activo: admin.Activo,
      ContrasenaLength: admin.Contrasena ? admin.Contrasena.length : 0,
      ContrasenaStart: admin.Contrasena
        ? admin.Contrasena.substring(0, 10) + "..."
        : "null",
    });

    // 2. Verificar si la contraseña está hasheada
    console.log("\n2. Verificando hash de contraseña...");
    const isHashed =
      admin.Contrasena &&
      (admin.Contrasena.startsWith("$2b$") ||
        admin.Contrasena.startsWith("$2a$"));
    console.log("🔐 Es hash bcrypt:", isHashed);

    // 3. Probar comparación de contraseñas
    console.log("\n3. Probando comparación de contraseñas...");

    // Probar con "admin123"
    const testPassword1 = "admin123";
    const isValid1 = await bcrypt.compare(testPassword1, admin.Contrasena);
    console.log(`🔑 Contraseña "${testPassword1}" válida:`, isValid1);

    // Probar con "admin"
    const testPassword2 = "admin";
    const isValid2 = await bcrypt.compare(testPassword2, admin.Contrasena);
    console.log(`🔑 Contraseña "${testPassword2}" válida:`, isValid2);

    // Probar con contraseña vacía
    const testPassword3 = "";
    const isValid3 = await bcrypt.compare(testPassword3, admin.Contrasena);
    console.log(`🔑 Contraseña vacía válida:`, isValid3);

    // 4. Generar un nuevo hash para comparar
    console.log("\n4. Generando nuevo hash para comparar...");
    const newHash = await bcrypt.hash("admin123", 10);
    console.log("🆕 Nuevo hash generado:", newHash.substring(0, 20) + "...");

    const isValidNew = await bcrypt.compare("admin123", newHash);
    console.log("✅ Nuevo hash funciona:", isValidNew);

    // 5. Verificar si el hash actual funciona
    console.log("\n5. Verificando hash actual...");
    try {
      const isValidCurrent = await bcrypt.compare("admin123", admin.Contrasena);
      console.log("✅ Hash actual funciona:", isValidCurrent);
    } catch (error) {
      console.log("❌ Error con hash actual:", error.message);
    }
  } catch (error) {
    console.error("❌ Error en debug:", error);
  }
}

if (require.main === module) {
  debugAuth()
    .then(() => {
      console.log("\n✅ Debug completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Debug falló:", error);
      process.exit(1);
    });
}

module.exports = { debugAuth };
