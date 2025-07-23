const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "simpleDev!",
  database: process.env.DB_DATABASE || "APPDATA",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function setupAuthSystem() {
  let pool;

  try {
    console.log("🔧 Inicializando sistema de autenticación...");
    console.log(`📊 Conectando a la base de datos: ${config.database}`);

    // Conectar a la base de datos
    pool = await sql.connect(config);
    console.log("✅ Conexión exitosa a la base de datos");

    // Ejecutar script SQL para crear tablas
    console.log("📋 Creando tablas de usuarios y permisos...");

    const setupSQL = `
        -- Crear tabla de usuarios
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USERS_TABLE' AND xtype='U')
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
            PRINT 'Tabla USERS_TABLE creada exitosamente.';
        END
        ELSE
        BEGIN
            PRINT 'Tabla USERS_TABLE ya existe.';
        END

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
                FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
                UNIQUE(UserId, DatabaseName)
            );
            PRINT 'Tabla USER_DATABASE_PERMISSIONS creada exitosamente.';
        END
        ELSE
        BEGIN
            PRINT 'Tabla USER_DATABASE_PERMISSIONS ya existe.';
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
                FOREIGN KEY (UserId) REFERENCES USERS_TABLE(Id) ON DELETE CASCADE,
                UNIQUE(UserId, DatabaseName, TableName)
            );
            PRINT 'Tabla USER_TABLE_PERMISSIONS creada exitosamente.';
        END
        ELSE
        BEGIN
            PRINT 'Tabla USER_TABLE_PERMISSIONS ya existe.';
        END

        -- Crear índices para mejorar el rendimiento
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USERS_TABLE_NombreUsuario')
        BEGIN
            CREATE INDEX IX_USERS_TABLE_NombreUsuario ON USERS_TABLE(NombreUsuario);
            PRINT 'Índice IX_USERS_TABLE_NombreUsuario creado.';
        END

        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_DATABASE_PERMISSIONS_UserId')
        BEGIN
            CREATE INDEX IX_USER_DATABASE_PERMISSIONS_UserId ON USER_DATABASE_PERMISSIONS(UserId);
            PRINT 'Índice IX_USER_DATABASE_PERMISSIONS_UserId creado.';
        END

        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USER_TABLE_PERMISSIONS_UserId')
        BEGIN
            CREATE INDEX IX_USER_TABLE_PERMISSIONS_UserId ON USER_TABLE_PERMISSIONS(UserId);
            PRINT 'Índice IX_USER_TABLE_PERMISSIONS_UserId creado.';
        END
        `;

    await pool.request().query(setupSQL);
    console.log("✅ Tablas de usuarios y permisos creadas/verificadas");

    // Verificar si ya existe un usuario administrador
    console.log("🔍 Verificando si existe un usuario administrador...");
    const adminCheck = await pool
      .request()
      .query("SELECT TOP 1 Id FROM USERS_TABLE WHERE EsAdmin = 1");

    if (adminCheck.recordset.length > 0) {
      console.log("⚠️  Ya existe un usuario administrador en el sistema");
      console.log(
        "💡 Para crear un nuevo usuario admin, usa la API: POST /api/auth/users"
      );
    } else {
      console.log(
        "👤 No se encontró usuario administrador, creando uno inicial..."
      );

      // Importar bcrypt para hash de contraseña
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("admin", 12);

      const createAdminSQL = `
                INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin, FechaCreacion, Activo)
                VALUES ('admin', @password, 1, GETDATE(), 1);
                SELECT SCOPE_IDENTITY() as Id;
            `;

      const result = await pool
        .request()
        .input("password", hashedPassword)
        .query(createAdminSQL);

      const adminId = result.recordset[0].Id;
      console.log(
        `✅ Usuario administrador creado exitosamente con ID: ${adminId}`
      );
      console.log("🔑 Credenciales del administrador:");
      console.log("   Usuario: admin");
      console.log("   Contraseña: admin");
      console.log(
        "⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión"
      );
    }

    console.log("\n🎉 Sistema de autenticación inicializado correctamente!");
    console.log("\n📋 Próximos pasos:");
    console.log("1. Inicia el servidor: npm start");
    console.log(
      "2. Accede al frontend y inicia sesión con las credenciales de admin"
    );
    console.log(
      "3. Usa la interfaz para crear usuarios adicionales y asignar permisos"
    );
    console.log("4. Cambia la contraseña del administrador por seguridad");
  } catch (error) {
    console.error("❌ Error durante la inicialización:", error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log("🔌 Conexión cerrada");
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupAuthSystem();
}

module.exports = { setupAuthSystem };
