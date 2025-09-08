/**
 * Script completo para configurar la base de datos AbmMcn
 * Crea todas las tablas necesarias y configura el usuario admin
 */

const sql = require("mssql");
require("dotenv").config();

// Configuración de conexión
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
    requestTimeout: 30000,
    connectionTimeout: 15000,
  },
};

async function setupDatabase() {
  let pool;

  try {
    console.log("🔗 Conectando a la base de datos...");
    pool = await sql.connect(config);
    console.log("✅ Conectado exitosamente a la base de datos");

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

    // Crear índices para optimización
    console.log("📊 Creando índices...");

    // Índices para users
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_username')
      CREATE INDEX IX_users_username ON users(username)
    `);

    // Índices para user_permissions
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_permissions_user_id')
      CREATE INDEX IX_user_permissions_user_id ON user_permissions(user_id)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_permissions_database')
      CREATE INDEX IX_user_permissions_database ON user_permissions(database_name)
    `);

    // Índices para activated_tables
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_activated_tables_user_id')
      CREATE INDEX IX_activated_tables_user_id ON activated_tables(user_id)
    `);

    // Índices para audit_logs
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_audit_logs_user_id')
      CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_audit_logs_action')
      CREATE INDEX IX_audit_logs_action ON audit_logs(action)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_audit_logs_timestamp')
      CREATE INDEX IX_audit_logs_timestamp ON audit_logs(timestamp)
    `);

    console.log("✅ Índices creados");

    // Verificar si el usuario admin ya existe
    console.log("👤 Verificando usuario admin...");
    const adminCheck = await pool.request().query(`
      SELECT id FROM users WHERE username = 'admin'
    `);

    if (adminCheck.recordset.length > 0) {
      console.log("⚠️ Usuario admin ya existe");

      // Actualizar contraseña del admin existente
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("Admin123!", 10);

      await pool.request().input("password", hashedPassword).query(`
          UPDATE users 
          SET password_hash = @password, 
              is_admin = 1, 
              is_active = 1,
              updated_at = GETDATE()
          WHERE username = 'admin'
        `);

      console.log("✅ Contraseña del usuario admin actualizada");
    } else {
      // Crear usuario admin
      console.log("👤 Creando usuario admin...");
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("Admin123!", 10);

      await pool
        .request()
        .input("username", "admin")
        .input("password", hashedPassword)
        .input("email", "admin@abmmcn.com")
        .input("fullName", "Administrador del Sistema").query(`
          INSERT INTO users (username, password_hash, email, full_name, is_admin, is_active)
          VALUES (@username, @password, @email, @fullName, 1, 1)
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

    // Lista de bases de datos comunes (ajustar según tu entorno)
    const databases = ["APPDATA", "BD_ABM1", "BD_ABM2", "BI_EDITOR", "master"];

    for (const dbName of databases) {
      // Verificar si el permiso ya existe
      const permCheck = await pool
        .request()
        .input("userId", adminId)
        .input("dbName", dbName).query(`
          SELECT id FROM user_permissions 
          WHERE user_id = @userId AND database_name = @dbName
        `);

      if (permCheck.recordset.length === 0) {
        // Crear permisos completos para el admin
        await pool.request().input("userId", adminId).input("dbName", dbName)
          .query(`
            INSERT INTO user_permissions (user_id, database_name, can_read, can_write, can_delete, can_export)
            VALUES (@userId, @dbName, 1, 1, 1, 1)
          `);

        console.log(`✅ Permisos configurados para base de datos: ${dbName}`);
      } else {
        console.log(`⚠️ Permisos ya existen para base de datos: ${dbName}`);
      }
    }

    // Crear un log de configuración inicial
    console.log("📝 Creando log de configuración inicial...");
    await pool
      .request()
      .input("userId", adminId)
      .input("action", "SETUP")
      .input("dbName", process.env.DB_DATABASE)
      .input("tableName", "system")
      .input("recordId", "initial_setup")
      .input(
        "newValues",
        JSON.stringify({
          message: "Configuración inicial de la base de datos completada",
          tables_created: [
            "users",
            "user_permissions",
            "activated_tables",
            "audit_logs",
          ],
          admin_user_created: true,
          timestamp: new Date().toISOString(),
        })
      ).query(`
        INSERT INTO audit_logs (user_id, action, database_name, table_name, record_id, new_values, affected_rows)
        VALUES (@userId, @action, @dbName, @tableName, @recordId, @newValues, 1)
      `);

    console.log("✅ Log de configuración creado");

    // Mostrar resumen
    console.log("\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE");
    console.log("==========================================");
    console.log("📋 Tablas creadas:");
    console.log("   ✅ users");
    console.log("   ✅ user_permissions");
    console.log("   ✅ activated_tables");
    console.log("   ✅ audit_logs");
    console.log("\n👤 Usuario admin:");
    console.log("   Usuario: admin");
    console.log("   Contraseña: Admin123!");
    console.log("   Permisos: Completos en todas las bases de datos");
    console.log("\n🔐 Bases de datos configuradas:");
    databases.forEach((db) => console.log(`   ✅ ${db}`));
    console.log("\n📊 Índices creados para optimización");
    console.log("\n🚀 El sistema está listo para usar");
  } catch (error) {
    console.error("❌ Error durante la configuración:", error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log("\n🔌 Conexión a la base de datos cerrada");
    }
  }
}

// Ejecutar la configuración
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("\n✅ Script de configuración completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error en el script de configuración:", error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
