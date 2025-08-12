const { isMMDDYYYYFormat, convertToISODate } = require("./utils/dateUtils");

console.log("=== Debug de Función isMMDDYYYYFormat ===\n");

// Probar la función manualmente
const testDate = "10/31/2025";
console.log(`Probando fecha: "${testDate}"`);

// Analizar manualmente
const match = testDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
if (match) {
  const firstPart = parseInt(match[1], 10);
  const secondPart = parseInt(match[2], 10);

  console.log(`  firstPart: ${firstPart}`);
  console.log(`  secondPart: ${secondPart}`);
  console.log(`  firstPart <= 12: ${firstPart <= 12}`);
  console.log(`  secondPart > 12: ${secondPart > 12}`);
  console.log(`  Condición: ${firstPart <= 12 && secondPart > 12}`);
  console.log(`  isMMDDYYYYFormat: ${isMMDDYYYYFormat(testDate)}`);
  console.log(`  convertToISODate: ${convertToISODate(testDate)}`);
} else {
  console.log("  No coincide con el patrón");
}

console.log("\n=== Pruebas Adicionales ===\n");

const testDates = [
  "10/31/2025", // MM/DD/AAAA - debería ser true
  "31/10/2025", // DD/MM/AAAA - debería ser false
  "12/25/2025", // MM/DD/AAAA - debería ser true
  "25/12/2025", // DD/MM/AAAA - debería ser false
  "01/01/2025", // Ambiguo - debería ser false
];

testDates.forEach((dateStr) => {
  console.log(`"${dateStr}":`);
  console.log(`  isMMDDYYYYFormat: ${isMMDDYYYYFormat(dateStr)}`);
  console.log(`  convertToISODate: ${convertToISODate(dateStr)}`);
  console.log("");
});
