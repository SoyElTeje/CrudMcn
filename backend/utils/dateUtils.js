/**
 * Utilidades para el manejo de fechas en formato DD/MM/AAAA
 */

/**
 * Parsea una fecha en formato DD/MM/AAAA o DD/MM/AAAA HH:MM a un objeto Date
 * @param {string} dateString - Fecha en formato DD/MM/AAAA o DD/MM/AAAA HH:MM
 * @returns {Date|null} - Objeto Date o null si la fecha no es válida
 */
function parseDateDDMMYYYY(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  // Limpiar espacios y caracteres extra
  const cleanDate = dateString.trim();

  // Verificar formato DD/MM/AAAA HH:MM (datetime)
  const datetimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
  let match = cleanDate.match(datetimeRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Los meses en JavaScript van de 0 a 11
    const year = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);

    // Validar rangos
    if (
      day < 1 ||
      day > 31 ||
      month < 0 ||
      month > 11 ||
      year < 1900 ||
      year > 2100 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    // Crear la fecha con hora
    const date = new Date(year, month, day, hour, minute);

    // Verificar que la fecha sea válida
    if (
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }

    return date;
  }

  // Verificar formato DD/MM/AAAA (date)
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  match = cleanDate.match(dateRegex);

  if (!match) {
    return null;
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Los meses en JavaScript van de 0 a 11
  const year = parseInt(match[3], 10);

  // Validar rangos
  if (
    day < 1 ||
    day > 31 ||
    month < 0 ||
    month > 11 ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }

  // Crear la fecha
  const date = new Date(year, month, day);

  // Verificar que la fecha sea válida (por ejemplo, 31/02/2024 no es válida)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
}

/**
 * Valida si una fecha es válida en formato DD/MM/AAAA
 * @param {string} dateString - Fecha a validar
 * @returns {boolean} - true si la fecha es válida
 */
function isValidDateDDMMYYYY(dateString) {
  return parseDateDDMMYYYY(dateString) !== null;
}

/**
 * Convierte una fecha de cualquier formato a formato DD/MM/AAAA
 * @param {string|Date} date - Fecha a convertir
 * @returns {string} - Fecha en formato DD/MM/AAAA
 */
function formatDateDDMMYYYY(date) {
  if (!date) return "";

  try {
    let dateObj;

    if (typeof date === "string") {
      // Intentar parsear como DD/MM/AAAA primero
      dateObj = parseDateDDMMYYYY(date);

      if (!dateObj) {
        // Si no funciona, intentar con el formato estándar
        dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          return "";
        }
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return "";
    }

    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "";
  }
}

/**
 * Detecta si una fecha está en formato MM/DD/AAAA (formato estadounidense)
 * @param {string} dateString - Fecha a verificar
 * @returns {boolean} - true si está en formato MM/DD/AAAA
 */
function isMMDDYYYYFormat(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return false;
  }

  const cleanDate = dateString.trim();

  // Verificar formato MM/DD/AAAA HH:MM (datetime)
  const mmddDatetimeRegex =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
  let match = cleanDate.match(mmddDatetimeRegex);

  if (match) {
    const firstPart = parseInt(match[1], 10);
    const secondPart = parseInt(match[2], 10);

    // Lógica para detectar MM/DD/AAAA en datetime:
    // - Si el primer número es <= 12 y el segundo es > 12, es MM/DD/AAAA
    if (firstPart <= 12 && secondPart > 12) {
      return true; // Definitivamente MM/DD/AAAA
    }
    return false;
  }

  // Verificar formato MM/DD/AAAA (date)
  const mmddRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  match = cleanDate.match(mmddRegex);

  if (!match) {
    return false;
  }

  const firstPart = parseInt(match[1], 10);
  const secondPart = parseInt(match[2], 10);

  // Lógica mejorada para detectar MM/DD/AAAA:
  // - Si el primer número es <= 12 y el segundo es > 12, es MM/DD/AAAA
  // - Si ambos números son <= 12, es ambiguo, pero asumimos DD/MM/AAAA
  // - Si el primer número es > 12, es DD/MM/AAAA
  if (firstPart <= 12 && secondPart > 12) {
    return true; // Definitivamente MM/DD/AAAA
  }

  // Para casos ambiguos (como 01/01/2025), asumimos DD/MM/AAAA
  return false;
}

/**
 * Convierte una fecha en formato DD/MM/AAAA o DD/MM/AAAA HH:MM a formato ISO para la base de datos
 * @param {string} dateString - Fecha en formato DD/MM/AAAA o DD/MM/AAAA HH:MM
 * @returns {string} - Fecha en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS
 */
function convertToISODate(dateString) {
  // Rechazar formato MM/DD/AAAA
  if (isMMDDYYYYFormat(dateString)) {
    return null; // Indicar error
  }

  const date = parseDateDDMMYYYY(dateString);
  if (!date) return null; // Cambiar de "" a null para indicar error

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // Si la fecha original incluye hora y minutos, incluir en el resultado
  const datetimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
  const match = dateString.match(datetimeRegex);

  if (match) {
    // Es datetime, incluir hora y minutos
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  } else {
    // Es solo fecha
    return `${year}-${month}-${day}`;
  }
}

module.exports = {
  parseDateDDMMYYYY,
  isValidDateDDMMYYYY,
  formatDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
};
