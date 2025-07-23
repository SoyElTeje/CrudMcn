const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

async function initializePermissions() {
  try {
    console.log("🔧 Inicializando sistema de permisos...");

    const pool = await sql.connect(config);

    // Tabla de permisos de bases de datos
    const createDbPermissionsTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PermisosBasesDatos' AND xtype='U')
      CREATE TABLE PermisosBasesDatos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DatabaseName NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES ${process.env.USERS_TABLE}(Id) ON DELETE CASCADE
      )
    `;

    await pool.request().query(createDbPermissionsTable);
    console.log("✅ Tabla PermisosBasesDatos creada/verificada");

    // Tabla de permisos de tablas
    const createTablePermissionsTable = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PermisosTablas' AND xtype='U')
      CREATE TABLE PermisosTablas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DatabaseName NVARCHAR(100) NOT NULL,
        TableName NVARCHAR(100) NOT NULL,
        SchemaName NVARCHAR(100) DEFAULT 'dbo',
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (UserId) REFERENCES ${process.env.USERS_TABLE}(Id) ON DELETE CASCADE
      )
    `;

    await pool.request().query(createTablePermissionsTable);
    console.log("✅ Tabla PermisosTablas creada/verificada");

    // Índices para mejorar rendimiento
    const createIndexes = `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PermisosBasesDatos_UserId')
      CREATE INDEX IX_PermisosBasesDatos_UserId ON PermisosBasesDatos(UserId);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PermisosTablas_UserId')
      CREATE INDEX IX_PermisosTablas_UserId ON PermisosTablas(UserId);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PermisosTablas_DatabaseTable')
      CREATE INDEX IX_PermisosTablas_DatabaseTable ON PermisosTablas(DatabaseName, TableName);
    `;

    await pool.request().query(createIndexes);
    console.log("✅ Índices creados/verificados");

    await pool.close();
    console.log("🎉 Sistema de permisos inicializado correctamente");
  } catch (error) {
    console.error("❌ Error inicializando permisos:", error);
    // No salir del proceso, solo loggear el error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializePermissions();
}

module.exports = { initializePermissions };
