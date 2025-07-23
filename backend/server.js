const express = require("express");
const cors = require("cors");
const { getPool } = require("./db");
const {
  router: authRoutes,
  authenticateToken,
  requireAdmin,
} = require("./routes/auth");

const {
  requireReadPermission,
  requireWritePermission,
  requireDeletePermission,
  requireCreatePermission,
} = require("./middleware/auth");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Importar el servicio de autenticación para crear el admin por defecto
const authService = require("./services/authService");

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

// Rutas de autenticación (sin middleware de autenticación)
app.use("/api/auth", authRoutes);

// Trial endpoint
app.get("/api/trial/table", async (req, res) => {
  try {
    const trialDb = req.query.db || process.env.TRIAL_DB;
    const trialTable = req.query.table || process.env.TRIAL_TABLE;

    if (!trialDb || !trialTable) {
      return res.status(400).json({
        error:
          "TRIAL_DB and TRIAL_TABLE must be defined in .env or provided as query params",
      });
    }

    const pool = await getPool(trialDb);
    const result = await pool
      .request()
      .query(`SELECT TOP 100 * FROM ${trialTable}`);

    res.json({
      database: trialDb,
      table: trialTable,
      count: result.recordset.length,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in trial endpoint:", error);
    res.status(500).json({
      error: "Failed to fetch trial data",
      details: error.message,
    });
  }
});

// List all databases
app.get("/api/databases", authenticateToken, async (req, res) => {
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
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  requireReadPermission,
  async (req, res) => {
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
  }
);

// Get table structure including primary keys
app.get(
  "/api/databases/:dbName/tables/:tableName/structure",
  authenticateToken,
  requireReadPermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const pool = await getPool(dbName);

      // Get column information
      const columnsQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `;

      // Get primary key information
      const primaryKeyQuery = `
      SELECT 
        COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = @tableName 
      AND CONSTRAINT_NAME LIKE 'PK_%'
      ORDER BY ORDINAL_POSITION
    `;

      const request = pool.request();
      request.input("tableName", tableName);

      const [columnsResult, primaryKeyResult] = await Promise.all([
        request.query(columnsQuery),
        request.query(primaryKeyQuery),
      ]);

      const primaryKeys = primaryKeyResult.recordset.map(
        (row) => row.COLUMN_NAME
      );

      res.json({
        tableName,
        columns: columnsResult.recordset,
        primaryKeys,
      });
    } catch (error) {
      console.error("Error fetching table structure:", error);
      res.status(500).json({
        error: "Failed to fetch table structure",
        details: error.message,
      });
    }
  }
);

// Get table data
app.get(
  "/api/databases/:dbName/tables/:tableName/records",
  authenticateToken,
  requireReadPermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const pool = await getPool(dbName);
      const result = await pool
        .request()
        .input("limit", parseInt(limit))
        .input("offset", parseInt(offset))
        .query(
          `SELECT * FROM [${tableName}] ORDER BY (SELECT NULL) OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
        );

      res.json({
        database: dbName,
        table: tableName,
        count: result.recordset.length,
        data: result.recordset,
      });
    } catch (error) {
      console.error("Error fetching table data:", error);
      res.status(500).json({
        error: "Failed to fetch table data",
        details: error.message,
      });
    }
  }
);

// Create a new record in a table
app.post(
  "/api/databases/:dbName/tables/:tableName/records",
  authenticateToken,
  requireCreatePermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { record } = req.body;

      if (!record) {
        return res.status(400).json({
          error: "Record data is required",
        });
      }

      const pool = await getPool(dbName);

      // Get table structure to identify columns
      const structureResponse = await pool
        .request()
        .input("tableName", tableName).query(`
          SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `);

      const columns = structureResponse.recordset;

      // Filter out columns that have default values or are nullable
      const insertColumns = columns.filter(
        (col) => !col.COLUMN_DEFAULT && col.IS_NULLABLE === "NO"
      );

      // Build INSERT query
      const columnNames = insertColumns.map((col) => `[${col.COLUMN_NAME}]`).join(", ");
      const valuePlaceholders = insertColumns.map((col) => `@${col.COLUMN_NAME}`).join(", ");

      const query = `INSERT INTO [${tableName}] (${columnNames}) VALUES (${valuePlaceholders})`;

      const request = pool.request();

      // Add parameters for INSERT
      insertColumns.forEach((col) => {
        request.input(col.COLUMN_NAME, record[col.COLUMN_NAME]);
      });

      const result = await request.query(query);

      res.json({
        success: true,
        message: "Record created successfully",
        affectedRows: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error creating record:", error);
      res.status(500).json({
        error: "Failed to create record",
        details: error.message,
      });
    }
  }
);

