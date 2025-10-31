/**
 * Script para crear usuarios basado en la estructura real de la tabla users
 * Estructura: id, username, password_hash, is_admin, created_at, updated_at, active
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

async function createUser(userData) {
  let pool;

  try {
    console.log("🔗 Conectando a la base de datos...");
    pool = await sql.connect(config);
    console.log("✅ Conectado exitosamente");

    // Validar datos del usuario
    if (!userData.username || !userData.password) {
      throw new Error("Username y password son requeridos");
    }

    // Verificar si el usuario ya existe
    console.log(`👤 Verificando si el usuario '${userData.username}' ya existe...`);
    const userCheck = await pool.request()
      .input("username", userData.username)
      .query(`
        SELECT id FROM users WHERE username = @username
      `);

    if (userCheck.recordset.length > 0) {
      console.log(`⚠️ El usuario '${userData.username}' ya existe`);
      
      if (userData.updateIfExists) {
        console.log("🔄 Actualizando usuario existente...");
        
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await pool.request()
          .input("username", userData.username)
          .input("password", hashedPassword)
          .input("isAdmin", userData.is_admin || false)
          .input("active", userData.active !== undefined ? userData.active : true)
          .query(`
            UPDATE users 
            SET password_hash = @password, 
                is_admin = @isAdmin, 
                active = @active,
                updated_at = GETDATE()
            WHERE username = @username
          `);
        
        console.log(`✅ Usuario '${userData.username}' actualizado exitosamente`);
      } else {
        throw new Error(`El usuario '${userData.username}' ya existe. Use updateIfExists: true para actualizarlo.`);
      }
    } else {
      console.log(`👤 Creando nuevo usuario '${userData.username}'...`);
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await pool.request()
        .input("username", userData.username)
        .input("password", hashedPassword)
        .input("isAdmin", userData.is_admin || false)
        .input("active", userData.active !== undefined ? userData.active : true)
        .query(`
          INSERT INTO users (username, password_hash, is_admin, active, created_at, updated_at)
          VALUES (@username, @password, @isAdmin, @active, GETDATE(), GETDATE())
        `);
      
      console.log(`✅ Usuario '${userData.username}' creado exitosamente`);
    }

    // Obtener información del usuario creado/actualizado
    const userResult = await pool.request()
      .input("username", userData.username)
      .query(`
        SELECT id, username, is_admin, active, created_at, updated_at 
        FROM users WHERE username = @username
      `);

    const user = userResult.recordset[0];

    // Configurar permisos si se especifican
    if (userData.databases && userData.databases.length > 0) {
      console.log("🔐 Configurando permisos del usuario...");
      
      for (const dbName of userData.databases) {
        // Verificar si el permiso ya existe
        const permCheck = await pool.request()
          .input("userId", user.id)
          .input("dbName", dbName)
          .query(`
            SELECT id FROM user_permissions 
            WHERE user_id = @userId AND database_name = @dbName
          `);

        if (permCheck.recordset.length === 0) {
          await pool.request()
            .input("userId", user.id)
            .input("dbName", dbName)
            .input("canRead", userData.permissions?.can_read || true)
            .input("canWrite", userData.permissions?.can_write || false)
            .input("canDelete", userData.permissions?.can_delete || false)
            .input("canExport", userData.permissions?.can_export || false)
            .query(`
              INSERT INTO user_permissions (user_id, database_name, can_read, can_write, can_delete, can_export)
              VALUES (@userId, @dbName, @canRead, @canWrite, @canDelete, @canExport)
            `);
          
          console.log(`✅ Permisos configurados para base de datos: ${dbName}`);
        } else {
          console.log(`⚠️ Permisos ya existen para base de datos: ${dbName}`);
        }
      }
    }

    // Mostrar resumen
    console.log("\n🎉 USUARIO CONFIGURADO EXITOSAMENTE");
    console.log("===================================");
    console.log(`👤 Usuario: ${user.username}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🔑 Contraseña: ${userData.password}`);
    console.log(`👑 Es Admin: ${user.is_admin ? 'Sí' : 'No'}`);
    console.log(`✅ Activo: ${user.active ? 'Sí' : 'No'}`);
    console.log(`📅 Creado: ${user.created_at}`);
    console.log(`🔄 Actualizado: ${user.updated_at}`);
    
    if (userData.databases && userData.databases.length > 0) {
      console.log("\n🔐 Bases de datos con permisos:");
      userData.databases.forEach(db => console.log(`   ✅ ${db}`));
    }

    return user;

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Función para crear usuario admin
async function createAdminUser() {
  const adminData = {
    username: "admin",
    password: "Admin123!",
    is_admin: true,
    active: true,
    updateIfExists: true,
    databases: ["APPDATA", "BD_ABM1", "BD_ABM2", "BI_EDITOR"],
    permissions: {
      can_read: true,
      can_write: true,
      can_delete: true,
      can_export: true
    }
  };

  return await createUser(adminData);
}

// Función para crear usuario regular
async function createRegularUser(username, password, databases = []) {
  const userData = {
    username,
    password,
    is_admin: false,
    active: true,
    updateIfExists: false,
    databases,
    permissions: {
      can_read: true,
      can_write: false,
      can_delete: false,
      can_export: false
    }
  };

  return await createUser(userData);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("📋 Uso del script:");
    console.log("  node create-user.js admin                    # Crear usuario admin");
    console.log("  node create-user.js user <username> <password> [databases...]  # Crear usuario regular");
    console.log("\nEjemplos:");
    console.log("  node create-user.js admin");
    console.log("  node create-user.js user juan Secret123 BD_ABM1 BD_ABM2");
    process.exit(1);
  }

  const command = args[0];

  if (command === "admin") {
    createAdminUser()
      .then(() => {
        console.log("\n✅ Script completado");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
      });
  } else if (command === "user") {
    if (args.length < 3) {
      console.error("❌ Error: Se requieren username y password");
      console.log("Uso: node create-user.js user <username> <password> [databases...]");
      process.exit(1);
    }

    const username = args[1];
    const password = args[2];
    const databases = args.slice(3);

    createRegularUser(username, password, databases)
      .then(() => {
        console.log("\n✅ Script completado");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
      });
  } else {
    console.error("❌ Comando no reconocido. Use 'admin' o 'user'");
    process.exit(1);
  }
}

module.exports = { createUser, createAdminUser, createRegularUser };
















