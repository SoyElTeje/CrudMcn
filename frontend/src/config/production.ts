export const productionConfig = {
  // URL del backend en producción
  API_BASE_URL: process.env.VITE_API_BASE_URL || "http://192.168.168.209:3001",

  // Configuración de timeout para requests
  REQUEST_TIMEOUT: 30000,

  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,

  // Configuración de archivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [".xlsx", ".xls"],

  // Configuración de logs
  LOG_LEVEL: "error",

  // Configuración de autenticación
  TOKEN_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos

  // Configuración de UI
  AUTO_SAVE_INTERVAL: 30000, // 30 segundos
  CONFIRMATION_TIMEOUT: 5000, // 5 segundos
};
