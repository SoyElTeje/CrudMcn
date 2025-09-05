#!/usr/bin/env node

/**
 * Script para asignar permisos de bases de datos a usuarios
 * Uso: node scripts/assign-permissions.js <username> <database1,database2,...> [permissions]
 * 
 * Ejemplos:
 * node scripts/assign-permissions.js usuario1 "BD_ABM1,BI_Editor" "read,write"
 * node scripts/assign-permissions.js usuario2 "APPDATA" "read,write,create,delete"
 */

// Cargar variables de entorno
require('dotenv').config();

const { getPool } = require("../db");
const logger = require("../config/logger");

async function assignPermissions() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log("❌ Uso incorrecto del script");
      console.log("📋 Uso: node scripts/assign-permissions.js <username> <databases> [permissions]");
      console.log("");
      console.log("📝 Ejemplos:");
      console.log("  node scripts/assign-permissions.js usuario1 \"BD_ABM1,BI_Editor\" \"read,write\"");
      console.log("  node scripts/assign-permissions.js usuario2 \"APPDATA\" \"read,write,create,delete\"");
      console.log("");
      console.log("🔧 Permisos disponibles: read, write, create, delete");
      console.log("   - read: Solo lectura (por defecto)");
      console.log("   - write: Lectura y escritura");
      console.log("   - create: Lectura, escritura y creación");
      console.log("   - delete: Todos los permisos");
      process.exit(1);
    }

    const username = args[0];
    const databasesString = args[1];
    const permissionsString = args[2] || "read";

    // Parsear bases de datos
    const databases = databasesString.split(',').map(db => db.trim());
    
    // Parsear permisos
    const permissions = permissionsString.split(',').map(p => p.trim().toLowerCase());
    
    // Validar permisos
    const validPermissions = ['read', 'write', 'create', 'delete'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      console.log(`❌ Permisos inválidos: ${invalidPermissions.join(', ')}`);
      console.log(`✅ Permisos válidos: ${validPermissions.join(', ')}`);
      process.exit(1);
    }

    // Determinar permisos específicos
    const canRead = permissions.includes('read') || permissions.includes('write') || permissions.includes('create') || permissions.includes('delete');
    const canWrite = permissions.includes('write') || permissions.includes('create') || permissions.includes('delete');
    const canCreate = permissions.includes('create') || permissions.includes('delete');
    const canDelete = permissions.includes('delete');

    console.log("🔐 Asignando permisos de bases de datos...");
    console.log(`👤 Usuario: ${username}`);
    console.log(`🗄️ Bases de datos: ${databases.join(', ')}`);
    console.log(`🔑 Permisos: ${permissionsString}`);
    console.log(`   - Lectura: ${canRead ? '✅' : '❌'}`);
    console.log(`   - Escritura: ${canWrite ? '✅' : '❌'}`);
    console.log(`   - Creación: ${canCreate ? '✅' : '❌'}`);
    console.log(`   - Eliminación: ${canDelete ? '✅' : '❌'}`);
    console.log("");

    const pool = await getPool();

    // Verificar que el usuario existe
    const userQuery = "SELECT id, username FROM users WHERE username = @username";
    const userResult = await pool
      .request()
      .input("username", username)
      .query(userQuery);

    if (userResult.recordset.length === 0) {
      console.log(`❌ Usuario '${username}' no encontrado`);
      process.exit(1);
    }

    const user = userResult.recordset[0];
    console.log(`✅ Usuario encontrado: ID ${user.id}`);

    // Verificar que las bases de datos existen
    const dbCheckQuery = `
      SELECT name 
      FROM sys.databases 
      WHERE name IN (${databases.map(db => `'${db}'`).join(',')})
    `;
    const dbResult = await pool.request().query(dbCheckQuery);
    const existingDatabases = dbResult.recordset.map(row => row.name);
    
    const missingDatabases = databases.filter(db => !existingDatabases.includes(db));
    if (missingDatabases.length > 0) {
      console.log(`❌ Bases de datos no encontradas: ${missingDatabases.join(', ')}`);
      console.log(`✅ Bases de datos disponibles: ${existingDatabases.join(', ')}`);
      process.exit(1);
    }

    console.log(`✅ Todas las bases de datos existen`);

    // Asignar permisos para cada base de datos
    let assignedCount = 0;
    let updatedCount = 0;

    for (const databaseName of databases) {
      try {
        // Verificar si ya existen permisos para esta base de datos
        const existingQuery = `
          SELECT id FROM user_permissions 
          WHERE user_id = @userId AND database_name = @databaseName AND table_name IS NULL
        `;
        const existingResult = await pool
          .request()
          .input("userId", user.id)
          .input("databaseName", databaseName)
          .query(existingQuery);

        if (existingResult.recordset.length > 0) {
          // Actualizar permisos existentes
          const updateQuery = `
            UPDATE user_permissions 
            SET can_read = @canRead, 
                can_write = @canWrite, 
                can_create = @canCreate, 
                can_delete = @canDelete,
                updated_at = GETDATE()
            WHERE user_id = @userId AND database_name = @databaseName AND table_name IS NULL
          `;
          
          await pool
            .request()
            .input("userId", user.id)
            .input("databaseName", databaseName)
            .input("canRead", canRead)
            .input("canWrite", canWrite)
            .input("canCreate", canCreate)
            .input("canDelete", canDelete)
            .query(updateQuery);
          
          updatedCount++;
          console.log(`🔄 Permisos actualizados para ${databaseName}`);
        } else {
          // Crear nuevos permisos
          const insertQuery = `
            INSERT INTO user_permissions (
              user_id, database_name, table_name, 
              can_read, can_write, can_create, can_delete,
              created_at, updated_at
            ) VALUES (
              @userId, @databaseName, NULL,
              @canRead, @canWrite, @canCreate, @canDelete,
              GETDATE(), GETDATE()
            )
          `;
          
          await pool
            .request()
            .input("userId", user.id)
            .input("databaseName", databaseName)
            .input("canRead", canRead)
            .input("canWrite", canWrite)
            .input("canCreate", canCreate)
            .input("canDelete", canDelete)
            .query(insertQuery);
          
          assignedCount++;
          console.log(`✅ Permisos asignados para ${databaseName}`);
        }
      } catch (error) {
        console.log(`❌ Error procesando ${databaseName}: ${error.message}`);
      }
    }

    console.log("");
    console.log("🎉 Proceso completado!");
    console.log(`📊 Resumen:`);
    console.log(`   - Permisos nuevos asignados: ${assignedCount}`);
    console.log(`   - Permisos existentes actualizados: ${updatedCount}`);
    console.log(`   - Total bases de datos procesadas: ${databases.length}`);

    // Mostrar permisos finales del usuario
    console.log("");
    console.log("📋 Permisos actuales del usuario:");
    const finalQuery = `
      SELECT database_name, can_read, can_write, can_create, can_delete
      FROM user_permissions 
      WHERE user_id = @userId AND table_name IS NULL
      ORDER BY database_name
    `;
    const finalResult = await pool
      .request()
      .input("userId", user.id)
      .query(finalQuery);

    if (finalResult.recordset.length > 0) {
      finalResult.recordset.forEach(perm => {
        const permissions = [];
        if (perm.can_read) permissions.push('read');
        if (perm.can_write) permissions.push('write');
        if (perm.can_create) permissions.push('create');
        if (perm.can_delete) permissions.push('delete');
        
        console.log(`   - ${perm.database_name}: ${permissions.join(', ')}`);
      });
    } else {
      console.log("   - Sin permisos asignados");
    }

  } catch (error) {
    console.error(`❌ Error asignando permisos: ${error.message}`);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  assignPermissions()
    .then(() => {
      console.log("✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falló:", error.message);
      process.exit(1);
    });
}

module.exports = { assignPermissions };
