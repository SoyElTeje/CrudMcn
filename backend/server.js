const express = require("express");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");
const { getPool } = require("./db");
const {
  authenticateUser,
  authenticateToken,
  requireAdmin,
} = require("./middleware/auth");
const { loggingMiddleware, captureOldValues } = require("./middleware/logging");
const { initializeAppDatabase } = require("./initAppDb");
const { initializePermissions } = require("./initPermissions");
const PermissionsService = require("./services/permissionsService");
const UserService = require("./services/userService");
const LogService = require("./services/logService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos Excel (.xlsx, .xls)"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

// Inicializar base de datos de la aplicación al arrancar
initializeAppDatabase();
initializePermissions();

// Endpoint de login
app.post("/api/auth/login", authenticateUser, (req, res) => {
  res.json({
    success: true,
    message: "Login exitoso",
    user: {
      userId: req.user.userId,
      username: req.user.username,
      isAdmin: req.user.isAdmin,
    },
  });
});

// ===== ENDPOINTS DE GESTIÓN DE USUARIOS (Solo Admin) =====

// Obtener todos los usuarios
app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({
      error: "Error al obtener los usuarios",
      details: error.message,
    });
  }
});

// Crear nuevo usuario
app.post("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username y password son requeridos",
      });
    }

    const newUser = await UserService.createUser(
      username,
      password,
      isAdmin || false
    );

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({
      error: "Error al crear el usuario",
      details: error.message,
    });
  }
});

// Actualizar contraseña de usuario
app.put(
  "/api/users/:userId/password",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          error: "Nueva contraseña es requerida",
        });
      }

      await UserService.updatePassword(parseInt(userId), newPassword);

      res.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      res.status(500).json({
        error: "Error al actualizar la contraseña",
        details: error.message,
      });
    }
  }
);

// Eliminar usuario
app.delete(
  "/api/users/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      await UserService.deleteUser(parseInt(userId));

      res.json({
        success: true,
        message: "Usuario eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      res.status(500).json({
        error: "Error al eliminar el usuario",
        details: error.message,
      });
    }
  }
);

// Obtener permisos de un usuario
app.get(
  "/api/users/:userId/permissions",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const permissions = await UserService.getUserPermissions(
        parseInt(userId)
      );

      res.json({
        success: true,
        permissions: permissions,
      });
    } catch (error) {
      console.error("Error obteniendo permisos:", error);
      res.status(500).json({
        error: "Error al obtener los permisos",
        details: error.message,
      });
    }
  }
);

// Asignar permiso de base de datos
app.post(
  "/api/users/:userId/permissions/databases",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { databaseName } = req.body;

      if (!databaseName) {
        return res.status(400).json({
          error: "Nombre de base de datos es requerido",
        });
      }

      const result = await UserService.assignDatabasePermission(
        parseInt(userId),
        databaseName
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error asignando permiso de base de datos:", error);
      res.status(500).json({
        error: "Error al asignar el permiso",
        details: error.message,
      });
    }
  }
);

// Asignar permiso de tabla
app.post(
  "/api/users/:userId/permissions/tables",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { databaseName, tableName, schemaName } = req.body;

      if (!databaseName || !tableName) {
        return res.status(400).json({
          error: "Nombre de base de datos y tabla son requeridos",
        });
      }

      const result = await UserService.assignTablePermission(
        parseInt(userId),
        databaseName,
        tableName,
        schemaName || "dbo"
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error asignando permiso de tabla:", error);
      res.status(500).json({
        error: "Error al asignar el permiso",
        details: error.message,
      });
    }
  }
);

// Remover permiso de base de datos
app.delete(
  "/api/users/:userId/permissions/databases/:databaseName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId, databaseName } = req.params;

      const result = await UserService.removeDatabasePermission(
        parseInt(userId),
        databaseName
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error removiendo permiso de base de datos:", error);
      res.status(500).json({
        error: "Error al remover el permiso",
        details: error.message,
      });
    }
  }
);

