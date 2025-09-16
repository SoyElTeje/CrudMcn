const { getPool } = require("./db");

async function createTableConditions() {
  try {
    console.log("=== Creando tabla TABLE_CONDITIONS ===\n");

    const pool = await getPool();
    console.log("✅ Conectado a la base de datos");

    // Verificar si la tabla existe
    const tableExistsQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'TABLE_CONDITIONS'
    `;

    const tableExistsResult = await pool.request().query(tableExistsQuery);
    const tableExists = tableExistsResult.recordset[0].count > 0;

    if (tableExists) {
      console.log("✅ La tabla TABLE_CONDITIONS ya existe");
      return;
    }

    console.log("📋 Creando tabla TABLE_CONDITIONS...");

    // Crear la tabla TABLE_CONDITIONS
    const createTableQuery = `
      CREATE TABLE TABLE_CONDITIONS (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ActivatedTableId INT NOT NULL,
        ColumnName NVARCHAR(128) NOT NULL,
        DataType NVARCHAR(50) NOT NULL,
        ConditionType NVARCHAR(50) NOT NULL,
        ConditionValue NVARCHAR(MAX),
        IsRequired BIT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CreatedBy INT,
        UpdatedBy INT
      )
    `;

    await pool.request().query(createTableQuery);
    console.log("✅ Tabla TABLE_CONDITIONS creada exitosamente");

    // Crear índices
    console.log("📊 Creando índices...");

    const createIndexesQuery = `
      CREATE INDEX IX_TABLE_CONDITIONS_TABLE ON TABLE_CONDITIONS(ActivatedTableId);
      CREATE INDEX IX_TABLE_CONDITIONS_ACTIVE ON TABLE_CONDITIONS(IsActive);
    `;

    await pool.request().query(createIndexesQuery);
    console.log("✅ Índices creados exitosamente");

    // Crear constraint único
    console.log("🔒 Creando constraint único...");

    const createUniqueConstraintQuery = `
      ALTER TABLE TABLE_CONDITIONS 
      ADD CONSTRAINT UQ_TABLE_CONDITIONS 
      UNIQUE (ActivatedTableId, ColumnName, ConditionType)
    `;

    await pool.request().query(createUniqueConstraintQuery);
    console.log("✅ Constraint único creado exitosamente");

    console.log("\n🎉 Tabla TABLE_CONDITIONS creada completamente");
    console.log("📋 Estructura:");
    console.log("   - Id (INT, PRIMARY KEY)");
    console.log("   - ActivatedTableId (INT, NOT NULL)");
    console.log("   - ColumnName (NVARCHAR(128), NOT NULL)");
    console.log("   - DataType (NVARCHAR(50), NOT NULL)");
    console.log("   - ConditionType (NVARCHAR(50), NOT NULL)");
    console.log("   - ConditionValue (NVARCHAR(MAX))");
    console.log("   - IsRequired (BIT, DEFAULT 0)");
    console.log("   - IsActive (BIT, DEFAULT 1)");
    console.log("   - CreatedAt (DATETIME2, DEFAULT GETDATE())");
    console.log("   - UpdatedAt (DATETIME2, DEFAULT GETDATE())");
    console.log("   - CreatedBy (INT)");
    console.log("   - UpdatedBy (INT)");
  } catch (error) {
    console.error("❌ Error creando tabla TABLE_CONDITIONS:", error.message);
    if (error.code === "EREQUEST") {
      console.error("Detalles del error SQL:", error.originalError);
    }
  } finally {
    process.exit(0);
  }
}

createTableConditions();














