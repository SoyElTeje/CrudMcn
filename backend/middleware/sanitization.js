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
  if (typeof str !== "string") {
    if (str === null || str === undefined) return "";
    return str;
  }

  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Eliminar scripts
    .replace(/[<>]/g, "") // Eliminar < y >
    .replace(/javascript:/gi, "") // Eliminar javascript:
    .replace(/on\w+=/gi, "") // Eliminar event handlers
    .replace(/['"]/g, "") // Eliminar comillas
    .replace(/;/g, "") // Eliminar punto y coma
    .replace(/--/g, "") // Eliminar comentarios SQL
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
    return "";
  }

  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "");

  if (sanitized.length === 0) {
    return "";
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
    return "";
  }

  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "");

  if (sanitized.length === 0) {
    return "";
  }

  return sanitized;
}

/**
 * Sanitiza valores de datos para base de datos
 * @param {any} value - Valor a sanitizar
 * @param {string} dataType - Tipo de dato esperado
 * @returns {any} - Valor sanitizado
 */
function sanitizeDataValue(value, dataType = "varchar") {
  if (value === null || value === undefined) return value;

  // Si es un array, sanitizar cada elemento
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDataValue(item, dataType));
  }

  // Si es un objeto, sanitizar recursivamente
  if (typeof value === "object") {
    return sanitizeObject(value);
  }

  // Si es número, mantenerlo como número
  if (typeof value === "number") {
    return value;
  }

  // Si es booleano, mantenerlo como booleano
  if (typeof value === "boolean") {
    return value;
  }

  // Para strings, aplicar sanitización
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  return value;
}

/**
 * Middleware específico para sanitizar datos de base de datos
 */
const sanitizeDatabaseData = (req, res, next) => {
  try {
    if (req.body && req.body.data) {
      req.body.data = sanitizeObject(req.body.data);
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
