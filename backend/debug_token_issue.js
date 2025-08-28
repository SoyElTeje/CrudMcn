const authService = require("./services/authService");

console.log("🔍 Debuggeando problema de token inválido...\n");

// Función para verificar un token específico
function verifySpecificToken(token) {
  console.log("🔑 Verificando token:", token.substring(0, 50) + "...");

  try {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      console.log("✅ Token válido");
      console.log("📋 Datos decodificados:", decoded);
      return true;
    } else {
      console.log("❌ Token inválido");
      return false;
    }
  } catch (error) {
    console.log("❌ Error verificando token:", error.message);
    return false;
  }
}

// Generar un token válido para comparar
console.log("🔧 Generando token válido para comparación...");
const validUser = {
  id: 1,
  username: "admin",
  isAdmin: true,
};
const validToken = authService.generateToken(validUser);
console.log("✅ Token válido generado:", validToken.substring(0, 50) + "...");

// Verificar el token válido
console.log("\n🔍 Verificando token válido...");
verifySpecificToken(validToken);

// Probar con diferentes tipos de tokens inválidos
console.log("\n🧪 Probando tokens inválidos...");

// Token vacío
console.log("\n1. Token vacío:");
verifySpecificToken("");

// Token malformado
console.log("\n2. Token malformado:");
verifySpecificToken("invalid.token.here");

// Token con formato correcto pero firma incorrecta
console.log("\n3. Token con formato correcto pero firma incorrecta:");
const malformedToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlzQWRtaW4iOnRydWV9.invalid_signature";
verifySpecificToken(malformedToken);

// Token expirado (simular)
console.log("\n4. Verificando configuración de JWT_SECRET...");
console.log("🔍 JWT_SECRET configurado:", process.env.JWT_SECRET ? "SÍ" : "NO");
console.log(
  "🔍 Valor de JWT_SECRET:",
  process.env.JWT_SECRET || "NO CONFIGURADO"
);

console.log("\n✅ Debug completado");
