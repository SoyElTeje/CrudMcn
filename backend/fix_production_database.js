const sql = require("mssql");
require("dotenv").config();

async function fixProductionDatabase() {
  try {
    const config = {
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
      },
    };

    console.log("🔗 Conectando a la base de datos de producción...");
    const pool = await sql.connect(config);
    console.log("✅ Conectado correctamente");

    // Verificar estructura de la tabla users
    console.log("\n🔍 Verificando estructura de la tabla users...");
    const usersStructure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("📋 Estructura actual de la tabla users:");
    usersStructure.recordset.forEach((col) => {
      console.log(
        `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${
          col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
        })`
      );
    });

    // Verificar si existe la columna can_write
    const hasCanWrite = usersStructure.recordset.some(
      (col) => col.COLUMN_NAME === "can_write"
    );

    if (!hasCanWrite) {
      console.log("\n⚠️  La columna can_write no existe. Agregándola...");
      await pool.request().query(`
        ALTER TABLE users 
        ADD can_write BIT DEFAULT 1
      `);
      console.log("✅ Columna can_write agregada");
    } else {
      console.log("✅ La columna can_write ya existe");
    }

    // Verificar estructura de la tabla user_permissions
    console.log("\n🔍 Verificando estructura de la tabla user_permissions...");
    try {
      const permissionsStructure = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'user_permissions'
        ORDER BY ORDINAL_POSITION
      `);

      console.log("📋 Estructura actual de la tabla user_permissions:");
      permissionsStructure.recordset.forEach((col) => {
        console.log(
          `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${
            col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });
    } catch (error) {
      console.log("⚠️  La tabla user_permissions no existe. Creándola...");
      await pool.request().query(`
        CREATE TABLE user_permissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          database_name NVARCHAR(255) NOT NULL,
          table_name NVARCHAR(255) NOT NULL,
          can_read BIT DEFAULT 1,
          can_write BIT DEFAULT 1,
          can_delete BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      console.log("✅ Tabla user_permissions creada");
    }

    // Verificar usuario admin
    console.log("\n🔍 Verificando usuario admin...");
    const adminUser = await pool.request().query(`
      SELECT id, username, isAdmin, can_write 
      FROM users 
      WHERE username = 'admin'
    `);

    if (adminUser.recordset.length === 0) {
      console.log("⚠️  Usuario admin no existe. Creándolo...");
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("admin", 10);

      await pool.request().query(
        `
        INSERT INTO users (username, password_hash, isAdmin, can_write)
        VALUES ('admin', @password, 1, 1)
      `,
        {
          password: hashedPassword,
        }
      );
      console.log("✅ Usuario admin creado");
    } else {
      console.log("✅ Usuario admin existe:", adminUser.recordset[0]);
    }

    await pool.close();
    console.log("\n🎉 Base de datos de producción configurada correctamente");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("🔍 Detalles:", error);
  }
}

fixProductionDatabase();