// Remover permiso de tabla
app.delete(
  "/api/users/:userId/permissions/tables/:databaseName/:tableName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId, databaseName, tableName } = req.params;

      const result = await UserService.removeTablePermission(
        parseInt(userId),
        databaseName,
        tableName
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error removiendo permiso de tabla:", error);
      res.status(500).json({
        error: "Error al remover el permiso",
        details: error.message,
      });
    }
  }
);

// Obtener todas las bases de datos disponibles (para asignar permisos)
app.get(
  "/api/admin/databases",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const pool = await getPool(process.env.TRIAL_DB);
      const result = await pool.request().query(`
      SELECT name FROM sys.databases 
      WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
      ORDER BY name
    `);

      res.json({
        success: true,
        databases: result.recordset.map((db) => db.name),
      });
    } catch (error) {
      console.error("Error obteniendo bases de datos:", error);
      res.status(500).json({
        error: "Error al obtener las bases de datos",
        details: error.message,
      });
    }
  }
);

// Obtener todas las tablas de una base de datos (para asignar permisos)
app.get(
  "/api/admin/databases/:dbName/tables",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { dbName } = req.params;
      const pool = await getPool(dbName);

      const result = await pool.request().query(`
      SELECT 
        s.name as schema_name,
        t.name as table_name
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      ORDER BY s.name, t.name
    `);

      res.json({
        success: true,
        tables: result.recordset.map((table) => ({
          schema: table.schema_name,
          name: table.table_name,
        })),
      });
    } catch (error) {
      console.error("Error obteniendo tablas:", error);
      res.status(500).json({
        error: "Error al obtener las tablas",
        details: error.message,
      });
    }
  }
);

// Endpoint para obtener bases de datos (con permisos)
app.get("/api/databases", authenticateToken, async (req, res) => {
  try {
    const databases = await PermissionsService.getUserDatabases(
      req.user.userId
    );

    res.json({
      success: true,
      databases: databases,
    });
  } catch (error) {
    console.error("Error obteniendo bases de datos:", error);
    res.status(500).json({
      error: "Error al obtener las bases de datos",
      details: error.message,
    });
  }
});

// Endpoint para obtener tablas de una base de datos (con permisos)
app.get(
  "/api/databases/:dbName/tables",
  authenticateToken,
  async (req, res) => {
    try {
      const { dbName } = req.params;

      // Verificar si el usuario tiene acceso a esta base de datos
      const canAccess = await PermissionsService.canAccessDatabase(
        req.user.userId,
        dbName
      );
      if (!canAccess) {
        return res.status(403).json({
          error: "No tienes permisos para acceder a esta base de datos",
        });
      }

      const tables = await PermissionsService.getUserTables(
        req.user.userId,
        dbName
      );

      res.json({
        success: true,
        tables: tables,
      });
    } catch (error) {
      console.error("Error obteniendo tablas:", error);
      res.status(500).json({
        error: "Error al obtener las tablas",
        details: error.message,
      });
    }
  }
);

