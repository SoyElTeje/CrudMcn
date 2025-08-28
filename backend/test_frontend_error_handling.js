const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log("🧪 Probando manejo de errores desde el frontend...\n");

async function testFrontendErrorHandling() {
  try {
    // 1. Simular login como admin
    console.log("🔐 Simulando login como admin...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso");

    // 2. Crear un usuario de prueba
    console.log("\n👤 Creando usuario de prueba...");
    const testUser = {
      username: "test_frontend_error",
      password: "testpass123",
      isAdmin: false,
    };

    const createResponse1 = await axios.post(
      `${BASE_URL}/api/auth/users`,
      testUser,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (createResponse1.data.success) {
      console.log("✅ Usuario creado exitosamente");
    }

    // 3. Simular el frontend intentando crear el mismo usuario
    console.log(
      "\n🔄 Simulando frontend intentando crear usuario duplicado..."
    );
    try {
      const createResponse2 = await axios.post(
        `${BASE_URL}/api/auth/users`,
        testUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("❌ Error: Se creó el usuario duplicado");
    } catch (error) {
      if (error.response) {
        console.log("✅ Error manejado correctamente por el frontend");
        console.log("📋 Status:", error.response.status);
        console.log("📋 Data:", error.response.data);

        // Simular cómo el frontend manejaría este error
        const errorMessage =
          error.response?.data?.error || "Error creando usuario";
        console.log("📋 Mensaje que vería el usuario:", errorMessage);

        if (
          error.response.status === 400 &&
          error.response.data.error === "El nombre de usuario ya existe"
        ) {
          console.log("✅ El frontend recibiría el mensaje correcto");
        } else {
          console.log("❌ El frontend recibiría un mensaje incorrecto");
        }
      } else {
        console.log("❌ Error no manejado correctamente:", error.message);
      }
    }
  } catch (error) {
    console.log("❌ Error general:", error.message);
  }
}

// Ejecutar la prueba
testFrontendErrorHandling();
