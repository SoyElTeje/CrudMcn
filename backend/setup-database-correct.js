#!/usr/bin/env node

/**
 * Script de configuración de base de datos con nombres correctos
 * Crea las tablas con los nombres que espera el código del backend
 */

// Cargar variables de entorno
require('dotenv').config();

const { getPool } = require("./db");
const logger = require("./config/logger");

async function setupDatabaseCorrect() {
  try {
    console.log("🔧 Configurando base de datos con nombres correctos...");

    const pool = await getPool();

    // Comandos SQL para crear las tablas con nombres correctos
    const commands = [
      // Crear tabla de usuarios (nombre correcto: users)
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      BEGIN
          CREATE TABLE users (
              id INT IDENTITY(1,1) PRIMARY KEY,
              username NVARCHAR(100) UNIQUE NOT NULL,
              password_hash NVARCHAR(255) NOT NULL,
              is_admin BIT NOT NULL DEFAULT 0,
              created_at DATETIME2 DEFAULT GETDATE(),
              updated_at DATETIME2 DEFAULT GETDATE(),
              active BIT DEFAULT 1
          );
          PRINT '✅ Tabla users creada exitosamente';
      END
      ELSE
      BEGIN
          PRINT 'ℹ️ Tabla users ya existe';
      END`,

      // Crear tabla de permisos de usuario (nombre correcto: user_permissions)
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_permissions' AND xtype='U')
      BEGIN
          CREATE TABLE user_permissions (
              id INT IDENTITY(1,1) PRIMARY KEY,
              user_id INT NOT NULL,
              database_name NVARCHAR(128) NOT NULL,
              table_name NVARCHAR(128) NULL,
              can_read BIT DEFAULT 1,
              can_write BIT DEFAULT 0,
              can_delete BIT DEFAULT 0,
              can_create BIT DEFAULT 0,
              created_at DATETIME2 DEFAULT GETDATE(),
              updated_at DATETIME2 DEFAULT GETDATE(),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
          PRINT '✅ Tabla user_permissions creada exitosamente';
      END
      ELSE
      BEGIN
          PRINT 'ℹ️ Tabla user_permissions ya existe';
      END`,

      // Crear tabla de tablas activadas (nombre correcto: activated_tables)
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='activated_tables' AND xtype='U')
      BEGIN
          CREATE TABLE activated_tables (
              id INT IDENTITY(1,1) PRIMARY KEY,
              database_name NVARCHAR(128) NOT NULL,
              table_name NVARCHAR(128) NOT NULL,
              is_active BIT DEFAULT 1,
              created_at DATETIME2 DEFAULT GETDATE(),
              updated_at DATETIME2 DEFAULT GETDATE(),
              created_by INT NULL,
              updated_by INT NULL,
              description NVARCHAR(500) NULL,
              FOREIGN KEY (created_by) REFERENCES users(id),
              FOREIGN KEY (updated_by) REFERENCES users(id)
          );
          PRINT '✅ Tabla activated_tables creada exitosamente';
      END
      ELSE
      BEGIN
          PRINT 'ℹ️ Tabla activated_tables ya existe';
      END`,

      // Crear tabla de logs de auditoría (nombre correcto: audit_logs)
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
      BEGIN
          CREATE TABLE audit_logs (
              id INT IDENTITY(1,1) PRIMARY KEY,
              user_id INT NULL,
              action NVARCHAR(100) NOT NULL,
              table_name NVARCHAR(128) NULL,
              database_name NVARCHAR(128) NULL,
              record_id INT NULL,
              old_values NVARCHAR(MAX) NULL,
              new_values NVARCHAR(MAX) NULL,
              ip_address NVARCHAR(45) NULL,
              user_agent NVARCHAR(500) NULL,
              timestamp DATETIME2 DEFAULT GETDATE(),
              FOREIGN KEY (user_id) REFERENCES users(id)
          );
          PRINT '✅ Tabla audit_logs creada exitosamente';
      END
      ELSE
      BEGIN
          PRINT 'ℹ️ Tabla audit_logs ya existe';
      END`
    ];

    // Ejecutar comandos
    for (const command of commands) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.error(`❌ Error ejecutando comando: ${error.message}`);
        throw error;
      }
    }

    // Crear índices para mejorar rendimiento
    const indexCommands = [
      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_username' AND object_id = OBJECT_ID('users'))
      BEGIN
          CREATE INDEX IX_users_username ON users(username);
          PRINT '✅ Índice IX_users_username creado';
      END`,

      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_permissions_user_db' AND object_id = OBJECT_ID('user_permissions'))
      BEGIN
          CREATE INDEX IX_user_permissions_user_db ON user_permissions(user_id, database_name);
          PRINT '✅ Índice IX_user_permissions_user_db creado';
      END`,

      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_activated_tables_db_table' AND object_id = OBJECT_ID('activated_tables'))
      BEGIN
          CREATE INDEX IX_activated_tables_db_table ON activated_tables(database_name, table_name);
          PRINT '✅ Índice IX_activated_tables_db_table creado';
      END`,

      `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_audit_logs_timestamp' AND object_id = OBJECT_ID('audit_logs'))
      BEGIN
          CREATE INDEX IX_audit_logs_timestamp ON audit_logs(timestamp);
          PRINT '✅ Índice IX_audit_logs_timestamp creado';
      END`
    ];

    console.log("\n📊 Creando índices para mejorar rendimiento...");
    for (const command of indexCommands) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.warn(`⚠️ Error creando índice: ${error.message}`);
      }
    }

    // Verificar estructura creada
    console.log("\n🔍 Verificando estructura de tablas...");
    const tables = ['users', 'user_permissions', 'activated_tables', 'audit_logs'];
    
    for (const table of tables) {
      try {
        const result = await pool.request().query(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${table}'
        `);
        
        if (result.recordset[0].count > 0) {
          console.log(`✅ Tabla ${table} verificada`);
        } else {
          console.log(`❌ Tabla ${table} no encontrada`);
        }
      } catch (error) {
        console.log(`❌ Error verificando tabla ${table}: ${error.message}`);
      }
    }

    console.log("\n🎉 Configuración de base de datos completada exitosamente!");
    console.log("\n📋 Tablas creadas:");
    console.log("  - users (usuarios del sistema)");
    console.log("  - user_permissions (permisos granulares)");
    console.log("  - activated_tables (tablas activadas)");
    console.log("  - audit_logs (logs de auditoría)");
    
    console.log("\n🚀 El sistema está listo para usar!");
    console.log("   Usuario admin por defecto: admin / admin123");

  } catch (error) {
    console.error(`❌ Error configurando base de datos: ${error.message}`);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupDatabaseCorrect()
    .then(() => {
      console.log("✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falló:", error.message);
      process.exit(1);
    });
}

module.exports = { setupDatabaseCorrect };
