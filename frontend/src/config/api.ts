/**
 * Configuración centralizada de la API
 * Valida que VITE_API_BASE_URL esté configurado en las variables de entorno
 */

const getApiBaseUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiBaseUrl || apiBaseUrl.trim() === "") {
    throw new Error(
      "VITE_API_BASE_URL debe estar configurado en las variables de entorno (.env). " +
      "Esta variable indica la URL base del backend API."
    );
  }

  return apiBaseUrl.trim();
};

// Exportar la URL base de la API (validada)
export const API_BASE_URL = getApiBaseUrl();

