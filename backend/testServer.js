const axios = require("axios");

async function testServer() {
  try {
    console.log("🔍 Probando conexión al servidor backend...");

    // Probar el endpoint de health check
    const healthResponse = await axios.get("http://localhost:3001/api/health");
    console.log("✅ Health check exitoso:", healthResponse.data);

    // Probar el endpoint de bases de datos (sin autenticación para ver si responde)
    try {
      const dbResponse = await axios.get("http://localhost:3001/api/databases");
      console.log("✅ Endpoint de bases de datos responde:", dbResponse.status);
    } catch (dbError) {
      if (dbError.response?.status === 401) {
        console.log(
          "✅ Endpoint de bases de datos requiere autenticación (correcto)"
        );
      } else {
        console.log("⚠️ Endpoint de bases de datos:", dbError.message);
      }
    }

    console.log("🎉 Servidor backend está funcionando correctamente!");
  } catch (error) {
    console.error("❌ Error conectando al servidor:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        "💡 El servidor backend no está ejecutándose en el puerto 3001"
      );
      console.error("💡 Ejecuta: cd backend && npm start");
    } else if (error.code === "ENOTFOUND") {
      console.error("💡 No se puede resolver localhost");
    } else {
      console.error("💡 Error desconocido:", error.code);
    }
  }
}

// Ejecutar la prueba
testServer();
