require("dotenv").config();
const sql = require("mssql");

async function checkActivatedTables() {
  try {
    console.log("🔍 Verificando tablas activadas...");

    const config = {
      server: process.env.DB_SERVER || "localhost",
      database: "APPDATA",
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "simpleDev!",
      options: { encrypt: false, trustServerCertificate: true },
    };

    console.log("🔌 Conectando a:", config.server);
    const pool = await sql.connect(config);

    // Verificar si existe la tabla ACTIVATED_TABLES
    const tableExists = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'ACTIVATED_TABLES'
    `);

    console.log(
      "📋 Tabla ACTIVATED_TABLES existe:",
      tableExists.recordset[0].count > 0
    );

    if (tableExists.recordset[0].count > 0) {
      // Verificar estructura de la tabla
      const structure = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'ACTIVATED_TABLES'
        ORDER BY ORDINAL_POSITION
      `);

      console.log("🏗️ Estructura de ACTIVATED_TABLES:");
      structure.recordset.forEach((col) => {
        console.log(
          `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${
            col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });

      // Obtener todas las tablas activadas
      const activatedTables = await pool.request().query(`
        SELECT * FROM ACTIVATED_TABLES WHERE IsActive = 1
      `);

      console.log(
        "\n📊 Tablas activadas encontradas:",
        activatedTables.recordset.length
      );
      if (activatedTables.recordset.length > 0) {
        console.log("📋 Datos:");
        activatedTables.recordset.forEach((table, index) => {
          console.log(
            `  ${index + 1}. ${table.DatabaseName}.${table.TableName} - ${
              table.Description || "Sin descripción"
            }`
          );
        });
      } else {
        console.log("⚠️ No hay tablas activadas en la base de datos");
      }

      // Verificar si hay tablas inactivas
      const inactiveTables = await pool.request().query(`
        SELECT COUNT(*) as count FROM ACTIVATED_TABLES WHERE IsActive = 0
      `);
      console.log("📊 Tablas inactivas:", inactiveTables.recordset[0].count);
    } else {
      console.log("❌ La tabla ACTIVATED_TABLES no existe");
    }

    // Verificar usuarios y permisos de admin
    const users = await pool.request().query(`
      SELECT id, username, is_admin FROM users
    `);

    console.log("\n👥 Usuarios en el sistema:");
    users.recordset.forEach((user) => {
      console.log(
        `  - ${user.username} (ID: ${user.id}) - Admin: ${
          user.is_admin || "N/A"
        }`
      );
    });

    await pool.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkActivatedTables();
