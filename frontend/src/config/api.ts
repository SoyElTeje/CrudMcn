// Configuración de API para el frontend
const getApiBaseUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return "http://localhost:3001/api";
  }

  // En producción, usar la variable de entorno o fallback
  return import.meta.env.VITE_API_BASE_URL || "http://192.168.1.31:3001/api";
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

export default API_CONFIG;