// Trial endpoint with pagination and filters
app.get("/api/trial/table", async (req, res) => {
  try {
    const trialDb = req.query.db || process.env.TRIAL_DB;
    const trialTable = req.query.table || process.env.TRIAL_TABLE;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 25, 50); // Máximo 50 registros
    const offset = (page - 1) * pageSize;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : [];

    if (!trialDb || !trialTable) {
      return res.status(400).json({
        error:
          "TRIAL_DB and TRIAL_TABLE must be defined in .env or provided as query params",
      });
    }

    const pool = await getPool(trialDb);

    // Build WHERE clause for filters
    let whereClause = "";
    const filterParams = [];

    if (filters.length > 0) {
      const conditions = [];
      filters.forEach((filter, index) => {
        if (filter.value !== "" && filter.value !== null) {
          let condition = "";
          const paramName = `param${index}`;

          switch (filter.operator) {
            case "=":
              condition = `${filter.column} = @${paramName}`;
              break;
            case "!=":
              condition = `${filter.column} != @${paramName}`;
              break;
            case ">":
              condition = `${filter.column} > @${paramName}`;
              break;
            case "<":
              condition = `${filter.column} < @${paramName}`;
              break;
            case ">=":
              condition = `${filter.column} >= @${paramName}`;
              break;
            case "<=":
              condition = `${filter.column} <= @${paramName}`;
              break;
            case "between":
              // Para el operador "between", esperamos un valor en formato "fecha1|fecha2"
              const dates = filter.value.toString().split("|");
              if (dates.length === 2) {
                condition = `${filter.column} BETWEEN @${paramName}Start AND @${paramName}End`;
                filterParams.push({
                  name: `${paramName}Start`,
                  value: dates[0],
                });
                filterParams.push({ name: `${paramName}End`, value: dates[1] });
              } else {
                // Si no hay dos fechas, usar solo la primera
                condition = `${filter.column} >= @${paramName}`;
              }
              break;
            case "contains":
              condition = `LOWER(${filter.column}) LIKE LOWER(@${paramName})`;
              filterParams.push({
                name: paramName,
                value: `%${filter.value}%`,
              });
              break;
            case "starts_with":
              condition = `LOWER(${filter.column}) LIKE LOWER(@${paramName})`;
              filterParams.push({ name: paramName, value: `${filter.value}%` });
              break;
            case "ends_with":
              condition = `LOWER(${filter.column}) LIKE LOWER(@${paramName})`;
              filterParams.push({ name: paramName, value: `%${filter.value}` });
              break;
            default:
              condition = `${filter.column} = @${paramName}`;
          }

          if (
            filter.operator !== "contains" &&
            filter.operator !== "starts_with" &&
            filter.operator !== "ends_with" &&
            filter.operator !== "between"
          ) {
            filterParams.push({ name: paramName, value: filter.value });
          }

          conditions.push(condition);
        }
      });

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(" AND ")}`;
      }
    }

    // Get total count with filters
    const countQuery = `SELECT COUNT(*) as total FROM ${trialTable} ${whereClause}`;
    const countRequest = pool.request();
    filterParams.forEach((param) => {
      countRequest.input(param.name, param.value);
    });
    const countResult = await countRequest.query(countQuery);
    const totalCount = countResult.recordset[0].total;

    // Get paginated data with filters
    const dataQuery = `
      SELECT * FROM ${trialTable} 
      ${whereClause}
      ORDER BY (SELECT NULL) 
      OFFSET ${offset} ROWS 
      FETCH NEXT ${pageSize} ROWS ONLY
    `;

    const dataRequest = pool.request();
    filterParams.forEach((param) => {
      dataRequest.input(param.name, param.value);
    });
    const result = await dataRequest.query(dataQuery);

    res.json({
      database: trialDb,
      table: trialTable,
      count: result.recordset.length,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      data: result.recordset,
      appliedFilters: filters.filter((f) => f.value !== "" && f.value !== null),
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

// Get table schema
app.get("/api/databases/:dbName/tables/:tableName/schema", async (req, res) => {
  try {
    const { dbName, tableName } = req.params;
    const pool = await getPool(dbName);

    const schemaResult = await pool.request().query(`
        SELECT 
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.IS_NULLABLE,
          c.COLUMN_DEFAULT,
          c.CHARACTER_MAXIMUM_LENGTH,
          c.NUMERIC_PRECISION,
          c.NUMERIC_SCALE,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PRIMARY_KEY
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND ku.TABLE_NAME = '${tableName}'
        ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_NAME = '${tableName}'
        ORDER BY c.ORDINAL_POSITION
      `);

    const schema = schemaResult.recordset.map((col) => ({
      name: col.COLUMN_NAME,
      type: col.DATA_TYPE,
      nullable: col.IS_NULLABLE === "YES",
      defaultValue: col.COLUMN_DEFAULT,
      maxLength: col.CHARACTER_MAXIMUM_LENGTH,
      precision: col.NUMERIC_PRECISION,
      scale: col.NUMERIC_SCALE,
      isPrimaryKey: col.IS_PRIMARY_KEY === 1,
    }));

    res.json(schema);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch table schema", details: error.message });
  }
});

// Update record
app.put(
  "/api/databases/:dbName/tables/:tableName/records/:id",
  authenticateToken,
  captureOldValues,
  loggingMiddleware,
  async (req, res) => {
    try {
      const { dbName, tableName, id } = req.params;
      const updateData = req.body;

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No data provided for update" });
      }

      const pool = await getPool(dbName);

      // Get table schema to validate fields and find primary key
      const schemaResult = await pool.request().query(`
        SELECT 
          c.COLUMN_NAME, 
          c.DATA_TYPE, 
          c.IS_NULLABLE,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PRIMARY_KEY
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND ku.TABLE_NAME = '${tableName}'
        ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_NAME = '${tableName}'
      `);

      const validColumns = schemaResult.recordset.map((col) => col.COLUMN_NAME);
      const primaryKeyColumn = schemaResult.recordset.find(
        (col) => col.IS_PRIMARY_KEY === 1
      );

      if (!primaryKeyColumn) {
        return res
          .status(400)
          .json({ error: "No primary key found for table" });
      }

      // Filter out invalid columns and primary key
      const validUpdateData = {};
      Object.keys(updateData).forEach((key) => {
        if (
          validColumns.includes(key) &&
          key !== primaryKeyColumn.COLUMN_NAME
        ) {
          validUpdateData[key] = updateData[key];
        }
      });

      if (Object.keys(validUpdateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid columns provided for update" });
      }

      // Build UPDATE query using the actual primary key column name
      const setClause = Object.keys(validUpdateData)
        .map((key) => `${key} = @${key}`)
        .join(", ");

      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${primaryKeyColumn.COLUMN_NAME} = @id`;

      const request = pool.request();
      request.input("id", id);

      // Add parameters for each field
      Object.keys(validUpdateData).forEach((key) => {
        request.input(key, validUpdateData[key]);
      });

      const result = await request.query(query);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.json({
        success: true,
        message: "Record updated successfully",
        rowsAffected: result.rowsAffected[0],
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

// Import Excel file
app.post(
  "/api/databases/:dbName/tables/:tableName/import",
  authenticateToken,
  upload.single("file"),
  loggingMiddleware,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const pool = await getPool(dbName);

      // Get table schema for validation
      const schemaResult = await pool.request().query(`
        SELECT 
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.IS_NULLABLE,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PRIMARY_KEY
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND ku.TABLE_NAME = '${tableName}'
        ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_NAME = '${tableName}'
        ORDER BY c.ORDINAL_POSITION
      `);

      const schema = schemaResult.recordset.map((col) => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === "YES",
        isPrimaryKey: col.IS_PRIMARY_KEY === 1,
      }));

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (excelData.length < 2) {
        return res.status(400).json({
          error:
            "El archivo Excel debe tener al menos una fila de encabezados y una fila de datos",
        });
      }

      // Extract headers (first row)
      const headers = excelData[0];
      const dataRows = excelData.slice(1);

      // Validate headers against table schema
      const editableColumns = schema.filter((col) => !col.isPrimaryKey);
      const missingColumns = editableColumns.filter(
        (col) => !headers.includes(col.name)
      );
      const extraColumns = headers.filter(
        (header) => !schema.find((col) => col.name === header)
      );

      if (missingColumns.length > 0) {
        return res.status(400).json({
          error: "Columnas faltantes en el Excel",
          missingColumns: missingColumns.map((col) => col.name),
          requiredColumns: editableColumns.map((col) => col.name),
        });
      }

      if (extraColumns.length > 0) {
        return res.status(400).json({
          error: "Columnas extra en el Excel que no existen en la tabla",
          extraColumns,
        });
      }

      // Validate and transform data
      const validatedData = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowData = {};
        let rowHasError = false;

        // Map Excel row to column names
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = row[j];
          const columnSchema = schema.find((col) => col.name === header);

          if (columnSchema && !columnSchema.isPrimaryKey) {
            // Validate data type
            const validationResult = validateDataType(value, columnSchema);
            if (validationResult.isValid) {
              rowData[header] = validationResult.value;
            } else {
              errors.push(
                `Fila ${i + 2}, Columna ${header}: ${validationResult.error}`
              );
              rowHasError = true;
            }
          }
        }

        if (!rowHasError) {
          validatedData.push(rowData);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: "Errores de validación en los datos",
          errors: errors.slice(0, 10), // Limit to first 10 errors
          totalErrors: errors.length,
        });
      }

      if (validatedData.length === 0) {
        return res
          .status(400)
          .json({ error: "No hay datos válidos para importar" });
      }

      // Insert data into database
      let insertedCount = 0;
      for (const rowData of validatedData) {
        const columns = Object.keys(rowData);
        const values = Object.values(rowData);
        const placeholders = columns.map((col) => `@${col}`).join(", ");

        const query = `INSERT INTO ${tableName} (${columns.join(
          ", "
        )}) VALUES (${placeholders})`;

        const request = pool.request();
        columns.forEach((col, index) => {
          request.input(col, values[index]);
        });

        try {
          await request.query(query);
          insertedCount++;
        } catch (insertError) {
          console.error("Error inserting row:", insertError);
          errors.push(`Error al insertar fila: ${insertError.message}`);
        }
      }

      res.json({
        success: true,
        message: `Importación completada. ${insertedCount} registros insertados.`,
        insertedCount,
        totalRows: validatedData.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : [],
      });
    } catch (error) {
      console.error("Error importing Excel:", error);
      res.status(500).json({
        error: "Error al importar el archivo Excel",
        details: error.message,
      });
    }
  }
);

