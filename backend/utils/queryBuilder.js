/**
 * Utilidad para construir consultas SQL dinámicas con filtros y ordenamiento
 */

/**
 * Construye una cláusula WHERE basada en los filtros proporcionados
 * @param {Array} filters - Array de filtros con column, operator, value, dataType
 * @param {Object} request - Objeto request de mssql para agregar parámetros
 * @returns {string} - Cláusula WHERE construida
 */
function buildWhereClause(filters, request) {
  if (!filters || filters.length === 0) {
    return "";
  }

  const conditions = filters
    .map((filter, index) => {
      const { column, operator, value, dataType } = filter;

      if (!value || value.trim() === "") {
        return null;
      }

      const paramName = `filter_${index}`;
      let condition = "";

      switch (operator) {
        case "equals":
          condition = `[${column}] = @${paramName}`;
          request.input(paramName, value);
          break;

        case "not_equals":
          condition = `[${column}] != @${paramName}`;
          request.input(paramName, value);
          break;

        case "contains":
          condition = `[${column}] LIKE @${paramName}`;
          request.input(paramName, `%${value}%`);
          break;

        case "starts_with":
          condition = `[${column}] LIKE @${paramName}`;
          request.input(paramName, `${value}%`);
          break;

        case "ends_with":
          condition = `[${column}] LIKE @${paramName}`;
          request.input(paramName, `%${value}`);
          break;

        case "greater_than":
          condition = `[${column}] > @${paramName}`;
          request.input(paramName, parseValueByType(value, dataType));
          break;

        case "greater_equals":
          condition = `[${column}] >= @${paramName}`;
          request.input(paramName, parseValueByType(value, dataType));
          break;

        case "less_than":
          condition = `[${column}] < @${paramName}`;
          request.input(paramName, parseValueByType(value, dataType));
          break;

        case "less_equals":
          condition = `[${column}] <= @${paramName}`;
          request.input(paramName, parseValueByType(value, dataType));
          break;

        default:
          return null;
      }

      return condition;
    })
    .filter((condition) => condition !== null);

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

/**
 * Construye una cláusula ORDER BY basada en el ordenamiento proporcionado
 * @param {Object} sort - Objeto con column y direction
 * @returns {string} - Cláusula ORDER BY construida
 */
function buildOrderByClause(sort) {
  if (!sort || !sort.column) {
    return ""; // No agregar ORDER BY si no hay columna especificada
  }

  const direction = sort.direction === "DESC" ? "DESC" : "ASC";
  return `ORDER BY [${sort.column}] ${direction}`;
}

/**
 * Parsea un valor según el tipo de dato
 * @param {string} value - Valor a parsear
 * @param {string} dataType - Tipo de dato SQL
 * @returns {any} - Valor parseado
 */
function parseValueByType(value, dataType) {
  const normalizedType = dataType
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .trim();

  // Tipos numéricos
  if (["int", "bigint", "smallint", "tinyint"].includes(normalizedType)) {
    return parseInt(value) || 0;
  }

  if (["decimal", "float", "real", "money"].includes(normalizedType)) {
    return parseFloat(value) || 0;
  }

  // Tipos booleanos
  if (normalizedType === "bit") {
    return value === "1" || value === "true" ? 1 : 0;
  }

  // Tipos de fecha
  if (
    ["datetime", "datetime2", "date", "smalldatetime"].includes(normalizedType)
  ) {
    // Importar las utilidades de fecha
    const { parseDateDDMMYYYY, convertToISODate } = require("./dateUtils");

    // Intentar parsear como DD/MM/AAAA primero
    const parsedDate = parseDateDDMMYYYY(value);
    if (parsedDate) {
      return parsedDate;
    }

    // Si no funciona, intentar con el formato estándar
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  if (normalizedType === "time") {
    return value; // Mantener como string para TIME
  }

  // Tipos de texto (por defecto)
  return value;
}

/**
 * Construye una consulta SQL completa con filtros, ordenamiento y paginación
 * @param {string} tableName - Nombre de la tabla
 * @param {Array} filters - Array de filtros
 * @param {Object} sort - Objeto de ordenamiento
 * @param {number} limit - Límite de registros
 * @param {number} offset - Offset para paginación
 * @param {Object} request - Objeto request de mssql
 * @returns {string} - Consulta SQL completa
 */
async function buildSelectQuery(
  tableName,
  filters,
  sort,
  limit,
  offset,
  request,
  databaseName = null
) {
  const whereClause = buildWhereClause(filters, request);
  const orderByClause = buildOrderByClause(sort);

  // Obtener información de las columnas para identificar tipos de fecha
  const { getPool } = require("../db");
  const pool = await getPool(databaseName);

  const columnInfoQuery = `
    SELECT 
      COLUMN_NAME,
      DATA_TYPE,
      IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = @tableName
    ORDER BY ORDINAL_POSITION
  `;

  let columnResult;
  try {
    columnResult = await pool
      .request()
      .input("tableName", tableName)
      .query(columnInfoQuery);
  } catch (error) {
    console.error("Error obteniendo información de columnas:", error.message);
    console.error("  Database:", databaseName);
    console.error("  Table:", tableName);
    throw new Error(
      `Error obteniendo estructura de la tabla ${tableName}: ${error.message}`
    );
  }

  const columns = columnResult.recordset;

  if (!columns || columns.length === 0) {
    throw new Error(
      `No se encontraron columnas para la tabla ${tableName} en la base de datos ${
        databaseName || "default"
      }`
    );
  }

  // Construir la lista de columnas con formateo de fechas
  // Nota: FORMAT() solo está disponible en SQL Server 2012+ y solo funciona con tipos fecha/datetime
  // IMPORTANTE: No aplicar FORMAT() a tipos nvarchar/varchar/text aunque se llamen "fecha"
  const columnList = columns
    .map((col) => {
      const columnName = col.COLUMN_NAME;
      const dataType = col.DATA_TYPE.toLowerCase().trim();

      // Extraer el tipo base (sin longitud, ej: "nvarchar" de "nvarchar(50)")
      const baseType = dataType.split("(")[0].trim();

      // Primero verificar si es un tipo de texto (ANTES de verificar fecha)
      // Los tipos de texto incluyen: nvarchar, varchar, char, nchar, text, ntext
      const isTextType =
        baseType === "nvarchar" ||
        baseType === "varchar" ||
        baseType === "char" ||
        baseType === "nchar" ||
        baseType === "text" ||
        baseType === "ntext";

      // Solo aplicar FORMAT() si es realmente un tipo de fecha/datetime Y NO es texto
      // Los tipos de fecha válidos son: date, datetime, datetime2, smalldatetime, time
      const isDateType =
        !isTextType &&
        (baseType === "date" ||
          baseType === "datetime" ||
          baseType === "datetime2" ||
          baseType === "smalldatetime" ||
          baseType === "time");

      if (isDateType) {
        // Solo aplicar FORMAT() a tipos de fecha reales
        // Usar TRY_CAST para manejar valores NULL o inválidos sin causar errores
        // TRY_CAST retorna NULL si la conversión falla, lo cual es seguro para FORMAT
        if (baseType === "time") {
          return `CASE WHEN [${columnName}] IS NULL THEN NULL ELSE FORMAT(TRY_CAST([${columnName}] AS time), 'HH:mm:ss') END as [${columnName}]`;
        } else if (
          baseType === "datetime" ||
          baseType === "datetime2" ||
          baseType === "smalldatetime"
        ) {
          return `CASE WHEN [${columnName}] IS NULL THEN NULL ELSE FORMAT(TRY_CAST([${columnName}] AS datetime2), 'dd/MM/yyyy HH:mm:ss') END as [${columnName}]`;
        } else {
          return `CASE WHEN [${columnName}] IS NULL THEN NULL ELSE FORMAT(TRY_CAST([${columnName}] AS date), 'dd/MM/yyyy') END as [${columnName}]`;
        }
      } else {
        // Para otros tipos (incluyendo nvarchar, varchar, text, etc.), usar la columna tal como está
        return `[${columnName}]`;
      }
    })
    .join(", ");

  let query = `SELECT ${columnList} FROM [${tableName}]`;

  if (whereClause) {
    query += ` ${whereClause}`;
  }

  // Si necesitamos paginación, usar ROW_NUMBER() para compatibilidad
  if (limit && offset !== undefined) {
    const orderColumn =
      sort && sort.column
        ? sort.column
        : columns.length > 0
        ? columns[0].COLUMN_NAME
        : "id";
    const orderDirection = sort && sort.direction === "DESC" ? "DESC" : "ASC";

    // Usar ROW_NUMBER() para paginación compatible con versiones más antiguas de SQL Server
    // Crear lista de columnas sin RowNum para la consulta externa
    // IMPORTANTE: Debe coincidir con columnList para que las columnas se alineen correctamente
    const externalColumnList = columns
      .map((col) => {
        const columnName = col.COLUMN_NAME;
        const dataType = col.DATA_TYPE.toLowerCase().trim();

        // Extraer el tipo base (sin longitud, ej: "nvarchar" de "nvarchar(50)")
        const baseType = dataType.split("(")[0].trim();

        // Primero verificar si es un tipo de texto (ANTES de verificar fecha)
        const isTextType =
          baseType === "nvarchar" ||
          baseType === "varchar" ||
          baseType === "char" ||
          baseType === "nchar" ||
          baseType === "text" ||
          baseType === "ntext";

        // Solo aplicar FORMAT() si es realmente un tipo de fecha/datetime Y NO es texto
        const isDateType =
          !isTextType &&
          (baseType === "date" ||
            baseType === "datetime" ||
            baseType === "datetime2" ||
            baseType === "smalldatetime" ||
            baseType === "time");

        if (isDateType) {
          // Usar TRY_CAST para manejar valores NULL o inválidos sin causar errores
          // TRY_CAST retorna NULL si la conversión falla, lo cual es seguro para FORMAT
          if (baseType === "time") {
            return `CASE WHEN [${columnName}] IS NULL THEN NULL ELSE FORMAT(TRY_CAST([${columnName}] AS time), 'HH:mm:ss') END as [${columnName}]`;
          } else if (
            baseType === "datetime" ||
            baseType === "datetime2" ||
            baseType === "smalldatetime"
          ) {
            return `CASE WHEN [${columnName}] IS NULL THEN NULL ELSE FORMAT(TRY_CAST([${columnName}] AS datetime2), 'dd/MM/yyyy HH:mm:ss') END as [${columnName}]`;
          } else {
            return `CASE WHEN [${columnName}] IS NULL THEN NULL ELSE FORMAT(TRY_CAST([${columnName}] AS date), 'dd/MM/yyyy') END as [${columnName}]`;
          }
        } else {
          // Para otros tipos, usar la columna tal como está
          return `[${columnName}]`;
        }
      })
      .join(", ");

    query = `
      SELECT ${externalColumnList} FROM (
        SELECT ${columnList}, ROW_NUMBER() OVER (ORDER BY [${orderColumn}] ${orderDirection}) as RowNum
        FROM [${tableName}]
        ${whereClause}
      ) AS PaginatedResults
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
    `;

    request.input("offset", parseInt(offset));
    request.input("limit", parseInt(limit));
  } else {
    // Sin paginación, usar query normal
    if (orderByClause) {
      query += ` ${orderByClause}`;
    }
  }

  return query;
}

/**
 * Construye una consulta COUNT con filtros
 * @param {string} tableName - Nombre de la tabla
 * @param {Array} filters - Array de filtros
 * @param {Object} request - Objeto request de mssql
 * @returns {string} - Consulta COUNT
 */
function buildCountQuery(tableName, filters, request) {
  const whereClause = buildWhereClause(filters, request);

  let query = `SELECT COUNT(*) as count FROM [${tableName}]`;

  if (whereClause) {
    query += ` ${whereClause}`;
  }

  return query;
}

module.exports = {
  buildSelectQuery,
  buildCountQuery,
  buildWhereClause,
  buildOrderByClause,
  parseValueByType,
};
