require("dotenv").config();
const sql = require("mssql");

async function checkUsersStructure() {
  try {
    console.log("🔍 Verificando estructura de tabla users...");

    const config = {
      server: process.env.DB_SERVER || "localhost",
      database: "APPDATA",
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "simpleDev!",
      options: { encrypt: false, trustServerCertificate: true },
    };

    const pool = await sql.connect(config);

    // Verificar estructura de la tabla users
    const structure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("🏗️ Estructura de tabla users:");
    structure.recordset.forEach((col) => {
      console.log(
        `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${
          col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
        })`
      );
    });

    // Verificar datos de usuarios
    const users = await pool.request().query(`
      SELECT * FROM users
    `);

    console.log("\n👥 Usuarios en la tabla:");
    users.recordset.forEach((user) => {
      console.log("Usuario:", user);
    });

    await pool.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkUsersStructure();
