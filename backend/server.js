const express = require("express");
const cors = require("cors");
const { getPool } = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

// Trial endpoint
app.get('/api/trial/table', async (req, res) => {
  try {
    const trialDb = req.query.db || process.env.TRIAL_DB;
    const trialTable = req.query.table || process.env.TRIAL_TABLE;
    
    if (!trialDb || !trialTable) {
      return res.status(400).json({ 
        error: 'TRIAL_DB and TRIAL_TABLE must be defined in .env or provided as query params' 
      });
    }

    const pool = await getPool(trialDb);
    const result = await pool.request().query(`SELECT TOP 100 * FROM ${trialTable}`);
    
    res.json({
      database: trialDb,
      table: trialTable,
      count: result.recordset.length,
      data: result.recordset
    });
    
  } catch (error) {
    console.error('Error in trial endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trial data',
      details: error.message 
    });
  }
});

// List all databases
app.get("/api/databases", async (req, res) => {
  try {
    const pool = await getPool();
    const dbsResult = await pool
      .request()
      .query(
        "SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')"
      );
    const dbs = dbsResult.recordset.map((row) => row.name);
    res.json(dbs);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch databases", details: error.message });
  }
});

// List all tables in a database
app.get("/api/databases/:dbName/tables", async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const pool = await getPool(dbName);
    const tablesResult = await pool
      .request()
      .query(
        `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
      );
    const tables = tablesResult.recordset.map((row) => ({
      schema: row.TABLE_SCHEMA,
      name: row.TABLE_NAME,
    }));
    res.json(tables);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch tables", details: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Trial endpoint: http://localhost:${PORT}/api/trial/table`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
