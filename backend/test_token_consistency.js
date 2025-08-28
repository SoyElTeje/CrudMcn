const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log(
  "🧪 Probando consistencia de tokens entre instancias de axios...\n"
);

async function testTokenConsistency() {
  try {
    // 1. Login y obtener token
    console.log("🔐 Haciendo login...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso");
    console.log("🔑 Token:", token.substring(0, 50) + "...");

    // 2. Crear instancia de axios con interceptor (como App.tsx)
    console.log("\n🔧 Creando instancia con interceptor...");
    const apiWithInterceptor = axios.create({
      baseURL: BASE_URL,
    });

    apiWithInterceptor.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // 3. Crear instancia de axios con headers directos (como UserManagement original)
    console.log("🔧 Creando instancia con headers directos...");
    const apiWithHeaders = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 4. Probar ambas instancias
    console.log("\n🧪 Probando instancia con interceptor...");
    try {
      const response1 = await apiWithInterceptor.get("/api/auth/verify");
      console.log("✅ Interceptor funciona:", response1.data.success);
    } catch (error) {
      console.log("❌ Error con interceptor:", error.response?.data);
    }

    console.log("\n🧪 Probando instancia con headers directos...");
    try {
      const response2 = await apiWithHeaders.get("/api/auth/verify");
      console.log("✅ Headers directos funcionan:", response2.data.success);
    } catch (error) {
      console.log("❌ Error con headers directos:", error.response?.data);
    }

    // 5. Probar creación de usuario con ambas instancias
    console.log("\n👤 Probando creación de usuario con interceptor...");
    try {
      const newUser1 = {
        username: "test_interceptor_" + Date.now(),
        password: "testpass123",
        isAdmin: false,
      };
      const createResponse1 = await apiWithInterceptor.post(
        "/api/auth/users",
        newUser1
      );
      console.log(
        "✅ Usuario creado con interceptor:",
        createResponse1.data.success
      );
    } catch (error) {
      console.log(
        "❌ Error creando usuario con interceptor:",
        error.response?.data
      );
    }

    console.log("\n👤 Probando creación de usuario con headers directos...");
    try {
      const newUser2 = {
        username: "test_headers_" + Date.now(),
        password: "testpass123",
        isAdmin: false,
      };
      const createResponse2 = await apiWithHeaders.post(
        "/api/auth/users",
        newUser2
      );
      console.log(
        "✅ Usuario creado con headers directos:",
        createResponse2.data.success
      );
    } catch (error) {
      console.log(
        "❌ Error creando usuario con headers directos:",
        error.response?.data
      );
    }
  } catch (error) {
    console.log("❌ Error general:", error.message);
  }
}

testTokenConsistency();
