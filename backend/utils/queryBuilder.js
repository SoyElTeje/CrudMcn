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
    return "ORDER BY (SELECT NULL)";
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
async function buildSelectQuery(tableName, filters, sort, limit, offset, request) {
  const whereClause = buildWhereClause(filters, request);
  const orderByClause = buildOrderByClause(sort);

  // Obtener información de las columnas para identificar tipos de fecha
  const { getPool } = require('../db');
  const pool = await getPool();
  
  const columnInfoQuery = `
    SELECT 
      COLUMN_NAME,
      DATA_TYPE,
      IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = @tableName
    ORDER BY ORDINAL_POSITION
  `;
  
  const columnResult = await pool.request()
    .input('tableName', tableName)
    .query(columnInfoQuery);
  
  const columns = columnResult.recordset;
  
  // Construir la lista de columnas con formateo de fechas
  const columnList = columns.map(col => {
    const columnName = col.COLUMN_NAME;
    const dataType = col.DATA_TYPE.toLowerCase();
    
    // Si es una columna de fecha, formatearla directamente en SQL
    if (dataType.includes('date') || dataType.includes('datetime')) {
      if (dataType.includes('datetime') || dataType.includes('time')) {
        // Para datetime, incluir hora
        return `FORMAT([${columnName}], 'dd/MM/yyyy HH:mm:ss') as [${columnName}]`;
      } else {
        // Para date, solo fecha
        return `FORMAT([${columnName}], 'dd/MM/yyyy') as [${columnName}]`;
      }
    } else {
      // Para otros tipos, usar la columna tal como está
      return `[${columnName}]`;
    }
  }).join(', ');

  let query = `SELECT ${columnList} FROM [${tableName}]`;

  if (whereClause) {
    query += ` ${whereClause}`;
  }

  query += ` ${orderByClause}`;

  if (limit && offset !== undefined) {
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    request.input("offset", parseInt(offset));
    request.input("limit", parseInt(limit));
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
