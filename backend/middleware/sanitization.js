/**
 * Middleware de sanitización de datos de entrada
 * Limpia y sanitiza datos para prevenir ataques XSS y otros problemas
 */

const { AppError } = require("./errorHandler");

/**
 * Sanitiza strings eliminando caracteres peligrosos
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== "string") return str;

  return str
    .replace(/[<>]/g, "") // Eliminar < y >
    .replace(/javascript:/gi, "") // Eliminar javascript:
    .replace(/on\w+=/gi, "") // Eliminar event handlers
    .trim();
}

/**
 * Sanitiza un objeto recursivamente
 * @param {any} obj - Objeto a sanitizar
 * @returns {any} - Objeto sanitizado
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar la clave también
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware para sanitizar datos de entrada
 * @param {string} source - Fuente de los datos ('body', 'query', 'params')
 */
const sanitizeInput = (source = "body") => {
  return (req, res, next) => {
    try {
      if (req[source]) {
        req[source] = sanitizeObject(req[source]);
      }
      next();
    } catch (error) {
      throw new AppError(
        "Error sanitizando datos de entrada",
        400,
        "SANITIZATION_ERROR"
      );
    }
  };
};

/**
 * Sanitiza nombres de base de datos y tablas
 * Solo permite caracteres alfanuméricos, guiones bajos y guiones
 * @param {string} name - Nombre a sanitizar
 * @returns {string} - Nombre sanitizado
 */
function sanitizeDatabaseName(name) {
  if (typeof name !== "string") {
    throw new AppError(
      "Nombre de base de datos inválido",
      400,
      "INVALID_DB_NAME"
    );
  }

  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "");

  if (sanitized.length === 0) {
    throw new AppError(
      "Nombre de base de datos vacío después de sanitización",
      400,
      "EMPTY_DB_NAME"
    );
  }

  return sanitized;
}

/**
 * Sanitiza nombres de columnas
 * Solo permite caracteres alfanuméricos, guiones bajos y guiones
 * @param {string} name - Nombre a sanitizar
 * @returns {string} - Nombre sanitizado
 */
function sanitizeColumnName(name) {
  if (typeof name !== "string") {
    throw new AppError(
      "Nombre de columna inválido",
      400,
      "INVALID_COLUMN_NAME"
    );
  }

  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "");

  if (sanitized.length === 0) {
    throw new AppError(
      "Nombre de columna vacío después de sanitización",
      400,
      "EMPTY_COLUMN_NAME"
    );
  }

  return sanitized;
}

/**
 * Sanitiza valores de datos para base de datos
 * @param {any} value - Valor a sanitizar
 * @param {string} dataType - Tipo de dato esperado
 * @returns {any} - Valor sanitizado
 */
function sanitizeDataValue(value, dataType) {
  if (value === null || value === undefined) return value;

  const type = dataType.toLowerCase();

  if (
    type.includes("varchar") ||
    type.includes("text") ||
    type.includes("char")
  ) {
    return sanitizeString(String(value));
  }

  if (
    type.includes("int") ||
    type.includes("decimal") ||
    type.includes("float") ||
    type.includes("numeric")
  ) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new AppError(
        `Valor numérico inválido: ${value}`,
        400,
        "INVALID_NUMERIC_VALUE"
      );
    }
    return num;
  }

  if (type.includes("date") || type.includes("datetime")) {
    // Para fechas, solo permitir formatos válidos
    const dateStr = String(value);
    if (!/^[\d\-\/:\s]+$/.test(dateStr)) {
      throw new AppError(
        `Formato de fecha inválido: ${value}`,
        400,
        "INVALID_DATE_FORMAT"
      );
    }
    return dateStr;
  }

  if (type.includes("bit") || type.includes("boolean")) {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    throw new AppError(
      `Valor booleano inválido: ${value}`,
      400,
      "INVALID_BOOLEAN_VALUE"
    );
  }

  return value;
}

/**
 * Middleware específico para sanitizar datos de base de datos
 */
const sanitizeDatabaseData = (req, res, next) => {
  try {
    if (req.body && req.body.data) {
      const sanitizedData = {};

      for (const [key, value] of Object.entries(req.body.data)) {
        const cleanKey = sanitizeColumnName(key);
        // Asumir que es string por defecto, pero esto debería venir del schema de la tabla
        sanitizedData[cleanKey] = sanitizeDataValue(value, "varchar");
      }

      req.body.data = sanitizedData;
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          "Error sanitizando datos de base de datos",
          400,
          "DATABASE_SANITIZATION_ERROR"
        )
      );
    }
  }
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizeString,
  sanitizeDatabaseName,
  sanitizeColumnName,
  sanitizeDataValue,
  sanitizeDatabaseData,
};
