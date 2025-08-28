const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log("🧪 Simulando el problema específico del frontend...\n");

async function simulateFrontendIssue() {
  try {
    // 1. Simular login y obtener token (como lo hace el frontend)
    console.log("🔐 Simulando login...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    if (!loginResponse.data.success) {
      console.log("❌ Error en login:", loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso");
    console.log("🔑 Token obtenido:", token.substring(0, 50) + "...");

    // 2. Simular que el token se almacena en localStorage y se recupera
    console.log("\n💾 Simulando almacenamiento en localStorage...");
    const storedToken = token; // En el frontend esto vendría de localStorage
    console.log(
      "🔑 Token recuperado de localStorage:",
      storedToken.substring(0, 50) + "..."
    );

    // 3. Verificar que el token sigue siendo válido
    console.log("\n🔍 Verificando token recuperado...");
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (verifyResponse.data.success) {
      console.log("✅ Token verificado correctamente");
      console.log("👤 Usuario:", verifyResponse.data.user);
    } else {
      console.log("❌ Token inválido después de recuperarlo");
      return;
    }

    // 4. Intentar crear usuario con el token recuperado
    console.log("\n👤 Intentando crear usuario con token recuperado...");
    const newUser = {
      username: "test_user_" + Date.now(),
      password: "testpass123",
      isAdmin: false,
    };

    console.log("📝 Datos del usuario:", newUser);

    const createResponse = await axios.post(
      `${BASE_URL}/api/auth/users`,
      newUser,
      {
        headers: {
          Authorization: `Bearer ${storedToken}`,
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
    console.log("❌ Error en la simulación:", error.message);

    if (error.response) {
      console.log("📋 Status:", error.response.status);
      console.log("📋 Data:", error.response.data);

      // Mostrar headers específicos
      console.log(
        "📋 Authorization Header:",
        error.response.config?.headers?.Authorization
      );
      console.log(
        "📋 Content-Type Header:",
        error.response.config?.headers?.["Content-Type"]
      );
    }
  }
}

// Ejecutar la simulación
simulateFrontendIssue();
