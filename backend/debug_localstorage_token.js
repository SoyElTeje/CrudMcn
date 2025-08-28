const axios = require("axios");

const BASE_URL = "http://localhost:3001";

console.log("🔍 Debuggeando problema del token del localStorage...\n");

async function debugLocalStorageToken() {
  try {
    // 1. Simular login y almacenamiento en localStorage
    console.log("🔐 Simulando login y almacenamiento...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    const originalToken = loginResponse.data.token;
    console.log("✅ Login exitoso");
    console.log("🔑 Token original:", originalToken.substring(0, 50) + "...");

    // 2. Simular que el token se almacena y recupera del localStorage
    // En el frontend real, esto podría causar problemas de codificación
    console.log("\n💾 Simulando localStorage...");

    // Simular diferentes escenarios de problemas con localStorage
    const scenarios = [
      {
        name: "Token normal",
        token: originalToken,
      },
      {
        name: "Token con espacios extra",
        token: " " + originalToken + " ",
      },
      {
        name: "Token con saltos de línea",
        token: originalToken + "\n",
      },
      {
        name: "Token truncado",
        token: originalToken.substring(0, originalToken.length - 10),
      },
      {
        name: "Token vacío",
        token: "",
      },
      {
        name: "Token null",
        token: null,
      },
    ];

    for (const scenario of scenarios) {
      console.log(`\n🧪 Probando escenario: ${scenario.name}`);
      console.log(
        `🔑 Token: ${
          scenario.token ? scenario.token.substring(0, 30) + "..." : "null"
        }`
      );

      try {
        if (!scenario.token) {
          console.log("❌ Token vacío o null");
          continue;
        }

        // Limpiar el token (como lo haría el frontend)
        const cleanToken = scenario.token.trim();

        if (!cleanToken) {
          console.log("❌ Token vacío después de limpiar");
          continue;
        }

        // Verificar el token
        const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        });

        if (verifyResponse.data.success) {
          console.log("✅ Token válido");

          // Intentar crear usuario
          const newUser = {
            username: `test_${scenario.name.replace(
              /\s+/g,
              "_"
            )}_${Date.now()}`,
            password: "testpass123",
            isAdmin: false,
          };

          const createResponse = await axios.post(
            `${BASE_URL}/api/auth/users`,
            newUser,
            {
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (createResponse.data.success) {
            console.log("✅ Usuario creado exitosamente");
          } else {
            console.log("❌ Error creando usuario:", createResponse.data);
          }
        } else {
          console.log("❌ Token inválido");
        }
      } catch (error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
      }
    }
  } catch (error) {
    console.log("❌ Error general:", error.message);
  }
}

debugLocalStorageToken();
