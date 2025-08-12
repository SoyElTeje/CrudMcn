// Probar las funciones directamente
const dateUtils = require("./utils/dateUtils");

console.log("=== Prueba Directa ===\n");

// Probar isMMDDYYYYFormat
console.log("isMMDDYYYYFormat:");
console.log('  "31/10/2025" ->', dateUtils.isMMDDYYYYFormat("31/10/2025"));
console.log('  "01/01/2025" ->', dateUtils.isMMDDYYYYFormat("01/01/2025"));
console.log('  "10/31/2025" ->', dateUtils.isMMDDYYYYFormat("10/31/2025"));
console.log("");

// Probar parseDateDDMMYYYY
console.log("parseDateDDMMYYYY:");
console.log('  "31/10/2025" ->', dateUtils.parseDateDDMMYYYY("31/10/2025"));
console.log('  "01/01/2025" ->', dateUtils.parseDateDDMMYYYY("01/01/2025"));
console.log("");

// Probar convertToISODate
console.log("convertToISODate:");
console.log('  "31/10/2025" ->', dateUtils.convertToISODate("31/10/2025"));
console.log('  "01/01/2025" ->', dateUtils.convertToISODate("01/01/2025"));
console.log('  "10/31/2025" ->', dateUtils.convertToISODate("10/31/2025"));
