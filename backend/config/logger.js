/**
 * Configuración centralizada de logging con Winston
 */

const winston = require("winston");
const path = require("path");

// Crear directorio de logs si no existe
const logDir = path.join(__dirname, "../../logs");
require("fs").mkdirSync(logDir, { recursive: true });

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = "";
    if (Object.keys(meta).length > 0) {
      metaStr = "\n" + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Configuración del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "abmmcn-backend",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    // Archivo para todos los logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Archivo solo para errores
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],

  // Manejo de excepciones no capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
    }),
  ],

  // Manejo de rechazos de promesas no manejados
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
    }),
  ],
});

// En desarrollo, también mostrar en consola
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Métodos de logging específicos para la aplicación
logger.auth = (message, meta = {}) => {
  logger.info(`[AUTH] ${message}`, { ...meta, category: "authentication" });
};

logger.database = (message, meta = {}) => {
  logger.info(`[DB] ${message}`, { ...meta, category: "database" });
};

logger.crud = (operation, table, meta = {}) => {
  logger.info(`[CRUD] ${operation.toUpperCase()} on ${table}`, {
    ...meta,
    category: "crud",
    operation,
    table,
  });
};

logger.security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, { ...meta, category: "security" });
};

logger.performance = (message, duration, meta = {}) => {
  logger.info(`[PERF] ${message}`, {
    ...meta,
    category: "performance",
    duration: `${duration}ms`,
  });
};

logger.api = (method, url, statusCode, duration, meta = {}) => {
  const level = statusCode >= 400 ? "warn" : "info";
  logger[level](`[API] ${method} ${url} - ${statusCode}`, {
    ...meta,
    category: "api",
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
};

module.exports = logger;
