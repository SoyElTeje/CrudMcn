const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log(
  "🧪 Simulando el problema específico del token en el frontend...\n"
);

async function simulateFrontendTokenIssue() {
  try {
    // 1. Simular login (como lo hace el frontend)
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
    const user = loginResponse.data.user;
    console.log("✅ Login exitoso");
    console.log("👤 Usuario:", user);
    console.log("🔑 Token:", token.substring(0, 50) + "...");

    // 2. Simular almacenamiento en localStorage (como lo hace handleLogin)
    console.log("\n💾 Simulando almacenamiento en localStorage...");
    const storedToken = token; // En el frontend: localStorage.setItem("token", token)
    const storedUser = JSON.stringify(user); // En el frontend: localStorage.setItem("user", JSON.stringify(user))

    console.log("🔑 Token almacenado:", storedToken.substring(0, 50) + "...");
    console.log("👤 Usuario almacenado:", storedUser);

    // 3. Simular recuperación del localStorage (como lo hace el useEffect)
    console.log("\n📥 Simulando recuperación del localStorage...");
    const retrievedToken = storedToken; // En el frontend: localStorage.getItem("token")
    const retrievedUser = JSON.parse(storedUser); // En el frontend: JSON.parse(localStorage.getItem("user"))

    console.log(
      "🔑 Token recuperado:",
      retrievedToken.substring(0, 50) + "..."
    );
    console.log("👤 Usuario recuperado:", retrievedUser);

    // 4. Verificar que el token sigue siendo válido
    console.log("\n🔍 Verificando token recuperado...");
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${retrievedToken}`,
      },
    });

    if (verifyResponse.data.success) {
      console.log("✅ Token verificado correctamente");
      console.log("👤 Usuario verificado:", verifyResponse.data.user);
    } else {
      console.log("❌ Token inválido después de recuperarlo");
      return;
    }

    // 5. Simular la creación de la instancia de axios (como lo hace UserManagement)
    console.log("\n🔧 Simulando creación de instancia de axios...");
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${retrievedToken}`,
      },
    });

    // 6. Intentar crear usuario
    console.log("\n👤 Intentando crear usuario...");
    const newUser = {
      username: "test_frontend_" + Date.now(),
      password: "testpass123",
      isAdmin: false,
    };

    console.log("📝 Datos del usuario:", newUser);

    const createResponse = await api.post("/api/auth/users", newUser);

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
      console.log(
        "📋 Headers:",
        JSON.stringify(error.response.headers, null, 2)
      );
    }
  }
}

// Ejecutar la simulación
simulateFrontendTokenIssue();
