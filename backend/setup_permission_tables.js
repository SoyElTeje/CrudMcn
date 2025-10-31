require("dotenv").config();
const sql = require("mssql");

async function setupPermissionTables() {
  try {
    console.log("🔧 Creando tablas de permisos...");

    // Configuración de conexión desde variables de entorno
    const config = {
      server: process.env.DB_SERVER || "MCN-BIDB-SVR",
      database: "APPDATA",
      user: process.env.DB_USER || "app_user",
      password: process.env.DB_PASSWORD || "App_User_2024!",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };

    console.log(`🔌 Conectando a ${config.server}...`);
    const pool = await sql.connect(config);

    // SQL para crear las tablas de permisos
    const createTablesSQL = `
      -- Crear tabla de permisos de usuarios sobre bases de datos
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USER_DATABASE_PERMISSIONS' AND xtype='U')
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
          PRINT '✅ Tabla USER_DATABASE_PERMISSIONS creada exitosamente.';
      END
      ELSE
      BEGIN
          PRINT 'ℹ️ Tabla USER_DATABASE_PERMISSIONS ya existe.';
      END

      -- Crear tabla de permisos de usuarios sobre tablas específicas
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USER_TABLE_PERMISSIONS' AND xtype='U')
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
          PRINT '✅ Tabla USER_TABLE_PERMISSIONS creada exitosamente.';
      END
      ELSE
      BEGIN
          PRINT 'ℹ️ Tabla USER_TABLE_PERMISSIONS ya existe.';
      END

      -- Crear índices para mejorar el rendimiento
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_DATABASE_PERMISSIONS_UserId')
      BEGIN
          CREATE INDEX IX_USER_DATABASE_PERMISSIONS_UserId ON USER_DATABASE_PERMISSIONS(UserId);
          PRINT '✅ Índice IX_USER_DATABASE_PERMISSIONS_UserId creado.';
      END

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_TABLE_PERMISSIONS_UserId')
      BEGIN
          CREATE INDEX IX_USER_TABLE_PERMISSIONS_UserId ON USER_TABLE_PERMISSIONS(UserId);
          PRINT '✅ Índice IX_USER_TABLE_PERMISSIONS_UserId creado.';
      END

      -- Asignar permisos totales al usuario admin (ID = 1) para las bases de datos permitidas
      -- APPDATA
      IF NOT EXISTS (SELECT * FROM USER_DATABASE_PERMISSIONS WHERE UserId = 1 AND DatabaseName = 'APPDATA')
      BEGIN
          INSERT INTO USER_DATABASE_PERMISSIONS (UserId, DatabaseName, CanRead, CanWrite, CanDelete, CanCreate)
          VALUES (1, 'APPDATA', 1, 1, 1, 1);
          PRINT '✅ Permisos de APPDATA asignados al admin.';
      END

      -- BI_Editor
      IF NOT EXISTS (SELECT * FROM USER_DATABASE_PERMISSIONS WHERE UserId = 1 AND DatabaseName = 'BI_Editor')
      BEGIN
          INSERT INTO USER_DATABASE_PERMISSIONS (UserId, DatabaseName, CanRead, CanWrite, CanDelete, CanCreate)
          VALUES (1, 'BI_Editor', 1, 1, 1, 1);
          PRINT '✅ Permisos de BI_Editor asignados al admin.';
      END

      PRINT '🎉 Sistema de permisos configurado exitosamente.';
    `;

    await pool.request().query(createTablesSQL);

    console.log("✅ Tablas de permisos creadas/verificadas exitosamente");

    // Verificar que las tablas existen
    const checkTablesSQL = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('USER_DATABASE_PERMISSIONS', 'USER_TABLE_PERMISSIONS')
    `;

    const result = await pool.request().query(checkTablesSQL);

    console.log("📋 Tablas de permisos verificadas:");
    result.recordset.forEach((row) => {
      console.log(`   ✅ ${row.TABLE_NAME}`);
    });

    // Verificar permisos del admin
    const checkPermissionsSQL = `
      SELECT DatabaseName, CanRead, CanWrite, CanDelete, CanCreate
      FROM USER_DATABASE_PERMISSIONS 
      WHERE UserId = 1
    `;

    const permissionsResult = await pool.request().query(checkPermissionsSQL);

    console.log("👤 Permisos del admin:");
    permissionsResult.recordset.forEach((row) => {
      console.log(
        `   📊 ${row.DatabaseName}: Read=${row.CanRead}, Write=${row.CanWrite}, Delete=${row.CanDelete}, Create=${row.CanCreate}`
      );
    });

    await pool.close();
  } catch (error) {
    console.error("❌ Error creando tablas de permisos:", error);
  } finally {
    process.exit(0);
  }
}

setupPermissionTables();
























