const { convertToISODate, isMMDDYYYYFormat } = require("./utils/dateUtils");

console.log("=== Prueba de Función Corregida ===\n");

const testDates = [
  "01/01/2025",
  "31/10/2025",
  "10/31/2025",
  "12/25/2025",
  "25/12/2025",
];

testDates.forEach((dateStr) => {
  console.log(`Probando: "${dateStr}"`);
  console.log(`  isMMDDYYYYFormat: ${isMMDDYYYYFormat(dateStr)}`);
  console.log(`  convertToISODate: ${convertToISODate(dateStr)}`);
  console.log("");
});
