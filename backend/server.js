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
const activatedTablesRoutes = require("./routes/activatedTables");

const logService = require("./services/logService");
const {
  parseDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

const {
  requireReadPermission,
  requireWritePermission,
  requireDeletePermission,
  requireCreatePermission,
  requireTableListingPermission,
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

// Rutas de tablas activadas
app.use("/api/activated-tables", activatedTablesRoutes);

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

// List tables in a database (solo tablas activadas)
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  requireTableListingPermission,
  async (req, res) => {
    try {
      const dbName = req.params.dbName;
      const userId = req.user.id;

      // Importar el servicio de tablas activadas
      const activatedTablesService = require("./services/activatedTablesService");

      // Obtener solo las tablas activadas para esta base de datos
      const activatedTables = await activatedTablesService.getActivatedTables();
      const tablesForDb = activatedTables.filter(
        (table) => table.DatabaseName === dbName
      );

      // Si el usuario es admin, mostrar todas las tablas activadas
      if (req.user.isAdmin) {
        const tables = tablesForDb.map((table) => ({
          schema: table.DatabaseName,
          name: table.TableName,
          database: table.DatabaseName,
          description: table.Description,
          activatedTableId: table.Id,
        }));
        res.json(tables);
        return;
      }

      // Para usuarios no admin, verificar permisos específicos de tabla
      const pool = await getPool();
      const userTablePermissionsQuery = `
        SELECT TableName 
        FROM USER_TABLE_PERMISSIONS 
        WHERE UserId = @userId AND DatabaseName = @dbName
      `;

      const userTablePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .input("dbName", dbName)
        .query(userTablePermissionsQuery);

      const permittedTables = userTablePermissionsResult.recordset.map(
        (row) => row.TableName
      );

      // Filtrar solo las tablas activadas que el usuario tiene permisos para ver
      const accessibleTables = tablesForDb.filter((table) =>
        permittedTables.includes(table.TableName)
      );

      const tables = accessibleTables.map((table) => ({
        schema: table.DatabaseName,
        name: table.TableName,
        database: table.DatabaseName,
        description: table.Description,
        activatedTableId: table.Id,
      }));

      res.json(tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
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
      const { limit = 100, offset = 0, filters, sort } = req.query;

      const pool = await getPool(dbName);
      const request = pool.request();

      // Parse filters and sort from query parameters
      let parsedFilters = [];
      let parsedSort = null;

      if (filters) {
        try {
          parsedFilters = JSON.parse(filters);
        } catch (e) {
          console.warn("Invalid filters format:", e);
        }
      }

      if (sort) {
        try {
          parsedSort = JSON.parse(sort);
        } catch (e) {
          console.warn("Invalid sort format:", e);
        }
      }

      // Import query builder
      const { buildSelectQuery } = require("./utils/queryBuilder");

      // Build the query with filters and sorting
      const query = buildSelectQuery(
        tableName,
        parsedFilters,
        parsedSort,
        limit,
        offset,
        request
      );

      const result = await request.query(query);

      // Convertir fechas de ISO a DD/MM/AAAA para el frontend
      const { formatDateDDMMYYYY } = require("./utils/dateUtils");

      const recordsWithFormattedDates = result.recordset.map((record) => {
        const formattedRecord = { ...record };

        // Usar el campo FechaIngreso_String si existe, y convertir fechas
        if (formattedRecord.FechaIngreso_String) {
          // Convertir YYYY-MM-DD a DD/MM/AAAA
          const match = formattedRecord.FechaIngreso_String.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
          );
          if (match) {
            const year = match[1];
            const month = match[2];
            const day = match[3];
            const formattedDate = `${day}/${month}/${year}`;
            formattedRecord.FechaIngreso = formattedDate;
          }

          // Eliminar el campo temporal
          delete formattedRecord.FechaIngreso_String;
        } else {
          // Procesar otros campos de fecha si existen
          Object.keys(formattedRecord).forEach((key) => {
            const value = formattedRecord[key];

            if (value instanceof Date) {
              // Es un objeto Date, convertirlo a DD/MM/AAAA
              formattedRecord[key] = formatDateDDMMYYYY(value);
            } else if (
              typeof value === "string" &&
              value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            ) {
              // Es un string ISO datetime, convertirlo a DD/MM/AAAA HH:MM
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                const day = date.getDate().toString().padStart(2, "0");
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;
                formattedRecord[key] = formattedDateTime;
              }
            } else if (
              typeof value === "string" &&
              value.match(/^\d{4}-\d{2}-\d{2}$/)
            ) {
              // Es un string ISO date (YYYY-MM-DD), convertirlo a DD/MM/AAAA
              // Extraer directamente los componentes de la fecha para evitar problemas de zona horaria
              const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (match) {
                const year = match[1];
                const month = match[2];
                const day = match[3];
                const formattedDate = `${day}/${month}/${year}`;
                formattedRecord[key] = formattedDate;
              }
            }
          });
        }

        return formattedRecord;
      });



      res.json({
        database: dbName,
        table: tableName,
        count: recordsWithFormattedDates.length,
        data: recordsWithFormattedDates,
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
      const { filters } = req.query;

      const pool = await getPool(dbName);
      const request = pool.request();

      // Parse filters from query parameters
      let parsedFilters = [];

      if (filters) {
        try {
          parsedFilters = JSON.parse(filters);
        } catch (e) {
          console.warn("Invalid filters format:", e);
        }
      }

      // Import query builder
      const { buildCountQuery } = require("./utils/queryBuilder");

      // Build the count query with filters
      const query = buildCountQuery(tableName, parsedFilters, request);

      const result = await request.query(query);

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

      // Importar el servicio de tablas activadas para validación
      const activatedTablesService = require("./services/activatedTablesService");

      // Verificar si la tabla está activada
      const isActivated = await activatedTablesService.isTableActivated(
        dbName,
        tableName
      );
      if (!isActivated) {
        return res.status(403).json({
          error: "Esta tabla no está disponible para operaciones de escritura",
        });
      }

      // Validar los datos según las condiciones configuradas
      const validation = await activatedTablesService.validateTableData(
        dbName,
        tableName,
        record
      );
      if (!validation.isValid) {
        return res.status(400).json({
          error: "Los datos no cumplen con las condiciones configuradas",
          details: validation.errors,
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
        let value = record[col.COLUMN_NAME];

        // Convertir fechas de DD/MM/AAAA a YYYY-MM-DD para la base de datos
        if (
          col.DATA_TYPE &&
          (col.DATA_TYPE.toLowerCase().includes("date") ||
            col.DATA_TYPE.toLowerCase().includes("datetime"))
        ) {
          if (value && typeof value === "string") {
            console.log(
              `DEBUG: Procesando fecha para columna ${col.COLUMN_NAME}: "${value}"`
            );

            // Importar las utilidades de fecha
            const {
              isMMDDYYYYFormat,
              convertToISODate,
            } = require("./utils/dateUtils");

            // Verificar si es formato MM/DD/AAAA y rechazarlo
            if (isMMDDYYYYFormat(value)) {
              console.log(
                `DEBUG: Formato MM/DD/AAAA detectado y rechazado: "${value}"`
              );
              return res.status(400).json({
                error: "Formato de fecha inválido",
                details: `El campo '${col.COLUMN_NAME}' debe estar en formato DD/MM/AAAA, no MM/DD/AAAA`,
                errorType: "date_format_violation",
              });
            }

            const isoDate = convertToISODate(value);
            if (isoDate) {
              value = isoDate;
            } else {
              // Si la conversión falla, lanzar error
              return res.status(400).json({
                error: "Formato de fecha inválido",
                details: `El campo '${col.COLUMN_NAME}' debe estar en formato DD/MM/AAAA`,
                errorType: "date_format_violation",
              });
            }
          }
        }

        request.input(col.COLUMN_NAME, value);
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

      // Importar el servicio de tablas activadas para validación
      const activatedTablesService = require("./services/activatedTablesService");

      // Verificar si la tabla está activada
      const isActivated = await activatedTablesService.isTableActivated(
        dbName,
        tableName
      );
      if (!isActivated) {
        return res.status(403).json({
          error: "Esta tabla no está disponible para operaciones de escritura",
        });
      }

      // Validar los datos según las condiciones configuradas
      const validation = await activatedTablesService.validateTableData(
        dbName,
        tableName,
        record
      );
      if (!validation.isValid) {
        return res.status(400).json({
          error: "Los datos no cumplen con las condiciones configuradas",
          details: validation.errors,
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

      // Get table columns with data types for date conversion
      const columnsResponse = await pool.request().input("tableName", tableName)
        .query(`
          SELECT COLUMN_NAME, DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `);

      const columns = columnsResponse.recordset;

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

      console.log(
        `🔍 Debug update - Actualizando ${setFields.length} campos en ${tableName}`
      );

      const request = pool.request();

      // Add parameters for SET clause
      for (const key of setFields) {
        let value = record[key];

        // Buscar el tipo de dato de la columna
        const column = columns.find((col) => col.COLUMN_NAME === key);

        // Convertir fechas de DD/MM/AAAA a YYYY-MM-DD para la base de datos
        if (
          column &&
          column.DATA_TYPE &&
          (column.DATA_TYPE.toLowerCase().includes("date") ||
            column.DATA_TYPE.toLowerCase().includes("datetime"))
        ) {
          if (value && typeof value === "string") {
            // Verificar si es formato MM/DD/AAAA y rechazarlo
            if (isMMDDYYYYFormat(value)) {
              return res.status(400).json({
                error: "Formato de fecha inválido",
                details: `El campo '${key}' debe estar en formato DD/MM/AAAA, no MM/DD/AAAA`,
                errorType: "date_format_violation",
              });
            }

            const isoDate = convertToISODate(value);
            if (isoDate) {
              value = isoDate;
            } else {
              // Si la conversión falla, lanzar error
              return res.status(400).json({
                error: "Formato de fecha inválido",
                details: `El campo '${key}' debe estar en formato DD/MM/AAAA`,
                errorType: "date_format_violation",
              });
            }
          }
        }

        request.input(key, value);
      }

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
      const { ignoreHeaders } = req.body; // Nueva opción para ignorar headers

      if (!req.file) {
        return res.status(400).json({
          error: "No se ha proporcionado ningún archivo Excel",
        });
      }

      console.log(
        `📊 Procesando importación de Excel para ${dbName}.${tableName}`
      );
      console.log(`📁 Archivo: ${req.file.originalname}`);
      console.log(`🔧 Ignorar headers: ${ignoreHeaders === "true"}`);

      // Procesar la importación
      const result = await excelService.processExcelImport(
        req.file.path,
        dbName,
        tableName,
        ignoreHeaders === "true"
      );

      // Registrar log de importación de Excel
      if (result.successCount > 0) {
        await logService.logInsert(
          req.user.id,
          req.user.username,
          dbName,
          tableName,
          {
            importType: "Excel",
            fileName: req.file.originalname,
            ignoreHeaders,
          },
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
          errorReport: result.errorReport,
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

// Ruta para descargar reporte de errores de importación
app.get(
  "/api/download-error-report/:fileName",
  authenticateToken,
  async (req, res) => {
    try {
      const { fileName } = req.params;
      const filePath = `uploads/${fileName}`;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: "El archivo de reporte de errores no existe",
        });
      }

      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error downloading error report:", err);
        }
        // Limpiar el archivo después de la descarga
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000); // Esperar 5 segundos antes de eliminar
      });
    } catch (error) {
      console.error("Error serving error report:", error);
      res.status(500).json({
        error: "Error al descargar el reporte de errores",
        details: error.message,
      });
    }
  }
);

// Ruta para descargar template de Excel con headers de la tabla
app.get(
  "/api/databases/:dbName/tables/:tableName/download-template",
  authenticateToken,
  requireReadPermission,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;

      console.log(`📋 Generando template de Excel para ${dbName}.${tableName}`);

      // Generar el template
      const template = await excelService.generateExcelTemplate(
        dbName,
        tableName
      );

      // Enviar el archivo
      res.download(template.filePath, template.fileName, (err) => {
        // Limpiar el archivo temporal después de enviarlo
        if (fs.existsSync(template.filePath)) {
          fs.unlinkSync(template.filePath);
        }

        if (err) {
          console.error("Error sending template file:", err);
        }
      });
    } catch (error) {
      console.error("Error generating Excel template:", error);
      res.status(500).json({
        error: "Error al generar template de Excel",
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
      const { ignoreHeaders } = req.body; // Nueva opción para ignorar headers

      if (!req.file) {
        return res.status(400).json({
          error: "No se ha proporcionado ningún archivo Excel",
        });
      }

      // Leer el archivo Excel sin insertar
      const excelData = await excelService.readExcelFile(
        req.file.path,
        ignoreHeaders === "true"
      );

      console.log("🔍 Debug preview - ignoreHeaders:", ignoreHeaders);
      console.log("🔍 Debug preview - excelData.headers:", excelData.headers);
      console.log(
        "🔍 Debug preview - excelData.rows.length:",
        excelData.rows.length
      );
      console.log("🔍 Debug preview - primera fila:", excelData.rows[0]);

      // Si se ignoran los headers, obtener los headers de la tabla para validación
      let headers = excelData.headers;
      let validation;

      if (ignoreHeaders === "true") {
        const tableStructure = await excelService.getTableHeaders(
          dbName,
          tableName
        );
        // Para la vista previa, mostrar las filas reales del Excel (incluyendo la primera como datos)
        // pero usar los headers de la tabla para la validación
        headers = tableStructure.insertableColumns;
        validation = {
          tableColumns: tableStructure.tableColumns,
          insertableColumns: tableStructure.insertableColumns,
          identityColumns: tableStructure.identityColumns,
        };
        console.log("🔍 Debug preview - usando headers de tabla:", headers);
        console.log(
          "🔍 Debug preview - filas del Excel (incluyendo primera como datos):",
          excelData.rows.length
        );
      } else {
        // Validar columnas normalmente
        validation = await excelService.validateColumns(
          dbName,
          tableName,
          excelData.headers
        );
        console.log(
          "🔍 Debug preview - usando headers del Excel:",
          excelData.headers
        );
      }

      // Limpiar archivo temporal
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({
        success: true,
        data: {
          headers: headers,
          totalRows: excelData.totalRows,
          previewRows: excelData.rows.slice(0, 5), // Mostrar solo las primeras 5 filas
          validation: {
            tableColumns: validation.tableColumns,
            insertableColumns: validation.insertableColumns,
            identityColumns: validation.identityColumns,
          },
          ignoreHeaders: ignoreHeaders === "true", // Agregar esta información para el frontend
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
      const { exportType = "all", limit, offset, filters, sort } = req.query;

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

      // Parse filters and sort from query parameters
      let parsedFilters = [];
      let parsedSort = null;

      if (filters) {
        try {
          parsedFilters = JSON.parse(filters);
        } catch (e) {
          console.warn("Invalid filters format:", e);
        }
      }

      if (sort) {
        try {
          parsedSort = JSON.parse(sort);
        } catch (e) {
          console.warn("Invalid sort format:", e);
        }
      }

      // Procesar la exportación
      const result = await excelService.exportTableToExcel(
        dbName,
        tableName,
        exportType,
        limit,
        offset,
        parsedFilters,
        parsedSort
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
