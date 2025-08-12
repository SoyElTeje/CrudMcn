const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
let authToken = "";

// Función para hacer login
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: "user",
      password: "user",
    });

    authToken = response.data.token;
    console.log("✅ Login exitoso");
    return authToken;
  } catch (error) {
    console.error("❌ Error en login:", error.response?.data || error.message);
    throw error;
  }
}

// Función para verificar permisos de usuario
async function checkUserPermissions() {
  try {
    console.log("📋 Verificando permisos del usuario...");
    console.log("Usuario ID:", "user");
    console.log("Token válido:", !!authToken);
    return true;
  } catch (error) {
    console.error("❌ Error verificando permisos:", error.message);
    throw error;
  }
}

// Función para verificar si la tabla está activada
async function checkTableActivation() {
  try {
    const response = await axios.get(`${BASE_URL}/activated-tables/activated`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("📋 Tablas activadas:");
    const funcionarioTable = response.data.find(
      (table) =>
        table.DatabaseName === "BD_ABM1" && table.TableName === "Funcionario"
    );

    if (funcionarioTable) {
      console.log("✅ Tabla Funcionario está activada:", funcionarioTable);
    } else {
      console.log("❌ Tabla Funcionario NO está activada");
    }

    return funcionarioTable;
  } catch (error) {
    console.error(
      "❌ Error verificando activación:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para intentar acceder a los registros
async function tryAccessRecords() {
  try {
    console.log("🔍 Intentando acceder a registros de BD_ABM1.Funcionario...");

    const response = await axios.get(
      `${BASE_URL}/databases/BD_ABM1/tables/Funcionario/records`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log("✅ Acceso exitoso a registros");
    console.log(`📊 Registros encontrados: ${response.data.count}`);

    return response.data;
  } catch (error) {
    console.error("❌ Error accediendo a registros:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);

    // Si es un error 400, mostrar más detalles
    if (error.response?.status === 400) {
      console.log("\n🔍 Detalles del error 400:");
      console.log("URL:", error.config?.url);
      console.log("Method:", error.config?.method);
      console.log("Headers:", error.config?.headers);
    }

    throw error;
  }
}

// Función para verificar la estructura de la tabla
async function checkTableStructure() {
  try {
    const response = await axios.get(
      `${BASE_URL}/activated-tables/structure/BD_ABM1/Funcionario`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log("📋 Estructura de la tabla Funcionario:");
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error obteniendo estructura:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función principal de diagnóstico
async function diagnoseTableAccess() {
  try {
    console.log("🚀 Iniciando diagnóstico de acceso a tabla...\n");

    // 1. Login
    await login();
    console.log("");

    // 2. Verificar permisos del usuario
    await checkUserPermissions();
    console.log("");

    // 3. Verificar si la tabla está activada
    await checkTableActivation();
    console.log("");

    // 4. Verificar estructura de la tabla
    await checkTableStructure();
    console.log("");

    // 5. Intentar acceder a los registros
    await tryAccessRecords();
    console.log("");

    console.log("✅ Diagnóstico completado");
  } catch (error) {
    console.error("💥 Error en el diagnóstico:", error.message);
  }
}

// Ejecutar el diagnóstico
diagnoseTableAccess();
