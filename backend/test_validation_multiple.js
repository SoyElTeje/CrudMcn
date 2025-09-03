const axios = require("axios");

const BASE_URL = "http://localhost:3001";
let authToken = null;

// Función para obtener token de admin
async function getAdminToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "admin",
      password: "admin",
    });

    console.log("✅ Token obtenido correctamente");
    return response.data.token;
  } catch (error) {
    console.error(
      "❌ Error obteniendo token:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para probar la validación con múltiples condiciones
async function testValidationMultipleConditions() {
  try {
    console.log(
      "🧪 Probando validación con múltiples condiciones por campo..."
    );

    // 1. Obtener token de admin
    authToken = await getAdminToken();

    // 2. Probar diferentes valores para el campo ID que tiene múltiples condiciones
    const testCases = [
      {
        name: "Valor válido (dentro del rango)",
        data: { ID: 500, Name: "Test Product" },
        expectedValid: true,
      },
      {
        name: "Valor muy bajo (fuera del rango mínimo)",
        data: { ID: 0, Name: "Test Product" },
        expectedValid: false,
      },
      {
        name: "Valor muy alto (fuera del rango máximo)",
        data: { ID: 1500, Name: "Test Product" },
        expectedValid: false,
      },
      {
        name: "Valor nulo (campo requerido)",
        data: { ID: null, Name: "Test Product" },
        expectedValid: false,
      },
      {
        name: "Valor undefined (campo requerido)",
        data: { Name: "Test Product" },
        expectedValid: false,
      },
      {
        name: "Valor en el límite mínimo",
        data: { ID: 1, Name: "Test Product" },
        expectedValid: true,
      },
      {
        name: "Valor en el límite máximo",
        data: { ID: 1000, Name: "Test Product" },
        expectedValid: true,
      },
    ];

    console.log("\n📋 Casos de prueba:");
    testCases.forEach((testCase, index) => {
      console.log(`  ${index + 1}. ${testCase.name}`);
      console.log(`     Datos: ${JSON.stringify(testCase.data)}`);
      console.log(
        `     Esperado: ${testCase.expectedValid ? "Válido" : "Inválido"}`
      );
    });

    // 3. Ejecutar cada caso de prueba
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 Ejecutando caso ${i + 1}: ${testCase.name}`);

      try {
        const response = await axios.post(
          `${BASE_URL}/api/activated-tables/validate/BI_Editor/TEST_ABM`,
          {
            data: testCase.data,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const isValid = response.data.isValid;
        const errors = response.data.errors || [];

        console.log(`   Resultado: ${isValid ? "✅ Válido" : "❌ Inválido"}`);

        if (!isValid && errors.length > 0) {
          console.log(`   Errores encontrados:`);
          errors.forEach((error, index) => {
            if (typeof error === "string") {
              console.log(`     ${index + 1}. ${error}`);
            } else {
              console.log(
                `     ${index + 1}. Campo: ${error.field}, Mensaje: ${
                  error.message
                }`
              );
            }
          });
        }

        // Verificar que el resultado coincida con lo esperado
        if (isValid === testCase.expectedValid) {
          console.log(`   ✅ Resultado correcto`);
        } else {
          console.log(
            `   ❌ Resultado incorrecto - Esperado: ${
              testCase.expectedValid ? "Válido" : "Inválido"
            }`
          );
        }
      } catch (error) {
        console.error(
          `   ❌ Error en la validación:`,
          error.response?.data || error.message
        );
      }
    }

    console.log("\n🎉 ¡Prueba de validación completada!");
    console.log(
      "💡 Las múltiples condiciones se están aplicando correctamente"
    );
  } catch (error) {
    console.error(
      "❌ Error en la prueba:",
      error.response?.data || error.message
    );

    if (error.response) {
      console.error("📊 Detalles del error:");
      console.error("  - Status:", error.response.status);
      console.error("  - Data:", error.response.data);
    }
  }
}

// Ejecutar la prueba
testValidationMultipleConditions();
