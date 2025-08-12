const axios = require("axios");

async function debugDateInsertion() {
  try {
    console.log("=== Debug: Inserción de Fechas ===\n");

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

    // 2. Probar inserción con fecha simple
    console.log("2. Probando inserción con fecha 01/01/2025...");
    const insertData = {
      Nombre: "Test Debug",
      Apellido: "Test Debug",
      Cedula: "55555555",
      FechaIngreso: "01/01/2025", // Fecha simple
      Email: "testdebug@example.com",
    };

    try {
      const insertResponse = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: insertData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Inserción exitosa:");
      console.log(insertResponse.data);
    } catch (insertError) {
      console.log("❌ Error en inserción:");
      console.log("Status:", insertError.response?.status);
      console.log("Error:", insertError.response?.data);
    }

    // 3. Probar con fecha 31/10/2025
    console.log("\n3. Probando inserción con fecha 31/10/2025...");
    const insertData2 = {
      Nombre: "Test Debug 2",
      Apellido: "Test Debug 2",
      Cedula: "44444444",
      FechaIngreso: "31/10/2025", // Fecha problemática
      Email: "testdebug2@example.com",
    };

    try {
      const insertResponse2 = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: insertData2,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Inserción exitosa:");
      console.log(insertResponse2.data);
    } catch (insertError2) {
      console.log("❌ Error en inserción:");
      console.log("Status:", insertError2.response?.status);
      console.log("Error:", insertError2.response?.data);
    }

    // 4. Verificar estructura de la tabla
    console.log("\n4. Verificando estructura de la tabla...");
    const structureResponse = await axios.get(
      "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/structure",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Estructura de la tabla:");
    structureResponse.data.columns.forEach((column) => {
      if (column.DATA_TYPE.toLowerCase().includes("date")) {
        console.log(`- Columna: ${column.COLUMN_NAME}`);
        console.log(`  Tipo: ${column.DATA_TYPE}`);
        console.log(`  Nullable: ${column.IS_NULLABLE}`);
        console.log("");
      }
    });
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

debugDateInsertion();
