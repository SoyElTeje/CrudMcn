#!/usr/bin/env node

/**
 * Script completo para corregir la estructura de la base de datos
 * Elimina restricciones, tablas y las recrea con la estructura correcta
 */

// Cargar variables de entorno
require('dotenv').config();

const { getPool } = require("./db");
const logger = require("./config/logger");

async function fixDatabaseComplete() {
  try {
    console.log("🔧 Corrigiendo estructura de base de datos completamente...");

    const pool = await getPool();

    // Paso 1: Eliminar todas las restricciones de clave foránea
    console.log("🔓 Eliminando restricciones de clave foránea...");
    const dropConstraints = [
      `-- Eliminar restricciones de user_permissions
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_permissions_users')
      BEGIN
          ALTER TABLE user_permissions DROP CONSTRAINT FK_user_permissions_users;
          PRINT '✅ Restricción FK_user_permissions_users eliminada';
      END`,

      `-- Eliminar restricciones de activated_tables
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_activated_tables_created_by')
      BEGIN
          ALTER TABLE activated_tables DROP CONSTRAINT FK_activated_tables_created_by;
          PRINT '✅ Restricción FK_activated_tables_created_by eliminada';
      END`,

      `IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_activated_tables_updated_by')
      BEGIN
          ALTER TABLE activated_tables DROP CONSTRAINT FK_activated_tables_updated_by;
          PRINT '✅ Restricción FK_activated_tables_updated_by eliminada';
      END`,

      `-- Eliminar restricciones de audit_logs
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_audit_logs_users')
      BEGIN
          ALTER TABLE audit_logs DROP CONSTRAINT FK_audit_logs_users;
          PRINT '✅ Restricción FK_audit_logs_users eliminada';
      END`
    ];

    for (const command of dropConstraints) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.warn(`⚠️ Error eliminando restricción: ${error.message}`);
      }
    }

    // Paso 2: Eliminar todas las tablas
    console.log("\n🗑️ Eliminando todas las tablas...");
    const dropTables = [
      `IF EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
      BEGIN
          DROP TABLE audit_logs;
          PRINT '✅ Tabla audit_logs eliminada';
      END`,

      `IF EXISTS (SELECT * FROM sysobjects WHERE name='activated_tables' AND xtype='U')
      BEGIN
          DROP TABLE activated_tables;
          PRINT '✅ Tabla activated_tables eliminada';
      END`,

      `IF EXISTS (SELECT * FROM sysobjects WHERE name='user_permissions' AND xtype='U')
      BEGIN
          DROP TABLE user_permissions;
          PRINT '✅ Tabla user_permissions eliminada';
      END`,

      `IF EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      BEGIN
          DROP TABLE users;
          PRINT '✅ Tabla users eliminada';
      END`
    ];

    for (const command of dropTables) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.warn(`⚠️ Error eliminando tabla: ${error.message}`);
      }
    }

    // Paso 3: Crear tablas con estructura correcta
    console.log("\n🏗️ Creando tablas con estructura correcta...");
    const createCommands = [
      // Crear tabla de usuarios con password_hash
      `CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(100) UNIQUE NOT NULL,
          password_hash NVARCHAR(255) NOT NULL,
          is_admin BIT NOT NULL DEFAULT 0,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          active BIT DEFAULT 1
      );
      PRINT '✅ Tabla users creada con password_hash';`,

      // Crear tabla de permisos
      `CREATE TABLE user_permissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          database_name NVARCHAR(128) NOT NULL,
          table_name NVARCHAR(128) NULL,
          can_read BIT DEFAULT 1,
          can_write BIT DEFAULT 0,
          can_delete BIT DEFAULT 0,
          can_create BIT DEFAULT 0,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
      );
      PRINT '✅ Tabla user_permissions creada';`,

      // Crear tabla de tablas activadas
      `CREATE TABLE activated_tables (
          id INT IDENTITY(1,1) PRIMARY KEY,
          database_name NVARCHAR(128) NOT NULL,
          table_name NVARCHAR(128) NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          created_by INT NULL,
          updated_by INT NULL,
          description NVARCHAR(500) NULL
      );
      PRINT '✅ Tabla activated_tables creada';`,

      // Crear tabla de logs de auditoría
      `CREATE TABLE audit_logs (
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
          timestamp DATETIME2 DEFAULT GETDATE()
      );
      PRINT '✅ Tabla audit_logs creada';`
    ];

    for (const command of createCommands) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.error(`❌ Error creando tabla: ${error.message}`);
        throw error;
      }
    }

    // Paso 4: Agregar restricciones de clave foránea
    console.log("\n🔗 Agregando restricciones de clave foránea...");
    const addConstraints = [
      `ALTER TABLE user_permissions 
      ADD CONSTRAINT FK_user_permissions_users 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      PRINT '✅ Restricción FK_user_permissions_users agregada';`,

      `ALTER TABLE activated_tables 
      ADD CONSTRAINT FK_activated_tables_created_by 
      FOREIGN KEY (created_by) REFERENCES users(id);
      PRINT '✅ Restricción FK_activated_tables_created_by agregada';`,

      `ALTER TABLE activated_tables 
      ADD CONSTRAINT FK_activated_tables_updated_by 
      FOREIGN KEY (updated_by) REFERENCES users(id);
      PRINT '✅ Restricción FK_activated_tables_updated_by agregada';`,

      `ALTER TABLE audit_logs 
      ADD CONSTRAINT FK_audit_logs_users 
      FOREIGN KEY (user_id) REFERENCES users(id);
      PRINT '✅ Restricción FK_audit_logs_users agregada';`
    ];

    for (const command of addConstraints) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.warn(`⚠️ Error agregando restricción: ${error.message}`);
      }
    }

    // Paso 5: Crear índices
    console.log("\n📊 Creando índices...");
    const indexCommands = [
      `CREATE INDEX IX_users_username ON users(username);
      PRINT '✅ Índice IX_users_username creado';`,

      `CREATE INDEX IX_user_permissions_user_db ON user_permissions(user_id, database_name);
      PRINT '✅ Índice IX_user_permissions_user_db creado';`,

      `CREATE INDEX IX_activated_tables_db_table ON activated_tables(database_name, table_name);
      PRINT '✅ Índice IX_activated_tables_db_table creado';`,

      `CREATE INDEX IX_audit_logs_timestamp ON audit_logs(timestamp);
      PRINT '✅ Índice IX_audit_logs_timestamp creado';`
    ];

    for (const command of indexCommands) {
      try {
        await pool.request().query(command);
      } catch (error) {
        console.warn(`⚠️ Error creando índice: ${error.message}`);
      }
    }

    // Paso 6: Verificar estructura final
    console.log("\n🔍 Verificando estructura final...");
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
          
          // Mostrar columnas de la tabla users
          if (table === 'users') {
            const columns = await pool.request().query(`
              SELECT COLUMN_NAME, DATA_TYPE 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'users'
              ORDER BY ORDINAL_POSITION
            `);
            console.log(`   Columnas: ${columns.recordset.map(c => c.COLUMN_NAME).join(', ')}`);
          }
        } else {
          console.log(`❌ Tabla ${table} no encontrada`);
        }
      } catch (error) {
        console.log(`❌ Error verificando tabla ${table}: ${error.message}`);
      }
    }

    console.log("\n🎉 Estructura de base de datos corregida completamente!");
    console.log("\n📋 Tablas recreadas:");
    console.log("  - users (con password_hash)");
    console.log("  - user_permissions (con restricciones)");
    console.log("  - activated_tables (con restricciones)");
    console.log("  - audit_logs (con restricciones)");
    
    console.log("\n🚀 Ahora puedes reiniciar el servidor y debería funcionar perfectamente!");

  } catch (error) {
    console.error(`❌ Error corrigiendo estructura: ${error.message}`);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixDatabaseComplete()
    .then(() => {
      console.log("✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falló:", error.message);
      process.exit(1);
    });
}

module.exports = { fixDatabaseComplete };
