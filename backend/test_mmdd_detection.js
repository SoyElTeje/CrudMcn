const { isMMDDYYYYFormat, convertToISODate } = require('./utils/dateUtils');

console.log('=== Prueba de Detección MM/DD/AAAA ===\n');

const testDates = [
  '10/31/2025',  // MM/DD/AAAA - debería ser detectado como MM/DD
  '12/25/2025',  // MM/DD/AAAA - debería ser detectado como MM/DD
  '01/15/2025',  // MM/DD/AAAA - debería ser detectado como MM/DD
  '31/10/2025',  // DD/MM/AAAA - NO debería ser detectado como MM/DD
  '25/12/2025',  // DD/MM/AAAA - NO debería ser detectado como MM/DD
  '15/01/2025',  // DD/MM/AAAA - NO debería ser detectado como MM/DD
  '01/01/2025',  // Ambiguo - podría ser DD/MM o MM/DD
  '12/12/2025'   // Ambiguo - podría ser DD/MM o MM/DD
];

testDates.forEach(dateStr => {
  const isMMDD = isMMDDYYYYFormat(dateStr);
  const isoDate = convertToISODate(dateStr);
  
  console.log(`"${dateStr}":`);
  console.log(`  isMMDDYYYYFormat: ${isMMDD}`);
  console.log(`  convertToISODate: ${isoDate}`);
  console.log('');
});

// Análisis manual de la lógica
console.log('=== Análisis Manual ===\n');

const testDate = '10/31/2025';
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
