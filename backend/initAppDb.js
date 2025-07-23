const sql = require("mssql");
const bcrypt = require("bcrypt");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

async function initializeAppDatabase() {
  try {
    console.log("🔧 Inicializando base de datos de la aplicación...");

    const pool = await sql.connect(config);

    // Verificar si la tabla de usuarios existe
    const tableExistsQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = '${process.env.USERS_TABLE}'
    `;

    const tableResult = await pool.request().query(tableExistsQuery);

    if (tableResult.recordset[0].count === 0) {
      console.log(
        `❌ La tabla ${process.env.USERS_TABLE} no existe. Por favor, créala con la estructura correcta.`
      );
      return;
    }

    console.log(`✅ Tabla ${process.env.USERS_TABLE} encontrada`);

    // Verificar si el usuario admin ya existe
    const checkAdminQuery = `
      SELECT TOP 1 * FROM ${process.env.USERS_TABLE} 
      WHERE NombreUsuario = @username
    `;

    const checkResult = await pool
      .request()
      .input("username", process.env.ADMIN_USER)
      .query(checkAdminQuery);

    if (checkResult.recordset.length === 0) {
      // Crear usuario administrador
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASS, 10);

      const insertAdminQuery = `
        INSERT INTO ${process.env.USERS_TABLE} (NombreUsuario, Contrasena, EsAdmin)
        VALUES (@username, @password, 1)
      `;

      await pool
        .request()
        .input("username", process.env.ADMIN_USER)
        .input("password", hashedPassword)
        .query(insertAdminQuery);

      console.log(
        `✅ Usuario administrador '${process.env.ADMIN_USER}' creado`
      );
    } else {
      console.log(
        `ℹ️ Usuario administrador '${process.env.ADMIN_USER}' ya existe`
      );
    }

    await pool.close();
    console.log("🎉 Base de datos de la aplicación inicializada correctamente");
  } catch (error) {
    console.error(
      "❌ Error inicializando la base de datos de la aplicación:",
      error
    );
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeAppDatabase();
}

module.exports = { initializeAppDatabase };
 