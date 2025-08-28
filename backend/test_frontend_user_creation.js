const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log("🧪 Simulando creación de usuario desde frontend...\n");

async function testFrontendUserCreation() {
  try {
    // 1. Simular login como admin (como lo hace el frontend)
    console.log("🔐 Simulando login como admin...");
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

    // 2. Crear instancia de axios con token en headers (como lo hace UserManagement)
    console.log("\n🔧 Creando instancia de axios con token...");
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 3. Intentar crear usuario usando la instancia de axios
    console.log("\n👤 Intentando crear usuario con instancia de axios...");
    const newUser = {
      username: "frontend_user_" + Date.now(),
      password: "testpass123",
      isAdmin: false,
    };

    console.log("📝 Datos del nuevo usuario:", newUser);

    const createResponse = await api.post("/api/auth/users", newUser);

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
      console.log(
        "📋 Headers:",
        JSON.stringify(error.response.headers, null, 2)
      );
    }
  }
}

// Ejecutar la prueba
testFrontendUserCreation();
