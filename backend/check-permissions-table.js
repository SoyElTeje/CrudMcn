/**
 * Script para verificar la estructura real de la tabla user_permissions
 */

const sql = require("mssql");
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

async function checkPermissionsTable() {
  let pool;

  try {
    console.log("🔗 Conectando a la base de datos...");
    pool = await sql.connect(config);
    console.log("✅ Conectado exitosamente");

    // Verificar si la tabla user_permissions existe
    console.log("📋 Verificando si la tabla user_permissions existe...");
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'user_permissions'
    `);

    if (tableCheck.recordset.length === 0) {
      console.log("❌ La tabla user_permissions no existe");
      return;
    }

    console.log("✅ La tabla user_permissions existe");

    // Obtener la estructura de la tabla
    console.log("📋 Obteniendo estructura de la tabla user_permissions...");
    const structureResult = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'user_permissions'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("\n📊 Estructura de la tabla user_permissions:");
    console.log("==========================================");
    structureResult.recordset.forEach(column => {
      console.log(`- ${column.COLUMN_NAME}: ${column.DATA_TYPE} (${column.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Mostrar algunos registros de ejemplo si existen
    console.log("\n📋 Registros existentes en user_permissions:");
    const recordsResult = await pool.request().query(`
      SELECT TOP 5 * FROM user_permissions
    `);

    if (recordsResult.recordset.length > 0) {
      console.log("==========================================");
      recordsResult.recordset.forEach((record, index) => {
        console.log(`Registro ${index + 1}:`, record);
      });
    } else {
      console.log("No hay registros en la tabla");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Ejecutar
if (require.main === module) {
  checkPermissionsTable()
    .then(() => {
      console.log("\n✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { checkPermissionsTable };

















