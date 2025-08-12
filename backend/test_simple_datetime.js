const {
  parseDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

console.log("=== Prueba Simple DateTime ===\n");

// Probar una fecha datetime específica
const testDate = "31/10/2025 14:30";
console.log(`Probando: "${testDate}"`);

const parsed = parseDateDDMMYYYY(testDate);
const isMMDD = isMMDDYYYYFormat(testDate);
const converted = convertToISODate(testDate);

console.log(`parseDateDDMMYYYY: ${parsed}`);
console.log(`isMMDDYYYYFormat: ${isMMDD}`);
console.log(`convertToISODate: ${converted}`);

// Probar una fecha normal
const testDate2 = "31/10/2025";
console.log(`\nProbando: "${testDate2}"`);

const parsed2 = parseDateDDMMYYYY(testDate2);
const isMMDD2 = isMMDDYYYYFormat(testDate2);
const converted2 = convertToISODate(testDate2);

console.log(`parseDateDDMMYYYY: ${parsed2}`);
console.log(`isMMDDYYYYFormat: ${isMMDD2}`);
console.log(`convertToISODate: ${converted2}`);
