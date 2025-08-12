const {
  parseDateDDMMYYYY,
  isValidDateDDMMYYYY,
  formatDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

console.log("=== Prueba de Utilidades de Fecha ===\n");

// Pruebas de parseDateDDMMYYYY
console.log("1. Pruebas de parseDateDDMMYYYY:");
console.log('   "31/10/2025" ->', parseDateDDMMYYYY("31/10/2025"));
console.log('   "01/01/2024" ->', parseDateDDMMYYYY("01/01/2024"));
console.log('   "32/10/2025" ->', parseDateDDMMYYYY("32/10/2025")); // Inválido
console.log('   "31/13/2025" ->', parseDateDDMMYYYY("31/13/2025")); // Inválido
console.log('   "10/31/2025" ->', parseDateDDMMYYYY("10/31/2025")); // Formato MM/DD
console.log('   "invalid" ->', parseDateDDMMYYYY("invalid"));
console.log("");

// Pruebas de isMMDDYYYYFormat
console.log("2. Pruebas de isMMDDYYYYFormat:");
console.log('   "10/31/2025" ->', isMMDDYYYYFormat("10/31/2025")); // MM/DD
console.log('   "31/10/2025" ->', isMMDDYYYYFormat("31/10/2025")); // DD/MM
console.log('   "12/25/2025" ->', isMMDDYYYYFormat("12/25/2025")); // MM/DD
console.log('   "25/12/2025" ->', isMMDDYYYYFormat("25/12/2025")); // DD/MM
console.log('   "01/01/2025" ->', isMMDDYYYYFormat("01/01/2025")); // Ambiguo
console.log("");

// Pruebas de convertToISODate
console.log("3. Pruebas de convertToISODate:");
console.log('   "31/10/2025" ->', convertToISODate("31/10/2025"));
console.log('   "01/01/2024" ->', convertToISODate("01/01/2024"));
console.log('   "10/31/2025" ->', convertToISODate("10/31/2025")); // Debería ser null
console.log('   "32/10/2025" ->', convertToISODate("32/10/2025")); // Debería ser null
console.log("");

// Pruebas de formatDateDDMMYYYY
console.log("4. Pruebas de formatDateDDMMYYYY:");
console.log("   Date object ->", formatDateDDMMYYYY(new Date(2025, 9, 31))); // 31/10/2025
console.log('   "2025-10-31" ->', formatDateDDMMYYYY("2025-10-31"));
console.log('   "31/10/2025" ->', formatDateDDMMYYYY("31/10/2025"));
console.log("");

// Pruebas de isValidDateDDMMYYYY
console.log("5. Pruebas de isValidDateDDMMYYYY:");
console.log('   "31/10/2025" ->', isValidDateDDMMYYYY("31/10/2025"));
console.log('   "10/31/2025" ->', isValidDateDDMMYYYY("10/31/2025"));
console.log('   "32/10/2025" ->', isValidDateDDMMYYYY("32/10/2025"));
console.log('   "invalid" ->', isValidDateDDMMYYYY("invalid"));
