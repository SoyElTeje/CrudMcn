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

async function checkTableStructure() {
  try {
    console.log("🔍 Verificando estructura de la tabla...");

    const pool = await sql.connect(config);

    // Verificar si la tabla existe
    const tableExistsQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = '${process.env.USERS_TABLE}'
    `;

    const tableResult = await pool.request().query(tableExistsQuery);

    if (tableResult.recordset[0].count === 0) {
      console.log(`❌ La tabla ${process.env.USERS_TABLE} no existe`);
      return;
    }

    console.log(`✅ La tabla ${process.env.USERS_TABLE} existe`);

    // Obtener estructura de la tabla
    const structureQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${process.env.USERS_TABLE}'
      ORDER BY ORDINAL_POSITION
    `;

    const structureResult = await pool.request().query(structureQuery);

    console.log("\n📋 Estructura actual de la tabla:");
    console.log("----------------------------------------");
    structureResult.recordset.forEach((col) => {
      console.log(
        `${col.COLUMN_NAME}: ${col.DATA_TYPE} ${
          col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"
        }`
      );
    });

    // Verificar si hay datos
    const dataQuery = `SELECT COUNT(*) as count FROM ${process.env.USERS_TABLE}`;
    const dataResult = await pool.request().query(dataQuery);

    console.log(`\n📊 Registros en la tabla: ${dataResult.recordset[0].count}`);

    if (dataResult.recordset[0].count > 0) {
      const sampleQuery = `SELECT TOP 3 * FROM ${process.env.USERS_TABLE}`;
      const sampleResult = await pool.request().query(sampleQuery);

      console.log("\n📝 Muestra de datos:");
      console.log("----------------------------------------");
      sampleResult.recordset.forEach((row, index) => {
        console.log(`Registro ${index + 1}:`, row);
      });
    }

    await pool.close();
  } catch (error) {
    console.error("❌ Error verificando estructura:", error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkTableStructure();
}

module.exports = { checkTableStructure };
