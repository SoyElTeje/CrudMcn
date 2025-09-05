#!/usr/bin/env node

/**
 * Script para listar usuarios y sus permisos
 * Uso: node scripts/list-user-permissions.js [username]
 * 
 * Ejemplos:
 * node scripts/list-user-permissions.js                    # Listar todos los usuarios
 * node scripts/list-user-permissions.js usuario1           # Listar permisos de un usuario específico
 */

// Cargar variables de entorno
require('dotenv').config();

const { getPool } = require("../db");

async function listUserPermissions() {
  try {
    const args = process.argv.slice(2);
    const targetUsername = args[0] || null;

    console.log("👥 Listando usuarios y permisos...");
    if (targetUsername) {
      console.log(`🎯 Usuario específico: ${targetUsername}`);
    } else {
      console.log("📋 Todos los usuarios");
    }
    console.log("");

    const pool = await getPool();

    // Obtener usuarios
    let userQuery = `
      SELECT id, username, is_admin, created_at, active
      FROM users
      ORDER BY username
    `;
    let userParams = {};

    if (targetUsername) {
      userQuery = `
        SELECT id, username, is_admin, created_at, active
        FROM users
        WHERE username = @username
        ORDER BY username
      `;
      userParams = { username: targetUsername };
    }

    const userResult = await pool
      .request()
      .input("username", userParams.username || null)
      .query(userQuery);

    if (userResult.recordset.length === 0) {
      if (targetUsername) {
        console.log(`❌ Usuario '${targetUsername}' no encontrado`);
      } else {
        console.log("❌ No hay usuarios en el sistema");
      }
      return;
    }

    // Procesar cada usuario
    for (const user of userResult.recordset) {
      console.log(`👤 Usuario: ${user.username}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Admin: ${user.is_admin ? '✅ Sí' : '❌ No'}`);
      console.log(`   Activo: ${user.active ? '✅ Sí' : '❌ No'}`);
      console.log(`   Creado: ${user.created_at}`);

      // Obtener permisos del usuario
      const permissionsQuery = `
        SELECT 
          database_name,
          table_name,
          can_read,
          can_write,
          can_create,
          can_delete,
          created_at
        FROM user_permissions 
        WHERE user_id = @userId
        ORDER BY database_name, table_name
      `;

      const permissionsResult = await pool
        .request()
        .input("userId", user.id)
        .query(permissionsQuery);

      if (permissionsResult.recordset.length > 0) {
        console.log(`   🔐 Permisos:`);
        
        // Agrupar por base de datos
        const permissionsByDb = {};
        permissionsResult.recordset.forEach(perm => {
          if (!permissionsByDb[perm.database_name]) {
            permissionsByDb[perm.database_name] = [];
          }
          permissionsByDb[perm.database_name].push(perm);
        });

        Object.keys(permissionsByDb).forEach(dbName => {
          const dbPermissions = permissionsByDb[dbName];
          
          // Verificar si hay permisos de base de datos (table_name IS NULL)
          const dbLevelPerm = dbPermissions.find(p => p.table_name === null);
          
          if (dbLevelPerm) {
            const permissions = [];
            if (dbLevelPerm.can_read) permissions.push('read');
            if (dbLevelPerm.can_write) permissions.push('write');
            if (dbLevelPerm.can_create) permissions.push('create');
            if (dbLevelPerm.can_delete) permissions.push('delete');
            
            console.log(`      🗄️ ${dbName}: ${permissions.join(', ')} (nivel BD)`);
          }

          // Mostrar permisos de tabla específica
          const tablePermissions = dbPermissions.filter(p => p.table_name !== null);
          if (tablePermissions.length > 0) {
            tablePermissions.forEach(tablePerm => {
              const permissions = [];
              if (tablePerm.can_read) permissions.push('read');
              if (tablePerm.can_write) permissions.push('write');
              if (tablePerm.can_create) permissions.push('create');
              if (tablePerm.can_delete) permissions.push('delete');
              
              console.log(`         📋 ${tablePerm.table_name}: ${permissions.join(', ')}`);
            });
          }
        });
      } else {
        console.log(`   🔐 Sin permisos asignados`);
      }

      console.log("");
    }

    // Mostrar resumen
    console.log("📊 Resumen:");
    console.log(`   - Total usuarios: ${userResult.recordset.length}`);
    console.log(`   - Usuarios admin: ${userResult.recordset.filter(u => u.is_admin).length}`);
    console.log(`   - Usuarios activos: ${userResult.recordset.filter(u => u.active).length}`);

  } catch (error) {
    console.error(`❌ Error listando permisos: ${error.message}`);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  listUserPermissions()
    .then(() => {
      console.log("✅ Script completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falló:", error.message);
      process.exit(1);
    });
}

module.exports = { listUserPermissions };
