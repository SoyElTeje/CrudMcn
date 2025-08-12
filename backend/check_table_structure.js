const axios = require("axios");

async function checkTableStructure() {
  try {
    console.log("=== Verificando Estructura de Tabla ===\n");

    // 1. Probar login
    console.log("1. Iniciando sesión...");
    const loginResponse = await axios.post(
      "http://localhost:3001/api/auth/login",
      {
        username: "user",
        password: "user",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso\n");

    // 2. Obtener estructura de la tabla
    console.log("2. Obteniendo estructura de la tabla...");
    try {
      const structureResponse = await axios.get(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/structure",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Estructura obtenida:");
      structureResponse.data.columns.forEach((column) => {
        console.log(
          `  - ${column.COLUMN_NAME}: ${column.DATA_TYPE} (nullable: ${column.IS_NULLABLE}, identity: ${column.IS_IDENTITY})`
        );
      });
    } catch (structureError) {
      console.log("❌ Error obteniendo estructura:");
      console.log("Status:", structureError.response?.status);
      console.log("Error:", structureError.response?.data);
    }
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

checkTableStructure();