// Update a record in a table
app.put(
  "/api/databases/:dbName/tables/:tableName/records",
  authenticateToken,
  requireWritePermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { record, primaryKeyValues } = req.body;

      if (!record || !primaryKeyValues) {
        return res.status(400).json({
          error: "Record data and primary key values are required",
        });
      }

      const pool = await getPool(dbName);

      // Get table structure to identify primary keys
      const structureResponse = await pool
        .request()
        .input("tableName", tableName).query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_NAME = @tableName 
          AND CONSTRAINT_NAME LIKE 'PK_%'
          ORDER BY ORDINAL_POSITION
        `);

      const primaryKeys = structureResponse.recordset.map(
        (row) => row.COLUMN_NAME
      );

      if (primaryKeys.length === 0) {
        return res.status(400).json({
          error: "No primary key found for this table",
        });
      }

      // Build SET clause for UPDATE (exclude primary keys)
      const setFields = Object.keys(record).filter(
        (key) => !primaryKeys.includes(key)
      );
      const setClause = setFields.map((key) => `[${key}] = @${key}`).join(", ");

      // Build WHERE clause using primary keys
      const whereClause = primaryKeys
        .map((key) => `[${key}] = @where_${key}`)
        .join(" AND ");

      const query = `UPDATE [${tableName}] SET ${setClause} WHERE ${whereClause}`;

      const request = pool.request();

      // Add parameters for SET clause
      setFields.forEach((key) => {
        request.input(key, record[key]);
      });

      // Add parameters for WHERE clause (primary keys)
      primaryKeys.forEach((key) => {
        request.input(`where_${key}`, primaryKeyValues[key]);
      });

      const result = await request.query(query);

      res.json({
        success: true,
        message: "Record updated successfully",
        affectedRows: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error updating record:", error);
      res.status(500).json({
        error: "Failed to update record",
        details: error.message,
      });
    }
  }
);

// Delete a record from a table
app.delete(
  "/api/databases/:dbName/tables/:tableName/records",
  authenticateToken,
  requireDeletePermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { primaryKeyValues } = req.body;

      if (!primaryKeyValues) {
        return res.status(400).json({
          error: "Primary key values are required",
        });
      }

      const pool = await getPool(dbName);

      // Get table structure to identify primary keys
      const structureResponse = await pool
        .request()
        .input("tableName", tableName).query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_NAME = @tableName 
          AND CONSTRAINT_NAME LIKE 'PK_%'
          ORDER BY ORDINAL_POSITION
        `);

      const primaryKeys = structureResponse.recordset.map(
        (row) => row.COLUMN_NAME
      );

      if (primaryKeys.length === 0) {
        return res.status(400).json({
          error: "No primary key found for this table",
        });
      }

      // Build WHERE clause using primary keys
      const whereClause = primaryKeys
        .map((key) => `[${key}] = @${key}`)
        .join(" AND ");

      const query = `DELETE FROM [${tableName}] WHERE ${whereClause}`;

      const request = pool.request();

      // Add parameters for WHERE clause (primary keys)
      primaryKeys.forEach((key) => {
        request.input(key, primaryKeyValues[key]);
      });

      const result = await request.query(query);

      res.json({
        success: true,
        message: "Record deleted successfully",
        affectedRows: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({
        error: "Failed to delete record",
        details: error.message,
      });
    }
  }
);

// Delete multiple records from a table
app.delete(
  "/api/databases/:dbName/tables/:tableName/records/bulk",
  authenticateToken,
  requireDeletePermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { records } = req.body;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          error: "Records array is required and must not be empty",
        });
      }

      const pool = await getPool(dbName);

      // Get table structure to identify primary keys
      const structureResponse = await pool
        .request()
        .input("tableName", tableName).query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_NAME = @tableName 
          AND CONSTRAINT_NAME LIKE 'PK_%'
          ORDER BY ORDINAL_POSITION
        `);

      const primaryKeys = structureResponse.recordset.map(
        (row) => row.COLUMN_NAME
      );

      if (primaryKeys.length === 0) {
        return res.status(400).json({
          error: "No primary key found for this table",
        });
      }

      let totalAffectedRows = 0;

      // Delete each record individually using transactions for safety
      for (const record of records) {
        // Build WHERE clause using primary keys
        const whereClause = primaryKeys
          .map((key) => `[${key}] = @${key}`)
          .join(" AND ");

        const query = `DELETE FROM [${tableName}] WHERE ${whereClause}`;

        const request = pool.request();

        // Add parameters for WHERE clause (primary keys)
        primaryKeys.forEach((key) => {
          request.input(key, record[key]);
        });

        const result = await request.query(query);
        totalAffectedRows += result.rowsAffected[0];
      }

      res.json({
        success: true,
        message: `${totalAffectedRows} records deleted successfully`,
        affectedRows: totalAffectedRows,
        deletedCount: records.length,
      });
    } catch (error) {
      console.error("Error deleting multiple records:", error);
      res.status(500).json({
        error: "Failed to delete records",
        details: error.message,
      });
    }
  }
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Inicializar el usuario admin por defecto
authService
  .createDefaultAdmin()
  .then(() => {
    console.log("✅ Usuario admin inicializado");
  })
  .catch((error) => {
    console.error("❌ Error inicializando usuario admin:", error);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Trial endpoint: http://localhost:${PORT}/api/trial/table`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
