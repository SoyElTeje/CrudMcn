const { getPool } = require("./db");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  try {
    console.log("🔧 Configurando base de datos...");

    const pool = await getPool();

    // Comandos SQL para crear las tablas
    const commands = [
      // Crear tabla de usuarios
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USERS_TABLE' AND xtype='U')
      BEGIN
          CREATE TABLE USERS_TABLE (
              Id INT IDENTITY(1,1) PRIMARY KEY,
              NombreUsuario NVARCHAR(100) UNIQUE NOT NULL,
              Contrasena NVARCHAR(255) NOT NULL,
              EsAdmin BIT NOT NULL DEFAULT 0,
              FechaCreacion DATETIME2 DEFAULT GETDATE(),
              UltimoAcceso DATETIME2 NULL,
              Activo BIT DEFAULT 1
          );
      END`,

      // Crear tabla de permisos de base de datos
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USER_DATABASE_PERMISSIONS' AND xtype='U')
      BEGIN
          CREATE TABLE USER_DATABASE_PERMISSIONS (
              Id INT IDENTITY(1,1) PRIMARY KEY,
              UserId INT NOT NULL,
              DatabaseName NVARCHAR(128) NOT NULL,
              CanRead BIT DEFAULT 1,
              CanWrite BIT DEFAULT 0,
              CanDelete BIT DEFAULT 0,
              CanCreate BIT DEFAULT 0,
              FechaAsignacion DATETIME2 DEFAULT GETDATE(),
              UNIQUE(UserId, DatabaseName)
          );
      END`,

      // Crear tabla de permisos de tabla
      `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USER_TABLE_PERMISSIONS' AND xtype='U')
      BEGIN
          CREATE TABLE USER_TABLE_PERMISSIONS (
              Id INT IDENTITY(1,1) PRIMARY KEY,
              UserId INT NOT NULL,
              DatabaseName NVARCHAR(128) NOT NULL,
              TableName NVARCHAR(128) NOT NULL,
              CanRead BIT DEFAULT 1,
              CanWrite BIT DEFAULT 0,
              CanDelete BIT DEFAULT 0,
              CanCreate BIT DEFAULT 0,
              FechaAsignacion DATETIME2 DEFAULT GETDATE(),
              UNIQUE(UserId, DatabaseName, TableName)
          );
      END`,
    ];

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        await pool.request().query(command);
        console.log(`✅ Tabla ${i + 1} creada/verificada`);
      } catch (error) {
        console.log(`⚠️  Error en tabla ${i + 1}:`, error.message);
      }
    }

    console.log("✅ Base de datos configurada exitosamente");

    // Verificar que las tablas se crearon
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('USERS_TABLE', 'USER_DATABASE_PERMISSIONS', 'USER_TABLE_PERMISSIONS')
    `);

    console.log(
      "📋 Tablas creadas:",
      tablesResult.recordset.map((row) => row.TABLE_NAME)
    );
  } catch (error) {
    console.error("❌ Error configurando base de datos:", error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();
