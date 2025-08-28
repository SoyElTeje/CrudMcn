const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log("🧪 Probando manejo de errores corregido...\n");

async function testErrorHandling() {
  try {
    // 1. Hacer login como admin
    console.log("🔐 Haciendo login como admin...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso");

    // 2. Crear un usuario de prueba
    console.log("\n👤 Creando usuario de prueba...");
    const testUser = {
      username: "test_error_handling",
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

    // 3. Intentar crear el mismo usuario nuevamente
    console.log("\n🔄 Intentando crear el mismo usuario nuevamente...");
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
        console.log("✅ Error manejado correctamente");
        console.log("📋 Status:", error.response.status);
        console.log("📋 Data:", error.response.data);

        if (
          error.response.status === 400 &&
          error.response.data.error === "El nombre de usuario ya existe"
        ) {
          console.log("✅ Mensaje de error correcto recibido");
        } else {
          console.log("❌ Mensaje de error incorrecto");
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
testErrorHandling();
