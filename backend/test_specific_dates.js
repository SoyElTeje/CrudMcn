const {
  convertToISODate,
  isMMDDYYYYFormat,
  parseDateDDMMYYYY,
} = require("./utils/dateUtils");

console.log("=== Prueba de Fechas Específicas ===\n");

const testDates = [
  "01/01/2025",
  "31/10/2025",
  "10/31/2025",
  "25/12/2025",
  "12/25/2025",
];

testDates.forEach((dateStr) => {
  console.log(`Probando: "${dateStr}"`);
  console.log(`  isMMDDYYYYFormat: ${isMMDDYYYYFormat(dateStr)}`);
  console.log(`  parseDateDDMMYYYY: ${parseDateDDMMYYYY(dateStr)}`);
  console.log(`  convertToISODate: ${convertToISODate(dateStr)}`);
  console.log("");
});

// Probar la lógica de isMMDDYYYYFormat manualmente
console.log("=== Análisis Manual ===\n");

const testDate = "31/10/2025";
const match = testDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
if (match) {
  const firstPart = parseInt(match[1], 10);
  const secondPart = parseInt(match[2], 10);

  console.log(`Fecha: ${testDate}`);
  console.log(`  firstPart: ${firstPart}`);
  console.log(`  secondPart: ${secondPart}`);
  console.log(`  firstPart <= 12: ${firstPart <= 12}`);
  console.log(`  secondPart > 12: ${secondPart > 12}`);
  console.log(`  Condición: ${firstPart <= 12 && secondPart > 12}`);
  console.log(`  Resultado: ${isMMDDYYYYFormat(testDate)}`);
}
