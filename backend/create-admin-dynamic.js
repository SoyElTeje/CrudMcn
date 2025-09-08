/**
 * Script para crear usuario admin basado en la estructura real de la tabla users
 * Solo usa los campos: id, username, password_hash, is_admin, created_at, updated_at, active
 * Obtiene dinámicamente todas las bases de datos del servidor
 */

const sql = require("mssql");
const bcrypt = require("bcrypt");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true,
  },
};

async function createAdmin() {
  let pool;

  try {
    console.log("🔗 Conectando a la base de datos...");
    pool = await sql.connect(config);
    console.log("✅ Conectado exitosamente");

    // Obtener todas las bases de datos del servidor
    console.log("🗄️ Obteniendo lista de bases de datos del servidor...");
    const databasesResult = await pool.request().query(`
      SELECT name 
      FROM sys.databases 
      WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
      AND state = 0
      ORDER BY name
    `);

    const databases = databasesResult.recordset.map((row) => row.name);
    console.log(`📋 Bases de datos encontradas: ${databases.length}`);
    databases.forEach((db) => console.log(`   - ${db}`));

    // Verificar si el usuario admin ya existe
    console.log("👤 Verificando usuario admin...");
    const adminCheck = await pool.request().query(`
      SELECT id FROM users WHERE username = 'admin'
    `);

    if (adminCheck.recordset.length > 0) {
      console.log("⚠️ Usuario admin ya existe, actualizando...");

      const hashedPassword = await bcrypt.hash("Admin123!", 10);

      await pool.request().input("password", hashedPassword).query(`
          UPDATE users 
          SET password_hash = @password, 
              is_admin = 1, 
              active = 1,
              updated_at = GETDATE()
          WHERE username = 'admin'
        `);

      console.log("✅ Usuario admin actualizado");
    } else {
      console.log("👤 Creando usuario admin...");

      const hashedPassword = await bcrypt.hash("Admin123!", 10);

      await pool
        .request()
        .input("username", "admin")
        .input("password", hashedPassword).query(`
          INSERT INTO users (username, password_hash, is_admin, active, created_at, updated_at)
          VALUES (@username, @password, 1, 1, GETDATE(), GETDATE())
        `);

      console.log("✅ Usuario admin creado");
    }

    // Obtener ID del usuario admin
    const adminResult = await pool.request().query(`
      SELECT id FROM users WHERE username = 'admin'
    `);
    const adminId = adminResult.recordset[0].id;

    // Configurar permisos del admin para todas las bases de datos
    console.log("🔐 Configurando permisos del admin...");

    for (const dbName of databases) {
      const permCheck = await pool
        .request()
        .input("userId", adminId)
        .input("dbName", dbName).query(`
          SELECT id FROM user_permissions 
          WHERE user_id = @userId AND database_name = @dbName
        `);

      if (permCheck.recordset.length === 0) {
         await pool.request().input("userId", adminId).input("dbName", dbName)
           .query(`
             INSERT INTO user_permissions (user_id, database_name, can_read, can_write, can_delete, can_create)
             VALUES (@userId, @dbName, 1, 1, 1, 1)
           `);

        console.log(`✅ Permisos configurados para: ${dbName}`);
      } else {
        console.log(`⚠️ Permisos ya existen para: ${dbName}`);
      }
    }

    console.log("\n🎉 USUARIO ADMIN CONFIGURADO");
    console.log("============================");
    console.log("👤 Usuario: admin");
    console.log("🔑 Contraseña: Admin123!");
    console.log("👑 Es Admin: Sí");
    console.log("✅ Activo: Sí");
    console.log(`🔐 Permisos: Completos en ${databases.length} bases de datos`);
    console.log("\n📋 Bases de datos configuradas:");
    databases.forEach((db) => console.log(`   ✅ ${db}`));
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Ejecutar
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log("\n✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { createAdmin };