// Helper function to validate data types
function validateDataType(value, columnSchema) {
  if (value === null || value === undefined || value === "") {
    if (columnSchema.nullable) {
      return { isValid: true, value: null };
    } else {
      return { isValid: false, error: "Campo requerido no puede estar vacío" };
    }
  }

  const type = columnSchema.type.toLowerCase();

  try {
    if (type.includes("int") || type.includes("bigint")) {
      const num = parseInt(value);
      if (isNaN(num)) {
        return { isValid: false, error: "Debe ser un número entero" };
      }
      return { isValid: true, value: num };
    }

    if (
      type.includes("decimal") ||
      type.includes("numeric") ||
      type.includes("float")
    ) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return { isValid: false, error: "Debe ser un número decimal" };
      }
      return { isValid: true, value: num };
    }

    if (type.includes("date") || type.includes("datetime")) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: "Formato de fecha inválido" };
      }
      return { isValid: true, value: date };
    }

    if (type.includes("bit")) {
      if (typeof value === "boolean") {
        return { isValid: true, value: value ? 1 : 0 };
      }
      if (value === "1" || value === "true" || value === "TRUE") {
        return { isValid: true, value: 1 };
      }
      if (value === "0" || value === "false" || value === "FALSE") {
        return { isValid: true, value: 0 };
      }
      return {
        isValid: false,
        error: "Debe ser true/false, 1/0, o TRUE/FALSE",
      };
    }

    // Default to string for varchar, nvarchar, text, etc.
    const strValue = String(value);
    if (columnSchema.maxLength && strValue.length > columnSchema.maxLength) {
      return {
        isValid: false,
        error: `Máximo ${columnSchema.maxLength} caracteres permitidos`,
      };
    }
    return { isValid: true, value: strValue };
  } catch (error) {
    return { isValid: false, error: "Error al validar el tipo de dato" };
  }
}

