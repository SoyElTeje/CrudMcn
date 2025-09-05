/**
 * Utilidades para el manejo de fechas en formato DD/MM/AAAA
 */

/**
 * Formatea una fecha en formato DD/MM/AAAA
 * @param date - Fecha a formatear (string, Date, o null/undefined)
 * @returns Fecha formateada en DD/MM/AAAA o string vacío si no hay fecha
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      // Si es formato ISO (YYYY-MM-DD), parsearlo correctamente para evitar problemas de zona horaria
      const isoMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1; // Los meses van de 0 a 11
        const day = parseInt(isoMatch[3], 10);
        dateObj = new Date(year, month, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    // Formatear en DD/MM/AAAA usando UTC para evitar problemas de zona horaria
    const day = dateObj.getUTCDate().toString().padStart(2, "0");
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getUTCFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "";
  }
}

/**
 * Formatea una fecha y hora en formato DD/MM/AAAA HH:MM
 * @param date - Fecha a formatear (string, Date, o null/undefined)
 * @returns Fecha y hora formateada en DD/MM/AAAA HH:MM o string vacío si no hay fecha
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      // Si es formato ISO (YYYY-MM-DD), parsearlo correctamente para evitar problemas de zona horaria
      const isoMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1; // Los meses van de 0 a 11
        const day = parseInt(isoMatch[3], 10);
        dateObj = new Date(year, month, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    // Formatear en DD/MM/AAAA HH:MM
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formateando fecha y hora:", error);
    return "";
  }
}

/**
 * Formatea una fecha y hora completa en formato DD/MM/AAAA HH:MM:SS
 * @param date - Fecha a formatear (string, Date, o null/undefined)
 * @returns Fecha y hora completa formateada en DD/MM/AAAA HH:MM:SS o string vacío si no hay fecha
 */
export function formatFullDateTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    // Formatear en DD/MM/AAAA HH:MM:SS
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formateando fecha y hora completa:", error);
    return "";
  }
}

/**
 * Verifica si una fecha es válida
 * @param date - Fecha a verificar
 * @returns true si la fecha es válida, false en caso contrario
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
}
