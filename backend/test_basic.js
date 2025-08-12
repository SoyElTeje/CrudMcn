console.log("=== Prueba Básica ===");

const {
  parseDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

// Probar una fecha simple
const testDate = "31/10/2025";
console.log(`Probando fecha: "${testDate}"`);

const parsed = parseDateDDMMYYYY(testDate);
console.log(`Resultado: ${parsed}`);

const converted = convertToISODate(testDate);
console.log(`Convertido: ${converted}`);

console.log("=== Fin de prueba ===");
