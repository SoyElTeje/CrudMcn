const axios = require("axios");

async function testDateDisplay() {
  try {
    console.log("=== Prueba de Visualización de Fechas ===\n");

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

    // 2. Obtener estructura de la tabla Funcionario
    console.log("2. Obteniendo estructura de la tabla...");
    const structureResponse = await axios.get(
      "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/structure",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Estructura obtenida:");
    structureResponse.data.columns.forEach((column) => {
      console.log(`  - ${column.COLUMN_NAME}: ${column.DATA_TYPE}`);
    });

    // 3. Obtener datos de la tabla
    console.log("\n3. Obteniendo datos de la tabla...");
    const dataResponse = await axios.get(
      "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records?limit=5",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ Datos obtenidos:");
    dataResponse.data.data.forEach((record, index) => {
      console.log(`\nRegistro ${index + 1}:`);
      Object.keys(record).forEach((key) => {
        const column = structureResponse.data.columns.find(
          (col) => col.COLUMN_NAME === key
        );
        const dataType = column ? column.DATA_TYPE : "unknown";
        console.log(`  ${key} (${dataType}): ${record[key]}`);
      });
    });
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

testDateDisplay();
