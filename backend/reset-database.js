#!/usr/bin/env node

/**
 * Script para resetear completamente la base de datos
 * Elimina todo y recrea con la estructura correcta
 */

// Cargar variables de entorno
require('dotenv').config();

const { getPool } = require("./db");

async function resetDatabase() {
  try {
    console.log("🔄 Reseteando base de datos completamente...");

    const pool = await getPool();

    // SQL para eliminar todo y recrear
    const resetSQL = `
    -- Eliminar todas las restricciones y tablas
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_permissions_users')
        ALTER TABLE user_permissions DROP CONSTRAINT FK_user_permissions_users;
    
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_activated_tables_created_by')
        ALTER TABLE activated_tables DROP CONSTRAINT FK_activated_tables_created_by;
    
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_activated_tables_updated_by')
        ALTER TABLE activated_tables DROP CONSTRAINT FK_activated_tables_updated_by;
    
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_audit_logs_users')
        ALTER TABLE audit_logs DROP CONSTRAINT FK_audit_logs_users;
    
    -- Eliminar tablas
    IF EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
        DROP TABLE audit_logs;
    
    IF EXISTS (SELECT * FROM sysobjects WHERE name='activated_tables' AND xtype='U')
        DROP TABLE activated_tables;
    
    IF EXISTS (SELECT * FROM sysobjects WHERE name='user_permissions' AND xtype='U')
        DROP TABLE user_permissions;
    
    IF EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
        DROP TABLE users;
    
    -- Crear tabla users con password_hash
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        is_admin BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        active BIT DEFAULT 1
    );
    
    -- Crear tabla user_permissions
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
    
    -- Crear tabla activated_tables
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
    
    -- Crear tabla audit_logs
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
    
    -- Crear índices
    CREATE INDEX IX_users_username ON users(username);
    CREATE INDEX IX_user_permissions_user_db ON user_permissions(user_id, database_name);
    CREATE INDEX IX_activated_tables_db_table ON activated_tables(database_name, table_name);
    CREATE INDEX IX_audit_logs_timestamp ON audit_logs(timestamp);
    
    PRINT '✅ Base de datos reseteada completamente';
    `;

    console.log("🗑️ Eliminando tablas existentes...");
    console.log("🏗️ Creando tablas con estructura correcta...");
    console.log("📊 Creando índices...");

    await pool.request().query(resetSQL);

    // Verificar estructura
    console.log("\n🔍 Verificando estructura...");
    const tables = ['users', 'user_permissions', 'activated_tables', 'audit_logs'];
    
    for (const table of tables) {
      const result = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = '${table}'
      `);
      
      if (result.recordset[0].count > 0) {
        console.log(`✅ Tabla ${table} verificada`);
        
        if (table === 'users') {
          const columns = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
          `);
          const columnNames = columns.recordset.map(c => c.COLUMN_NAME);
          console.log(`   Columnas: ${columnNames.join(', ')}`);
          
          if (columnNames.includes('password_hash')) {
            console.log(`✅ Columna password_hash encontrada`);
          } else {
            console.log(`❌ Columna password_hash NO encontrada`);
          }
        }
      } else {
        console.log(`❌ Tabla ${table} no encontrada`);
      }
    }

    console.log("\n🎉 Base de datos reseteada exitosamente!");
    console.log("\n📋 Estructura creada:");
    console.log("  - users (con password_hash)");
    console.log("  - user_permissions");
    console.log("  - activated_tables");
    console.log("  - audit_logs");
    
    console.log("\n🚀 Ahora reinicia el servidor y debería funcionar perfectamente!");

  } catch (error) {
    console.error(`❌ Error reseteando base de datos: ${error.message}`);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log("✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falló:", error.message);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
