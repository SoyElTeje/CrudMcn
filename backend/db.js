const sql = require("mssql");
require("dotenv").config();

const baseConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false, // Set to true if using Azure
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pools = {};

async function getPool(dbName = process.env.DB_DATABASE) {
  if (pools[dbName]) {
    return pools[dbName];
  }

  const config = {
    ...baseConfig,
    database: dbName,
  };

  try {
    // Create a new connection pool for this specific database
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    pools[dbName] = pool;
    console.log(`✅ Connected to database: ${dbName}`);
    return pool;
  } catch (err) {
    console.error(`❌ Error connecting to database ${dbName}:`, err);
    throw err;
  }
}

module.exports = { getPool, sql };
