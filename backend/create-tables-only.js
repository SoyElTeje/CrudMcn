/**
 * Script para crear solo las tablas necesarias
 */

const sql = require("mssql");
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

async function createTables() {
  let pool;

  try {
    console.log("🔗 Conectando a la base de datos...");
    pool = await sql.connect(config);
    console.log("✅ Conectado exitosamente");

    // Crear tabla users
    console.log("📋 Creando tabla users...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        full_name NVARCHAR(255),
        is_active BIT DEFAULT 1,
        is_admin BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log("✅ Tabla users creada");

    // Crear tabla user_permissions
    console.log("📋 Creando tabla user_permissions...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_permissions' AND xtype='U')
      CREATE TABLE user_permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        database_name NVARCHAR(100) NOT NULL,
        can_read BIT DEFAULT 0,
        can_write BIT DEFAULT 0,
        can_delete BIT DEFAULT 0,
        can_export BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, database_name)
      )
    `);
    console.log("✅ Tabla user_permissions creada");

    // Crear tabla activated_tables
    console.log("📋 Creando tabla activated_tables...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='activated_tables' AND xtype='U')
      CREATE TABLE activated_tables (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        database_name NVARCHAR(100) NOT NULL,
        table_name NVARCHAR(100) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, database_name, table_name)
      )
    `);
    console.log("✅ Tabla activated_tables creada");

    // Crear tabla audit_logs
    console.log("📋 Creando tabla audit_logs...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
      CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        action NVARCHAR(50) NOT NULL,
        database_name NVARCHAR(100) NOT NULL,
        table_name NVARCHAR(100) NOT NULL,
        record_id NVARCHAR(100),
        old_values NVARCHAR(MAX),
        new_values NVARCHAR(MAX),
        affected_rows INT DEFAULT 1,
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(500),
        timestamp DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tabla audit_logs creada");

    // Crear índices
    console.log("📊 Creando índices...");

    const indexes = [
      "CREATE INDEX IX_users_username ON users(username)",
      "CREATE INDEX IX_user_permissions_user_id ON user_permissions(user_id)",
      "CREATE INDEX IX_user_permissions_database ON user_permissions(database_name)",
      "CREATE INDEX IX_activated_tables_user_id ON activated_tables(user_id)",
      "CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id)",
      "CREATE INDEX IX_audit_logs_action ON audit_logs(action)",
      "CREATE INDEX IX_audit_logs_timestamp ON audit_logs(timestamp)",
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.request().query(indexQuery);
      } catch (error) {
        // Ignorar errores si el índice ya existe
        if (!error.message.includes("already exists")) {
          console.log(`⚠️ Error creando índice: ${error.message}`);
        }
      }
    }

    console.log("✅ Índices creados");

    console.log("\n🎉 TABLAS CREADAS EXITOSAMENTE");
    console.log("==============================");
    console.log("📋 Tablas creadas:");
    console.log("   ✅ users");
    console.log("   ✅ user_permissions");
    console.log("   ✅ activated_tables");
    console.log("   ✅ audit_logs");
    console.log("\n📊 Índices creados para optimización");
    console.log("\n🚀 Las tablas están listas para usar");
  } catch (error) {
    console.error("❌ Error creando tablas:", error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log("\n🔌 Conexión cerrada");
    }
  }
}

// Ejecutar
if (require.main === module) {
  createTables()
    .then(() => {
      console.log("\n✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { createTables };







