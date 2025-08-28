const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log("🧪 Probando endpoint de creación de usuarios...\n");

async function testUserCreation() {
  try {
    // 1. Hacer login como admin
    console.log("🔐 Haciendo login como admin...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    if (!loginResponse.data.success) {
      console.log("❌ Error en login:", loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log("✅ Login exitoso");
    console.log("👤 Usuario:", user);
    console.log("🔑 Token:", token.substring(0, 50) + "...");

    // 2. Verificar token
    console.log("\n🔍 Verificando token...");
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (verifyResponse.data.success) {
      console.log("✅ Token verificado correctamente");
      console.log("👤 Usuario verificado:", verifyResponse.data.user);
    } else {
      console.log("❌ Error verificando token:", verifyResponse.data);
      return;
    }

    // 3. Intentar crear un usuario
    console.log("\n👤 Intentando crear usuario...");
    const newUser = {
      username: "testuser_" + Date.now(),
      password: "testpass123",
      isAdmin: false,
    };

    console.log("📝 Datos del nuevo usuario:", newUser);

    const createResponse = await axios.post(
      `${BASE_URL}/api/auth/users`,
      newUser,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (createResponse.data.success) {
      console.log("✅ Usuario creado exitosamente");
      console.log("👤 Usuario creado:", createResponse.data.user);
    } else {
      console.log("❌ Error creando usuario:", createResponse.data);
    }
  } catch (error) {
    console.log("❌ Error en la prueba:", error.message);

    if (error.response) {
      console.log("📋 Status:", error.response.status);
      console.log("📋 Data:", error.response.data);
      console.log("📋 Headers:", error.response.headers);
    }
  }
}

// Ejecutar la prueba
testUserCreation();
