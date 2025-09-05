/**
 * Middleware de Manejo Global de Errores
 * Centraliza el manejo de errores en toda la aplicación
 */

const logger = require("../config/logger");

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Maneja errores de validación de base de datos
 */
const handleDatabaseError = (error) => {
  let message = "Error de base de datos";
  let statusCode = 500;

  // Errores específicos de SQL Server
  if (error.number) {
    switch (error.number) {
      case 2: // Timeout
        message = "Timeout de conexión a la base de datos";
        statusCode = 408;
        break;
      case 18456: // Login failed
        message = "Credenciales de base de datos inválidas";
        statusCode = 401;
        break;
      case 208: // Invalid object name
        message = "Tabla o vista no encontrada";
        statusCode = 404;
        break;
      case 515: // Cannot insert NULL
        message = "No se pueden insertar valores nulos en campos requeridos";
        statusCode = 400;
        break;
      case 2627: // Primary key violation
        message = "Ya existe un registro con ese identificador";
        statusCode = 409;
        break;
      case 547: // Foreign key constraint
        message = "Violación de restricción de clave foránea";
        statusCode = 400;
        break;
      default:
        message = `Error de base de datos: ${error.message}`;
    }
  }

  return new AppError(message, statusCode, "DATABASE_ERROR");
};

/**
 * Maneja errores de JWT
 */
const handleJWTError = () => {
  return new AppError(
    "Token inválido. Por favor, inicia sesión nuevamente.",
    401,
    "JWT_ERROR"
  );
};

const handleJWTExpiredError = () => {
  return new AppError(
    "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    401,
    "JWT_EXPIRED"
  );
};

/**
 * Maneja errores de validación de Joi
 */
const handleJoiValidationError = (error) => {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message
  }));
  
  const errorResponse = new AppError("Datos de entrada inválidos", 400, "VALIDATION_ERROR");
  errorResponse.errors = errors;
  return errorResponse;
};

/**
 * Maneja errores de validación
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((err) => err.message);
  const message = `Datos de entrada inválidos: ${errors.join(". ")}`;
  return new AppError(message, 400, "VALIDATION_ERROR");
};

/**
 * Maneja errores de archivos
 */
const handleFileError = (error) => {
  let message = "Error al procesar archivo";
  let statusCode = 400;

  if (error.code === "LIMIT_FILE_SIZE") {
    message = "El archivo es demasiado grande";
    statusCode = 413;
  } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Tipo de archivo no permitido";
    statusCode = 400;
  }

  return new AppError(message, statusCode, "FILE_ERROR");
};

/**
 * Envía respuesta de error en desarrollo
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    code: err.code,
    stack: err.stack,
  });
};

/**
 * Envía respuesta de error en producción
 */
const sendErrorProd = (err, res) => {
  // Errores operacionales: enviar mensaje al cliente
  if (err.isOperational) {
    const response = {
      status: err.status,
      message: err.message,
      code: err.code,
    };
    
    // Incluir errores específicos si existen
    if (err.errors) {
      response.errors = err.errors;
    }
    
    res.status(err.statusCode).json(response);
  } else {
    // Errores de programación: no enviar detalles
    logger.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Algo salió mal!",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log del error
  logger.error(`${err.statusCode} - ${err.message}`, {
    error: err,
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      user: req.user || null,
    },
  });

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Manejar diferentes tipos de errores
    if (error.number) error = handleDatabaseError(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.isJoi) error = handleJoiValidationError(error);
    if (error.name === "ValidationError") error = handleValidationError(error);
    if (error.code && error.code.startsWith("LIMIT_"))
      error = handleFileError(error);

    sendErrorProd(error, res);
  }
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFound = (req, res, next) => {
  const err = new AppError(
    `No se encontró ${req.originalUrl} en este servidor!`,
    404,
    "NOT_FOUND"
  );
  next(err);
};

/**
 * Wrapper para funciones async
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync,
  handleDatabaseError,
  handleJWTError,
  handleJWTExpiredError,
  handleValidationError,
  handleFileError,
};
