const {
  parseDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

console.log("=== Prueba de Validación del Backend ===\n");

// Probar la fecha problemática
const testDate = "31/10/2025";
console.log(`Probando fecha: "${testDate}"`);

console.log("1. parseDateDDMMYYYY:", parseDateDDMMYYYY(testDate));
console.log("2. isMMDDYYYYFormat:", isMMDDYYYYFormat(testDate));
console.log("3. convertToISODate:", convertToISODate(testDate));

// Probar con una fecha que sabemos que funciona
const workingDate = "01/01/2025";
console.log(`\nProbando fecha que funciona: "${workingDate}"`);
console.log("1. parseDateDDMMYYYY:", parseDateDDMMYYYY(workingDate));
console.log("2. isMMDDYYYYFormat:", isMMDDYYYYFormat(workingDate));
console.log("3. convertToISODate:", convertToISODate(workingDate));

// Probar con formato MM/DD/AAAA (debería fallar)
const mmddDate = "10/31/2025";
console.log(`\nProbando formato MM/DD/AAAA: "${mmddDate}"`);
console.log("1. parseDateDDMMYYYY:", parseDateDDMMYYYY(mmddDate));
console.log("2. isMMDDYYYYFormat:", isMMDDYYYYFormat(mmddDate));
console.log("3. convertToISODate:", convertToISODate(mmddDate));
