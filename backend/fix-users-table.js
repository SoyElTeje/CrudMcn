#!/usr/bin/env node

/**
 * Script para corregir la tabla users agregando password_hash
 */

// Cargar variables de entorno
require('dotenv').config();

const { getPool } = require("./db");

async function fixUsersTable() {
  try {
    console.log("🔧 Corrigiendo tabla users...");

    const pool = await getPool();

    // Verificar si la columna password_hash existe
    const checkColumn = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'
    `);

    if (checkColumn.recordset.length > 0) {
      console.log("✅ La columna password_hash ya existe");
    } else {
      console.log("➕ Agregando columna password_hash...");
      
      // Agregar columna password_hash
      await pool.request().query(`
        ALTER TABLE users 
        ADD password_hash NVARCHAR(255) NULL
      `);
      
      console.log("✅ Columna password_hash agregada");
      
      // Copiar datos de password a password_hash si existe
      const checkPasswordColumn = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
      `);
      
      if (checkPasswordColumn.recordset.length > 0) {
        console.log("📋 Copiando datos de password a password_hash...");
        await pool.request().query(`
          UPDATE users 
          SET password_hash = password 
          WHERE password_hash IS NULL
        `);
        console.log("✅ Datos copiados");
        
        // Eliminar columna password
        console.log("🗑️ Eliminando columna password...");
        await pool.request().query(`
          ALTER TABLE users 
          DROP COLUMN password
        `);
        console.log("✅ Columna password eliminada");
      }
      
      // Hacer password_hash NOT NULL
      console.log("🔒 Haciendo password_hash NOT NULL...");
      await pool.request().query(`
        ALTER TABLE users 
        ALTER COLUMN password_hash NVARCHAR(255) NOT NULL
      `);
      console.log("✅ password_hash configurado como NOT NULL");
    }

    // Verificar estructura final
    console.log("\n🔍 Verificando estructura final...");
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log("📋 Columnas de la tabla users:");
    columns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar si password_hash existe
    const hasPasswordHash = columns.recordset.some(col => col.COLUMN_NAME === 'password_hash');
    if (hasPasswordHash) {
      console.log("\n✅ Tabla users corregida exitosamente!");
      console.log("🚀 Ahora puedes reiniciar el servidor y debería funcionar correctamente!");
    } else {
      console.log("\n❌ Error: password_hash no se pudo agregar");
    }

  } catch (error) {
    console.error(`❌ Error corrigiendo tabla users: ${error.message}`);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixUsersTable()
    .then(() => {
      console.log("✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falló:", error.message);
      process.exit(1);
    });
}

module.exports = { fixUsersTable };
