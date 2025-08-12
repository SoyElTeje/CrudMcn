const {
  parseDateDDMMYYYY,
  convertToISODate,
  isMMDDYYYYFormat,
} = require("./utils/dateUtils");

console.log("=== Prueba de Función parseDateDDMMYYYY ===\n");

// Probar específicamente con 31/10/2025
const testDate = "31/10/2025";
console.log(`Probando fecha: "${testDate}"`);

// Analizar paso a paso
const cleanDate = testDate.trim();
const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const match = cleanDate.match(dateRegex);

if (match) {
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);

  console.log(`  day: ${day}`);
  console.log(`  month: ${month} (${parseInt(match[2], 10)})`);
  console.log(`  year: ${year}`);

  // Validar rangos
  const validRanges = {
    day: day >= 1 && day <= 31,
    month: month >= 0 && month <= 11,
    year: year >= 1900 && year <= 2100,
  };

  console.log(`  Validación de rangos:`);
  console.log(`    day (1-31): ${validRanges.day}`);
  console.log(`    month (0-11): ${validRanges.month}`);
  console.log(`    year (1900-2100): ${validRanges.year}`);

  if (validRanges.day && validRanges.month && validRanges.year) {
    // Crear la fecha
    const date = new Date(year, month, day);
    console.log(`  Fecha creada: ${date}`);
    console.log(`  date.getDate(): ${date.getDate()}`);
    console.log(`  date.getMonth(): ${date.getMonth()}`);
    console.log(`  date.getFullYear(): ${date.getFullYear()}`);

    // Verificar que la fecha sea válida
    const isValidDate =
      date.getDate() === day &&
      date.getMonth() === month &&
      date.getFullYear() === year;

    console.log(`  Fecha válida: ${isValidDate}`);
  }
}

console.log("\n=== Resultados de las funciones ===\n");
console.log(`parseDateDDMMYYYY("${testDate}"): ${parseDateDDMMYYYY(testDate)}`);
console.log(`convertToISODate("${testDate}"): ${convertToISODate(testDate)}`);
console.log(`isMMDDYYYYFormat("${testDate}"): ${isMMDDYYYYFormat(testDate)}`);

console.log("\n=== Pruebas adicionales ===\n");
const testDates = [
  "31/10/2025",
  "01/01/2025",
  "31/12/2025",
  "29/02/2024", // Año bisiesto
  "29/02/2025", // No es año bisiesto
  "32/10/2025", // Día inválido
];

testDates.forEach((dateStr) => {
  const parsed = parseDateDDMMYYYY(dateStr);
  const converted = convertToISODate(dateStr);
  console.log(`"${dateStr}": parsed=${parsed}, converted=${converted}`);
});
