const authService = require("./services/authService");

console.log("🧪 Probando generación y validación de tokens JWT...\n");

// Simular un usuario admin
const testUser = {
  id: 1,
  username: "admin",
  isAdmin: true,
};

console.log("👤 Usuario de prueba:", testUser);

// Generar token
console.log("🔑 Generando token...");
const token = authService.generateToken(testUser);
console.log("✅ Token generado:", token.substring(0, 50) + "...");

// Verificar token
console.log("\n🔍 Verificando token...");
const decoded = authService.verifyToken(token);
if (decoded) {
  console.log("✅ Token válido");
  console.log("📋 Datos decodificados:", decoded);
} else {
  console.log("❌ Token inválido");
}

// Probar con token inválido
console.log("\n🧪 Probando con token inválido...");
const invalidToken = "invalid.token.here";
const invalidDecoded = authService.verifyToken(invalidToken);
if (!invalidDecoded) {
  console.log("✅ Correctamente rechazó token inválido");
} else {
  console.log("❌ Error: Aceptó token inválido");
}

// Probar con token vacío
console.log("\n🧪 Probando con token vacío...");
const emptyDecoded = authService.verifyToken("");
if (!emptyDecoded) {
  console.log("✅ Correctamente rechazó token vacío");
} else {
  console.log("❌ Error: Aceptó token vacío");
}

console.log("\n✅ Pruebas completadas");