// Export to Excel
app.get("/api/databases/:dbName/tables/:tableName/export", async (req, res) => {
  try {
    const { dbName, tableName } = req.params;
    const { page, pageSize, exportAll, filters } = req.query;
    const parsedFilters = filters ? JSON.parse(filters) : [];

    const pool = await getPool(dbName);

    let data;
    let totalCount = 0;

    // Build WHERE clause for filters
    let whereClause = "";
    const filterParams = [];

    if (parsedFilters.length > 0) {
      const conditions = [];
      parsedFilters.forEach((filter, index) => {
        if (filter.value !== "" && filter.value !== null) {
          let condition = "";
          const paramName = `param${index}`;

          switch (filter.operator) {
            case "=":
              condition = `${filter.column} = @${paramName}`;
              break;
            case "!=":
              condition = `${filter.column} != @${paramName}`;
              break;
            case ">":
              condition = `${filter.column} > @${paramName}`;
              break;
            case "<":
              condition = `${filter.column} < @${paramName}`;
              break;
            case ">=":
              condition = `${filter.column} >= @${paramName}`;
              break;
            case "<=":
              condition = `${filter.column} <= @${paramName}`;
              break;
            case "between":
              // Para el operador "between", esperamos un valor en formato "fecha1|fecha2"
              const dates = filter.value.toString().split("|");
              if (dates.length === 2) {
                condition = `${filter.column} BETWEEN @${paramName}Start AND @${paramName}End`;
                filterParams.push({
                  name: `${paramName}Start`,
                  value: dates[0],
                });
                filterParams.push({ name: `${paramName}End`, value: dates[1] });
              } else {
                // Si no hay dos fechas, usar solo la primera
                condition = `${filter.column} >= @${paramName}`;
              }
              break;
            case "contains":
              condition = `LOWER(${filter.column}) LIKE LOWER(@${paramName})`;
              filterParams.push({
                name: paramName,
                value: `%${filter.value}%`,
              });
              break;
            case "starts_with":
              condition = `LOWER(${filter.column}) LIKE LOWER(@${paramName})`;
              filterParams.push({ name: paramName, value: `${filter.value}%` });
              break;
            case "ends_with":
              condition = `LOWER(${filter.column}) LIKE LOWER(@${paramName})`;
              filterParams.push({ name: paramName, value: `%${filter.value}` });
              break;
            default:
              condition = `${filter.column} = @${paramName}`;
          }

          if (
            filter.operator !== "contains" &&
            filter.operator !== "starts_with" &&
            filter.operator !== "ends_with" &&
            filter.operator !== "between"
          ) {
            filterParams.push({ name: paramName, value: filter.value });
          }

          conditions.push(condition);
        }
      });

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(" AND ")}`;
      }
    }

    if (exportAll === "true") {
      // Export all data with filters
      const query = `SELECT * FROM ${tableName} ${whereClause}`;
      const request = pool.request();
      filterParams.forEach((param) => {
        request.input(param.name, param.value);
      });
      const result = await request.query(query);
      data = result.recordset;
      totalCount = data.length;
    } else {
      // Export paginated data with filters
      const currentPage = parseInt(page) || 1;
      const currentPageSize = Math.min(parseInt(pageSize) || 25, 50); // Máximo 50 registros
      const offset = (currentPage - 1) * currentPageSize;

      // Get total count with filters
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
      const countRequest = pool.request();
      filterParams.forEach((param) => {
        countRequest.input(param.name, param.value);
      });
      const countResult = await countRequest.query(countQuery);
      totalCount = countResult.recordset[0].total;

      // Get paginated data with filters
      const dataQuery = `
        SELECT * FROM ${tableName} 
        ${whereClause}
        ORDER BY (SELECT NULL) 
        OFFSET ${offset} ROWS 
        FETCH NEXT ${currentPageSize} ROWS ONLY
      `;

      const dataRequest = pool.request();
      filterParams.forEach((param) => {
        dataRequest.input(param.name, param.value);
      });
      const result = await dataRequest.query(dataQuery);
      data = result.recordset;
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "No hay datos para exportar" });
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const columnWidths = [];
    const headers = Object.keys(data[0] || {});

    headers.forEach((header) => {
      let maxLength = header.length;
      data.forEach((row) => {
        const cellValue = String(row[header] || "");
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      columnWidths.push({ wch: Math.min(maxLength + 2, 50) }); // Max width 50
    });

    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

    // Generate filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const filename = `${tableName}_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write to buffer and send
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({
      error: "Error al exportar a Excel",
      details: error.message,
    });
  }
});

