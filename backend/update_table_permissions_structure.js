const { getPool } = require("./db");

async function updateTablePermissionsStructure() {
  try {
    console.log(
      "🔧 Actualizando estructura de tabla USER_TABLE_PERMISSIONS..."
    );

    const pool = await getPool();

    // Verificar si la columna CanCreate existe
    const checkColumnQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'USER_TABLE_PERMISSIONS' 
      AND COLUMN_NAME = 'CanCreate'
    `;

    const columnResult = await pool.request().query(checkColumnQuery);

    if (columnResult.recordset[0].count === 0) {
      console.log("   ⚠️  Columna CanCreate no existe, agregándola...");

      // Agregar la columna CanCreate
      const addColumnQuery = `
        ALTER TABLE USER_TABLE_PERMISSIONS 
        ADD CanCreate BIT DEFAULT 0
      `;

      await pool.request().query(addColumnQuery);
      console.log("   ✅ Columna CanCreate agregada exitosamente");
    } else {
      console.log("   ✅ Columna CanCreate ya existe");
    }

    // Verificar si la columna FechaAsignacion existe
    const checkFechaQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'USER_TABLE_PERMISSIONS' 
      AND COLUMN_NAME = 'FechaAsignacion'
    `;

    const fechaResult = await pool.request().query(checkFechaQuery);

    if (fechaResult.recordset[0].count === 0) {
      console.log("   ⚠️  Columna FechaAsignacion no existe, agregándola...");

      // Agregar la columna FechaAsignacion
      const addFechaQuery = `
        ALTER TABLE USER_TABLE_PERMISSIONS 
        ADD FechaAsignacion DATETIME2 DEFAULT GETDATE()
      `;

      await pool.request().query(addFechaQuery);
      console.log("   ✅ Columna FechaAsignacion agregada exitosamente");
    } else {
      console.log("   ✅ Columna FechaAsignacion ya existe");
    }

    console.log("✅ Estructura de tabla actualizada exitosamente");

    // Mostrar la estructura actual
    const structureQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'USER_TABLE_PERMISSIONS'
      ORDER BY ORDINAL_POSITION
    `;

    const structureResult = await pool.request().query(structureQuery);

    console.log("\n📋 Estructura actual de USER_TABLE_PERMISSIONS:");
    structureResult.recordset.forEach((column) => {
      console.log(
        `   - ${column.COLUMN_NAME}: ${column.DATA_TYPE} (${
          column.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error actualizando estructura:", error);
  } finally {
    process.exit(0);
  }
}

updateTablePermissionsStructure();
