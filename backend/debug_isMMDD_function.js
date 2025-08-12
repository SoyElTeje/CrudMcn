const {
  isMMDDYYYYFormat,
  convertToISODate,
  parseDateDDMMYYYY,
} = require("./utils/dateUtils");

console.log("=== Debug de isMMDDYYYYFormat ===\n");

// Probar específicamente con 31/10/2025
const testDate = "31/10/2025";
console.log(`Probando fecha: "${testDate}"`);

// Analizar paso a paso
const cleanDate = testDate.trim();
const mmddRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const match = cleanDate.match(mmddRegex);

if (match) {
  const firstPart = parseInt(match[1], 10);
  const secondPart = parseInt(match[2], 10);

  console.log(`  firstPart: ${firstPart}`);
  console.log(`  secondPart: ${secondPart}`);
  console.log(`  firstPart <= 12: ${firstPart <= 12}`);
  console.log(`  secondPart > 12: ${secondPart > 12}`);
  console.log(`  Condición: ${firstPart <= 12 && secondPart > 12}`);
  console.log(`  isMMDDYYYYFormat: ${isMMDDYYYYFormat(testDate)}`);
}

console.log("\n=== Resultados completos ===\n");
console.log(`parseDateDDMMYYYY("${testDate}"): ${parseDateDDMMYYYY(testDate)}`);
console.log(`isMMDDYYYYFormat("${testDate}"): ${isMMDDYYYYFormat(testDate)}`);
console.log(`convertToISODate("${testDate}"): ${convertToISODate(testDate)}`);

console.log("\n=== Pruebas con otras fechas ===\n");
const testDates = [
  "31/10/2025", // DD/MM/AAAA - debería ser false
  "10/31/2025", // MM/DD/AAAA - debería ser true
  "01/01/2025", // Ambiguo - debería ser false
  "12/25/2025", // MM/DD/AAAA - debería ser true
  "25/12/2025", // DD/MM/AAAA - debería ser false
];

testDates.forEach((dateStr) => {
  const isMMDD = isMMDDYYYYFormat(dateStr);
  const converted = convertToISODate(dateStr);
  console.log(`"${dateStr}": isMMDD=${isMMDD}, converted=${converted}`);
});
