console.log("Iniciando prueba...");

try {
  const dateUtils = require("./utils/dateUtils");
  console.log("✅ Módulo cargado correctamente");

  console.log("Probando convertToISODate:");
  console.log('  "01/01/2025" ->', dateUtils.convertToISODate("01/01/2025"));
  console.log('  "31/10/2025" ->', dateUtils.convertToISODate("31/10/2025"));
  console.log('  "10/31/2025" ->', dateUtils.convertToISODate("10/31/2025"));
} catch (error) {
  console.error("Error:", error.message);
}
