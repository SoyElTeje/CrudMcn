const sql = require("mssql");
const bcrypt = require("bcrypt");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function setupProductionApp() {
  let pool;

  try {
    console.log("🔌 Conectando a la base de datos de producción...");
    pool = await sql.connect(config);
    console.log("✅ Conexión exitosa a la base de datos");

    // Verificar que las tablas existen
    console.log("📋 Verificando estructura de la base de datos...");
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME
    `);

    const existingTables = tablesResult.recordset.map((row) => row.TABLE_NAME);
    console.log("📊 Tablas existentes:", existingTables);

    // Verificar si el usuario admin existe y tiene la contraseña correcta
    console.log("👤 Verificando usuario admin...");
    const adminResult = await pool.request().query(`
      SELECT id, password_hash, is_admin 
      FROM users 
      WHERE username = 'admin'
    `);

    if (adminResult.recordset.length === 0) {
      console.log(
        "❌ Usuario admin no encontrado. Ejecuta primero el script SQL setup_production_database.sql"
      );
      return;
    }

    const admin = adminResult.recordset[0];
    console.log(
      `✅ Usuario admin encontrado (ID: ${admin.id}, Admin: ${admin.is_admin})`
    );

    // Verificar si la contraseña ya está hasheada
    if (admin.password_hash === "admin") {
      console.log("🔐 Actualizando contraseña del usuario admin...");
      const hashedPassword = await bcrypt.hash("admin", 10);

      await pool.request().input("hashedPassword", sql.VarChar, hashedPassword)
        .query(`
          UPDATE users 
          SET password_hash = @hashedPassword, updated_at = GETDATE()
          WHERE username = 'admin'
        `);

      console.log("✅ Contraseña del usuario admin actualizada exitosamente");
    } else {
      console.log("✅ Usuario admin ya tiene contraseña hasheada");
    }

    // Verificar permisos del usuario admin
    console.log("🔑 Verificando permisos del usuario admin...");
    const permissionsResult = await pool.request().query(`
      SELECT COUNT(*) as permission_count
      FROM user_permissions 
      WHERE user_id = ${admin.id}
    `);

    if (permissionsResult.recordset[0].permission_count === 0) {
      console.log("⚠️  El usuario admin no tiene permisos configurados");
      console.log(
        "💡 Usa la interfaz web para configurar permisos específicos"
      );
    } else {
      console.log("✅ Usuario admin tiene permisos configurados");
    }

    // Verificar tablas activadas
    console.log("📋 Verificando tablas activadas...");
    const activatedTablesResult = await pool.request().query(`
      SELECT COUNT(*) as activated_count
      FROM activated_tables 
      WHERE is_active = 1
    `);

    if (activatedTablesResult.recordset[0].activated_count === 0) {
      console.log("⚠️  No hay tablas activadas");
      console.log("💡 Usa la interfaz web para activar tablas específicas");
    } else {
      console.log("✅ Hay tablas activadas configuradas");
    }

    console.log("\n🎉 Configuración de producción completada exitosamente!");
    console.log("\n📝 Próximos pasos:");
    console.log("1. Inicia el backend: npm start (desde la carpeta backend)");
    console.log(
      "2. Inicia el frontend: npm run dev (desde la carpeta frontend)"
    );
    console.log("3. Accede a http://localhost:5173");
    console.log("4. Inicia sesión con admin/admin");
    console.log("5. Configura permisos y tablas activadas desde la interfaz");
  } catch (error) {
    console.error("❌ Error durante la configuración:", error.message);
    console.error("🔍 Detalles del error:", error);

    if (error.code === "ELOGIN") {
      console.error("\n💡 Posibles soluciones:");
      console.error("- Verifica las credenciales en el archivo .env");
      console.error(
        "- Asegúrate de que el usuario tenga permisos en SQL Server"
      );
      console.error("- Ejecuta primero el script setup_sql_server_user.sql");
    } else if (error.code === "ENOTFOUND") {
      console.error("\n💡 Posibles soluciones:");
      console.error("- Verifica que el servidor SQL esté accesible");
      console.error("- Verifica la configuración de red");
      console.error("- Verifica el nombre del servidor en .env");
    }
  } finally {
    if (pool) {
      await pool.close();
      console.log("🔌 Conexión cerrada");
    }
  }
}

// Ejecutar la configuración
setupProductionApp();