// Delete record
app.delete(
  "/api/databases/:dbName/tables/:tableName/records/:id",
  authenticateToken,
  captureOldValues,
  loggingMiddleware,
  async (req, res) => {
    try {
      const { dbName, tableName, id } = req.params;

      const pool = await getPool(dbName);

      // Get table schema to find primary key
      const schemaResult = await pool.request().query(`
      SELECT 
        c.COLUMN_NAME, 
        c.DATA_TYPE, 
        c.IS_NULLABLE,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND ku.TABLE_NAME = '${tableName}'
      ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE c.TABLE_NAME = '${tableName}'
    `);

      const primaryKeyColumn = schemaResult.recordset.find(
        (col) => col.IS_PRIMARY_KEY === 1
      );

      if (!primaryKeyColumn) {
        return res
          .status(400)
          .json({ error: "No primary key found for table" });
      }

      // Build DELETE query using the actual primary key column name
      const query = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn.COLUMN_NAME} = @id`;

      const request = pool.request();
      request.input("id", id);

      const result = await request.query(query);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.json({
        success: true,
        message: "Record deleted successfully",
        rowsAffected: result.rowsAffected[0],
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

// Bulk delete records
app.delete(
  "/api/databases/:dbName/tables/:tableName/records",
  authenticateToken,
  loggingMiddleware,
  async (req, res) => {
    try {
      const { dbName, tableName } = req.params;
      const { ids } = req.body; // Array of IDs to delete

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ error: "IDs array is required and must not be empty" });
      }

      const pool = await getPool(dbName);

      // Get table schema to find primary key
      const schemaResult = await pool.request().query(`
      SELECT 
        c.COLUMN_NAME, 
        c.DATA_TYPE, 
        c.IS_NULLABLE,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND ku.TABLE_NAME = '${tableName}'
      ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE c.TABLE_NAME = '${tableName}'
    `);

      const primaryKeyColumn = schemaResult.recordset.find(
        (col) => col.IS_PRIMARY_KEY === 1
      );

      if (!primaryKeyColumn) {
        return res
          .status(400)
          .json({ error: "No primary key found for table" });
      }

      // Build DELETE query with IN clause
      const placeholders = ids.map((_, index) => `@id${index}`).join(", ");
      const query = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn.COLUMN_NAME} IN (${placeholders})`;

      const request = pool.request();
      ids.forEach((id, index) => {
        request.input(`id${index}`, id);
      });

      const result = await request.query(query);

      res.json({
        success: true,
        message: `${result.rowsAffected[0]} record(s) deleted successfully`,
        rowsAffected: result.rowsAffected[0],
        requestedCount: ids.length,
      });
    } catch (error) {
      console.error("Error bulk deleting records:", error);
      res.status(500).json({
        error: "Failed to delete records",
        details: error.message,
      });
    }
  }
);

