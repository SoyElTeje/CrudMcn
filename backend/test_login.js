require("dotenv").config();
const sql = require("mssql");
const bcrypt = require("bcrypt");

async function testLogin() {
  try {
    console.log("🔍 Verificando credenciales de admin...");

    const config = {
      server: process.env.DB_SERVER || "localhost",
      database: "APPDATA",
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "simpleDev!",
      options: { encrypt: false, trustServerCertificate: true },
    };

    const pool = await sql.connect(config);

    // Verificar usuario admin
    const userResult = await pool.request().query(`
      SELECT id, username, password_hash, is_admin FROM users WHERE username = 'admin'
    `);

    if (userResult.recordset.length === 0) {
      console.log("❌ Usuario admin no encontrado");
      return;
    }

    const user = userResult.recordset[0];
    console.log("👤 Usuario admin encontrado:");
    console.log("  - ID:", user.id);
    console.log("  - Username:", user.username);
    console.log("  - is_admin:", user.is_admin);
    console.log(
      "  - Password hash:",
      user.password_hash.substring(0, 20) + "..."
    );

    // Probar diferentes contraseñas comunes
    const commonPasswords = [
      "admin",
      "admin123",
      "password",
      "123456",
      "simpleDev!",
    ];

    console.log("\n🔐 Probando contraseñas comunes:");
    for (const password of commonPasswords) {
      try {
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (isValid) {
          console.log(`✅ Contraseña correcta: "${password}"`);
          break;
        } else {
          console.log(`❌ Contraseña incorrecta: "${password}"`);
        }
      } catch (error) {
        console.log(`❌ Error verificando "${password}":`, error.message);
      }
    }

    await pool.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testLogin();
