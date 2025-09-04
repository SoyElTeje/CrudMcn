// Configuración de API para el frontend
const getApiBaseUrl = () => {
  // Si hay una variable de entorno específica, usarla (prioridad máxima)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Detectar si estamos en desarrollo local (localhost)
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('localhost');

  if (isLocalhost) {
    return "http://localhost:3001/api";
  }

  // En producción (acceso desde IP), usar la IP del servidor
  return "http://192.168.1.31:3001/api";
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

export default API_CONFIG;