// ===== ENDPOINTS DE LOGS (Solo Admin) =====

// Obtener logs con filtros y paginación
app.get("/api/logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 25,
      username,
      action,
      databaseName,
      tableName,
      startDate,
      endDate,
    } = req.query;

    const filters = {};
    if (username) filters.username = username;
    if (action) filters.action = action;
    if (databaseName) filters.databaseName = databaseName;
    if (tableName) filters.tableName = tableName;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await LogService.getLogs(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error obteniendo logs:", error);
    res.status(500).json({
      error: "Error al obtener los logs",
      details: error.message,
    });
  }
});

// Obtener estadísticas de logs
app.get(
  "/api/logs/stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await LogService.getLogStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas de logs:", error);
      res.status(500).json({
        error: "Error al obtener las estadísticas",
        details: error.message,
      });
    }
  }
);

// Limpiar logs antiguos
app.delete(
  "/api/logs/clean",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { daysToKeep = 90 } = req.body;
      const deletedCount = await LogService.cleanOldLogs(daysToKeep);

      res.json({
        success: true,
        message: `${deletedCount} logs eliminados`,
        deletedCount,
      });
    } catch (error) {
      console.error("Error limpiando logs:", error);
      res.status(500).json({
        error: "Error al limpiar los logs",
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Trial endpoint: http://localhost:${PORT}/api/trial/table`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
