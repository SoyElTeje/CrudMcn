const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { getPool } = require("./db");
const {
  router: authRoutes,
  authenticateToken,
  requireAdmin,
} = require("./routes/auth");

const logsRoutes = require("./routes/logs");

const logService = require("./services/logService");

const {
  requireReadPermission,
  requireWritePermission,
  requireDeletePermission,
  requireCreatePermission,
} = require("./middleware/auth");

// Importar middleware de upload y servicio de Excel
const upload = require("./middleware/upload");
const excelService = require("./services/excelService");

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

// Rutas de logs
app.use("/api/logs", logsRoutes);

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

// List accessible databases for the user
app.get("/api/databases", authenticateToken, async (req, res) => {
  try {
    // If user is admin, return all databases
    if (req.user.isAdmin) {
      const pool = await getPool();
      const dbsResult = await pool
        .request()
        .query(
          "SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')"
        );
      const dbs = dbsResult.recordset.map((row) => row.name);
      res.json(dbs);
      return;
    }

    // For non-admin users, get databases they have permissions for
    const pool = await getPool();

    // Get database permissions
    const dbPermissionsQuery = `
      SELECT DISTINCT DatabaseName 
      FROM USER_DATABASE_PERMISSIONS 
      WHERE UserId = @userId AND CanRead = 1
    `;
    const dbPermissionsResult = await pool
      .request()
      .input("userId", req.user.id)
      .query(dbPermissionsQuery);

    // Get table permissions to find databases with table-specific permissions
    const tablePermissionsQuery = `
      SELECT DISTINCT DatabaseName 
      FROM USER_TABLE_PERMISSIONS 
      WHERE UserId = @userId AND CanRead = 1
    `;
    const tablePermissionsResult = await pool
      .request()
      .input("userId", req.user.id)
      .query(tablePermissionsQuery);

    // Combine both sets of databases
    const accessibleDatabases = new Set();

    dbPermissionsResult.recordset.forEach((row) => {
      accessibleDatabases.add(row.DatabaseName);
    });

    tablePermissionsResult.recordset.forEach((row) => {
      accessibleDatabases.add(row.DatabaseName);
    });

    res.json(Array.from(accessibleDatabases));
  } catch (error) {
    console.error("Error fetching accessible databases:", error);
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
        CHARACTER_MAXIMUM_LENGTH,
        COLUMNPROPERTY(object_id(@tableName), COLUMN_NAME, 'IsIdentity') as IS_IDENTITY
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

      // Get CHECK constraints information
      const checkConstraintsQuery = `
      SELECT 
        ccu.COLUMN_NAME,
        ccu.CONSTRAINT_NAME,
        cc.CHECK_CLAUSE
      FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
      JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc ON ccu.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
      WHERE ccu.TABLE_NAME = @tableName
      `;

      const [columnsResult, primaryKeyResult, checkConstraintsResult] =
        await Promise.all([
          request.query(columnsQuery),
          request.query(primaryKeyQuery),
          request.query(checkConstraintsQuery),
        ]);

      const primaryKeys = primaryKeyResult.recordset.map(
        (row) => row.COLUMN_NAME
      );

      // Add check constraints info to columns
      const columnsWithConstraints = columnsResult.recordset.map((column) => {
        const constraints = checkConstraintsResult.recordset.filter(
          (constraint) => constraint.COLUMN_NAME === column.COLUMN_NAME
        );
        return {
          ...column,
          checkConstraints: constraints,
        };
      });

      res.json({
        tableName,
        columns: columnsWithConstraints,
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

// Get total count of records in a table
app.get(
  "/api/databases/:dbName/tables/:tableName/count",
  authenticateToken,
  requireReadPermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;

      const pool = await getPool(dbName);
      const result = await pool
        .request()
        .query(`SELECT COUNT(*) as count FROM [${tableName}]`);

      res.json({
        count: result.recordset[0].count,
      });
    } catch (error) {
      console.error("Error fetching table count:", error);
      res.status(500).json({
        error: "Failed to fetch table count",
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
          SELECT 
            COLUMN_NAME, 
            IS_NULLABLE, 
            COLUMN_DEFAULT,
            COLUMNPROPERTY(object_id(@tableName), COLUMN_NAME, 'IsIdentity') as IS_IDENTITY
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `);

      const columns = structureResponse.recordset;

      // Filter out only identity columns (auto-increment)
      // Allow nullable columns and columns with default values
      const insertColumns = columns.filter((col) => !col.IS_IDENTITY);

      // Filter columns that have values provided by the user
      const columnsWithValues = insertColumns.filter(
        (col) =>
          record.hasOwnProperty(col.COLUMN_NAME) &&
          record[col.COLUMN_NAME] !== "" &&
          record[col.COLUMN_NAME] !== null &&
          record[col.COLUMN_NAME] !== undefined
      );

      if (columnsWithValues.length === 0) {
        return res.status(400).json({
          error: "At least one field must be provided",
        });
      }

      // Build INSERT query with only columns that have values
      const columnNames = columnsWithValues
        .map((col) => `[${col.COLUMN_NAME}]`)
        .join(", ");
      const valuePlaceholders = columnsWithValues
        .map((col) => `@${col.COLUMN_NAME}`)
        .join(", ");

      const query = `INSERT INTO [${tableName}] (${columnNames}) VALUES (${valuePlaceholders})`;

      const request = pool.request();

      // Add parameters for INSERT
      columnsWithValues.forEach((col) => {
        request.input(col.COLUMN_NAME, record[col.COLUMN_NAME]);
      });

      const result = await request.query(query);

      // Registrar log de inserción
      await logService.logInsert(
        req.user.id,
        req.user.username,
        dbName,
        tableName,
        record,
        null, // recordId (se puede obtener después si es necesario)
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: "Record created successfully",
        affectedRows: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error creating record:", error);

      // Detectar errores específicos de SQL Server
      let errorMessage = "Error al crear el registro";
      let errorType = "general";

      if (error.message) {
        const errorMsg = error.message.toLowerCase();

        // Error de clave primaria duplicada
        if (
          errorMsg.includes("primary key") ||
          errorMsg.includes("duplicate key") ||
          errorMsg.includes("unique constraint") ||
          errorMsg.includes("pk_")
        ) {
          errorMessage =
            "Ya existe un registro con la misma clave primaria. Verifique que los valores de identificación sean únicos.";
          errorType = "primary_key_violation";
        }
        // Error de constraint de verificación (CHECK)
        else if (
          errorMsg.includes("check constraint") ||
          errorMsg.includes("check_")
        ) {
          errorMessage =
            "Los datos no cumplen con las restricciones de validación de la tabla.";
          errorType = "check_constraint_violation";
        }
        // Error de clave foránea
        else if (errorMsg.includes("foreign key") || errorMsg.includes("fk_")) {
          errorMessage =
            "Los datos hacen referencia a un registro que no existe en otra tabla.";
          errorType = "foreign_key_violation";
        }
        // Error de NOT NULL
        else if (
          errorMsg.includes("cannot insert the value null") ||
          errorMsg.includes("null value")
        ) {
          errorMessage =
            "No se puede insertar un valor nulo en un campo requerido.";
          errorType = "null_violation";
        }
        // Error de tipo de dato
        else if (
          errorMsg.includes("conversion failed") ||
          errorMsg.includes("data type")
        ) {
          errorMessage =
            "El tipo de dato proporcionado no es compatible con el campo.";
          errorType = "data_type_violation";
        }
        // Error de longitud
        else if (
          errorMsg.includes("string or binary data would be truncated")
        ) {
          errorMessage =
            "Los datos proporcionados exceden la longitud máxima permitida para el campo.";
          errorType = "length_violation";
        }
      }

      res.status(400).json({
        error: errorMessage,
        errorType: errorType,
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

      // Obtener datos anteriores para el log
      const oldDataQuery = `SELECT * FROM [${tableName}] WHERE ${whereClause}`;
      const oldDataRequest = pool.request();
      primaryKeys.forEach((key) => {
        oldDataRequest.input(`where_${key}`, primaryKeyValues[key]);
      });
      const oldDataResult = await oldDataRequest.query(oldDataQuery);
      const oldData = oldDataResult.recordset[0];

      const result = await request.query(query);

      // Registrar log de actualización
      await logService.logUpdate(
        req.user.id,
        req.user.username,
        dbName,
        tableName,
        oldData,
        record,
        JSON.stringify(primaryKeyValues), // recordId como string de los valores de PK
        req.ip,
        req.get("User-Agent")
      );

      res.json({
        success: true,
        message: "Record updated successfully",
        affectedRows: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error updating record:", error);

      // Detectar errores específicos de SQL Server
      let errorMessage = "Error al actualizar el registro";
      let errorType = "general";

      if (error.message) {
        const errorMsg = error.message.toLowerCase();

        // Error de constraint de verificación (CHECK)
        if (
          errorMsg.includes("check constraint") ||
          errorMsg.includes("check_")
        ) {
          errorMessage =
            "Los datos no cumplen con las restricciones de validación de la tabla.";
          errorType = "check_constraint_violation";
        }
        // Error de clave foránea
        else if (errorMsg.includes("foreign key") || errorMsg.includes("fk_")) {
          errorMessage =
            "Los datos hacen referencia a un registro que no existe en otra tabla.";
          errorType = "foreign_key_violation";
        }
        // Error de NOT NULL
        else if (
          errorMsg.includes("cannot insert the value null") ||
          errorMsg.includes("null value")
        ) {
          errorMessage =
            "No se puede actualizar con un valor nulo en un campo requerido.";
          errorType = "null_violation";
        }
        // Error de tipo de dato
        else if (
          errorMsg.includes("conversion failed") ||
          errorMsg.includes("data type")
        ) {
          errorMessage =
            "El tipo de dato proporcionado no es compatible con el campo.";
          errorType = "data_type_violation";
        }
        // Error de longitud
        else if (
          errorMsg.includes("string or binary data would be truncated")
        ) {
          errorMessage =
            "Los datos proporcionados exceden la longitud máxima permitida para el campo.";
          errorType = "length_violation";
        }
        // Error de registro no encontrado
        else if (
          errorMsg.includes("0 rows affected") ||
          errorMsg.includes("no rows affected")
        ) {
          errorMessage =
            "No se encontró el registro especificado para actualizar.";
          errorType = "record_not_found";
        }
      }

      res.status(400).json({
        error: errorMessage,
        errorType: errorType,
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

      // Obtener datos anteriores para el log
      const oldDataQuery = `SELECT * FROM [${tableName}] WHERE ${whereClause}`;
      const oldDataRequest = pool.request();
      primaryKeys.forEach((key) => {
        oldDataRequest.input(key, primaryKeyValues[key]);
      });
      const oldDataResult = await oldDataRequest.query(oldDataQuery);
      const oldData = oldDataResult.recordset[0];

      const result = await request.query(query);

      // Registrar log de eliminación
      await logService.logDelete(
        req.user.id,
        req.user.username,
        dbName,
        tableName,
        oldData,
        JSON.stringify(primaryKeyValues), // recordId como string de los valores de PK
        1, // affectedRows
        req.ip,
        req.get("User-Agent")
      );

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
      const deletedRecords = [];

      // Delete each record individually using transactions for safety
      for (const record of records) {
        // Build WHERE clause using primary keys
        const whereClause = primaryKeys
          .map((key) => `[${key}] = @${key}`)
          .join(" AND ");

        // Obtener datos anteriores para el log
        const oldDataQuery = `SELECT * FROM [${tableName}] WHERE ${whereClause}`;
        const oldDataRequest = pool.request();
        primaryKeys.forEach((key) => {
          oldDataRequest.input(key, record[key]);
        });
        const oldDataResult = await oldDataRequest.query(oldDataQuery);
        const oldData = oldDataResult.recordset[0];

        if (oldData) {
          deletedRecords.push(oldData);
        }

        const query = `DELETE FROM [${tableName}] WHERE ${whereClause}`;

        const request = pool.request();

        // Add parameters for WHERE clause (primary keys)
        primaryKeys.forEach((key) => {
          request.input(key, record[key]);
        });

        const result = await request.query(query);
        totalAffectedRows += result.rowsAffected[0];
      }

      // Registrar log de eliminación múltiple
      if (deletedRecords.length > 0) {
        await logService.logDelete(
          req.user.id,
          req.user.username,
          dbName,
          tableName,
          deletedRecords,
          null, // recordId
          totalAffectedRows,
          req.ip,
          req.get("User-Agent")
        );
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

// Ruta para importar datos desde Excel
app.post(
  "/api/databases/:dbName/tables/:tableName/import-excel",
  authenticateToken,
  requireWritePermission,
  upload.single("excelFile"),
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: "No se ha proporcionado ningún archivo Excel",
        });
      }

      console.log(
        `📊 Procesando importación de Excel para ${dbName}.${tableName}`
      );
      console.log(`📁 Archivo: ${req.file.originalname}`);

      // Procesar la importación
      const result = await excelService.processExcelImport(
        req.file.path,
        dbName,
        tableName
      );

      // Registrar log de importación de Excel
      if (result.successCount > 0) {
        await logService.logInsert(
          req.user.id,
          req.user.username,
          dbName,
          tableName,
          { importType: "Excel", fileName: req.file.originalname },
          null, // recordId
          req.ip,
          req.get("User-Agent")
        );
      }

      res.json({
        success: true,
        message: `Importación completada: ${result.successCount} registros insertados, ${result.errorCount} errores`,
        data: {
          totalRows: result.totalRows,
          successCount: result.successCount,
          errorCount: result.errorCount,
          headers: result.headers,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error("Error importing Excel data:", error);
      res.status(500).json({
        error: "Error al importar datos desde Excel",
        details: error.message,
      });
    }
  }
);

// Ruta para obtener una vista previa del archivo Excel
app.post(
  "/api/databases/:dbName/tables/:tableName/preview-excel",
  authenticateToken,
  requireReadPermission,
  upload.single("excelFile"),
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: "No se ha proporcionado ningún archivo Excel",
        });
      }

      // Leer el archivo Excel sin insertar
      const excelData = await excelService.readExcelFile(req.file.path);

      // Validar columnas
      const validation = await excelService.validateColumns(
        dbName,
        tableName,
        excelData.headers
      );

      // Limpiar archivo temporal
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({
        success: true,
        data: {
          headers: excelData.headers,
          totalRows: excelData.totalRows,
          previewRows: excelData.rows.slice(0, 5), // Mostrar solo las primeras 5 filas
          validation: {
            tableColumns: validation.tableColumns,
            insertableColumns: validation.insertableColumns,
            identityColumns: validation.identityColumns,
          },
        },
      });
    } catch (error) {
      console.error("Error previewing Excel file:", error);

      // Limpiar archivo temporal en caso de error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: "Error al previsualizar archivo Excel",
        details: error.message,
      });
    }
  }
);

// Ruta para exportar datos de una tabla a Excel
app.get(
  "/api/databases/:dbName/tables/:tableName/export-excel",
  authenticateToken,
  requireReadPermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { exportType = "all", limit, offset } = req.query;

      console.log(
        `📊 Exportando datos de ${dbName}.${tableName} - Tipo: ${exportType}`
      );

      // Validar parámetros
      if (exportType === "current_page" && (!limit || !offset)) {
        return res.status(400).json({
          error:
            "Para exportar la página actual, se requieren los parámetros 'limit' y 'offset'",
        });
      }

      // Procesar la exportación
      const result = await excelService.exportTableToExcel(
        dbName,
        tableName,
        exportType,
        limit,
        offset
      );

      // Registrar log de exportación de Excel
      await logService.logExport(
        req.user.id,
        req.user.username,
        dbName,
        tableName,
        result.recordCount || 0,
        req.ip,
        req.get("User-Agent")
      );

      // Enviar el archivo como respuesta
      res.download(result.filePath, result.fileName, (err) => {
        // Limpiar el archivo después de enviarlo
        if (fs.existsSync(result.filePath)) {
          fs.unlinkSync(result.filePath);
        }

        if (err) {
          console.error("Error sending file:", err);
        } else {
          console.log(`✅ Archivo exportado exitosamente: ${result.fileName}`);
        }
      });
    } catch (error) {
      console.error("Error exporting Excel data:", error);
      res.status(500).json({
        error: "Error al exportar datos a Excel",
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
