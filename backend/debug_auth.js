require("dotenv").config();
const jwt = require("jsonwebtoken");

// Simular un token JWT para verificar su contenido
function debugToken() {
  try {
    console.log("🔍 Verificando configuración de autenticación...");

    // Verificar si existe JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    console.log("🔑 JWT_SECRET configurado:", jwtSecret ? "Sí" : "No");

    // Crear un token de prueba para admin
    const testPayload = {
      id: 1,
      username: "admin",
      isAdmin: true,
    };

    const testToken = jwt.sign(testPayload, jwtSecret, { expiresIn: "24h" });
    console.log(
      "🎫 Token de prueba creado:",
      testToken.substring(0, 50) + "..."
    );

    // Verificar el token
    const decoded = jwt.verify(testToken, jwtSecret);
    console.log("✅ Token decodificado correctamente:");
    console.log("  - ID:", decoded.id);
    console.log("  - Username:", decoded.username);
    console.log("  - isAdmin:", decoded.isAdmin);

    // Verificar si el middleware requireAdmin funcionaría
    if (decoded.isAdmin) {
      console.log("✅ El middleware requireAdmin permitiría el acceso");
    } else {
      console.log("❌ El middleware requireAdmin denegaría el acceso");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

debugToken();
