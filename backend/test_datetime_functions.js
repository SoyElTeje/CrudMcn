const {
  parseDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

console.log("=== Prueba de Funciones DateTime ===\n");

// Probar fechas y datetime
const testCases = [
  // Fechas válidas DD/MM/AAAA
  "31/10/2025",
  "01/01/2025",
  "25/12/2025",

  // DateTime válidos DD/MM/AAAA HH:MM
  "31/10/2025 14:30",
  "01/01/2025 09:15",
  "25/12/2025 23:59",

  // Formato MM/DD/AAAA (debería ser rechazado)
  "10/31/2025",
  "12/25/2025",

  // Formato MM/DD/AAAA HH:MM (debería ser rechazado)
  "10/31/2025 14:30",
  "12/25/2025 09:15",

  // Fechas inválidas
  "32/10/2025",
  "31/13/2025",
  "31/10/2025 25:30", // Hora inválida
  "31/10/2025 14:70", // Minuto inválido
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Probando: "${testCase}"`);
  console.log(`   parseDateDDMMYYYY: ${parseDateDDMMYYYY(testCase)}`);
  console.log(`   isMMDDYYYYFormat: ${isMMDDYYYYFormat(testCase)}`);
  console.log(`   convertToISODate: ${convertToISODate(testCase)}`);
});
