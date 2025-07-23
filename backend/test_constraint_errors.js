const axios = require("axios");

const API_BASE_URL = "http://localhost:3001/api";
const TEST_DB = "BD_ABM1";
const TEST_TABLE = "Maquinas";

// Configurar axios con headers de autenticación
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Función para obtener token de autenticación
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: "admin",
      password: "admin",
    });
    return response.data.token;
  } catch (error) {
    console.error(
      "Error obteniendo token:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para probar errores de constraint
async function testConstraintErrors(token) {
  console.log("🧪 Probando manejo de errores de constraints...\n");

  // Configurar headers con token
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // Test 1: Error de constraint CHECK (TipoMaquina)
  console.log("1️⃣ Probando error de constraint CHECK (TipoMaquina)...");
  try {
    await api.post(`/databases/${TEST_DB}/tables/${TEST_TABLE}/records`, {
      record: {
        TipoMaquina: "invalido", // Valor que no cumple el CHECK constraint
        PesoMaquina: 100.5,
        Descripcion: "Test de constraint",
      },
    });
    console.log("❌ No se detectó el error de constraint CHECK");
  } catch (error) {
    if (error.response?.data?.errorType === "check_constraint_violation") {
      console.log("✅ Error de constraint CHECK detectado correctamente");
      console.log(`   Mensaje: ${error.response.data.error}`);
    } else {
      console.log(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
    }
  }

  // Test 2: Error de constraint CHECK (PesoMaquina)
  console.log("\n2️⃣ Probando error de constraint CHECK (PesoMaquina)...");
  try {
    await api.post(`/databases/${TEST_DB}/tables/${TEST_TABLE}/records`, {
      record: {
        TipoMaquina: "pequena",
        PesoMaquina: -10, // Valor negativo que no cumple el CHECK constraint
        Descripcion: "Test de constraint peso",
      },
    });
    console.log("❌ No se detectó el error de constraint CHECK");
  } catch (error) {
    if (error.response?.data?.errorType === "check_constraint_violation") {
      console.log("✅ Error de constraint CHECK detectado correctamente");
      console.log(`   Mensaje: ${error.response.data.error}`);
    } else {
      console.log(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
    }
  }

  // Test 3: Error de NOT NULL
  console.log("\n3️⃣ Probando error de NOT NULL...");
  try {
    await api.post(`/databases/${TEST_DB}/tables/${TEST_TABLE}/records`, {
      record: {
        TipoMaquina: null, // Valor NULL en campo requerido
        PesoMaquina: 100.5,
        Descripcion: "Test de NOT NULL",
      },
    });
    console.log("❌ No se detectó el error de NOT NULL");
  } catch (error) {
    if (error.response?.data?.errorType === "null_violation") {
      console.log("✅ Error de NOT NULL detectado correctamente");
      console.log(`   Mensaje: ${error.response.data.error}`);
    } else {
      console.log(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
    }
  }

  // Test 4: Error de tipo de dato
  console.log("\n4️⃣ Probando error de tipo de dato...");
  try {
    await api.post(`/databases/${TEST_DB}/tables/${TEST_TABLE}/records`, {
      record: {
        TipoMaquina: "pequena",
        PesoMaquina: "no_es_numero", // String en lugar de número
        Descripcion: "Test de tipo de dato",
      },
    });
    console.log("❌ No se detectó el error de tipo de dato");
  } catch (error) {
    if (error.response?.data?.errorType === "data_type_violation") {
      console.log("✅ Error de tipo de dato detectado correctamente");
      console.log(`   Mensaje: ${error.response.data.error}`);
    } else {
      console.log(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
    }
  }

  // Test 5: Error de longitud (si aplica)
  console.log("\n5️⃣ Probando error de longitud...");
  try {
    await api.post(`/databases/${TEST_DB}/tables/${TEST_TABLE}/records`, {
      record: {
        TipoMaquina: "pequena",
        PesoMaquina: 100.5,
        Descripcion: "A".repeat(300), // String muy largo que excede el límite
      },
    });
    console.log("❌ No se detectó el error de longitud");
  } catch (error) {
    if (error.response?.data?.errorType === "length_violation") {
      console.log("✅ Error de longitud detectado correctamente");
      console.log(`   Mensaje: ${error.response.data.error}`);
    } else {
      console.log(
        "❌ Error inesperado:",
        error.response?.data || error.message
      );
    }
  }

  // Test 6: Inserción exitosa para comparar
  console.log("\n6️⃣ Probando inserción exitosa...");
  try {
    const response = await api.post(
      `/databases/${TEST_DB}/tables/${TEST_TABLE}/records`,
      {
        record: {
          TipoMaquina: "pequena",
          PesoMaquina: 150.75,
          Descripcion: "Test de inserción exitosa",
        },
      }
    );
    console.log("✅ Inserción exitosa");
    console.log(`   Mensaje: ${response.data.message}`);
  } catch (error) {
    console.log(
      "❌ Error en inserción que debería ser exitosa:",
      error.response?.data || error.message
    );
  }
}

// Función principal
async function main() {
  try {
    console.log(
      "🚀 Iniciando pruebas de manejo de errores de constraints...\n"
    );

    // Obtener token de autenticación
    console.log("🔑 Obteniendo token de autenticación...");
    const token = await getAuthToken();
    console.log("✅ Token obtenido correctamente\n");

    // Ejecutar pruebas
    await testConstraintErrors(token);

    console.log("\n🎉 Pruebas completadas");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);
    process.exit(1);
  }
}

// Ejecutar si el script se llama directamente
if (require.main === module) {
  main();
}

module.exports = { testConstraintErrors };
