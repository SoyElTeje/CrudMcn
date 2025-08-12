const axios = require("axios");

async function testDateFormatBackend() {
  try {
    console.log("=== Prueba de Formato de Fechas DD/MM/AAAA ===\n");

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

    // 2. Probar inserción con fecha en formato DD/MM/AAAA
    console.log("2. Probando inserción con fecha 31/10/2025...");
    const insertData = {
      Nombre: "Test Fecha",
      Apellido: "Test Apellido",
      Cedula: "88888888",
      FechaIngreso: "31/10/2025", // Fecha en formato DD/MM/AAAA
      Email: "testfecha@example.com",
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

      console.log("✅ Inserción exitosa con fecha DD/MM/AAAA:");
      console.log(insertResponse.data);
    } catch (insertError) {
      console.log("❌ Error en inserción:");
      console.log("Status:", insertError.response?.status);
      console.log("Error:", insertError.response?.data);
    }

    // 3. Probar con fecha inválida
    console.log("\n3. Probando con fecha inválida 32/10/2025...");
    const invalidData = {
      Nombre: "Test Fecha Inválida",
      Apellido: "Test Apellido",
      Cedula: "77777777",
      FechaIngreso: "32/10/2025", // Fecha inválida (día 32)
      Email: "testfechainvalida@example.com",
    };

    try {
      const invalidResponse = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: invalidData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Inserción exitosa (no debería ser exitosa):");
      console.log(invalidResponse.data);
    } catch (invalidError) {
      console.log("✅ Error esperado con fecha inválida:");
      console.log("Status:", invalidError.response?.status);
      console.log("Error:", invalidError.response?.data);
    }

    // 4. Probar con formato MM/DD/AAAA (debería fallar)
    console.log("\n4. Probando con formato MM/DD/AAAA (10/31/2025)...");
    const mmddData = {
      Nombre: "Test MM/DD",
      Apellido: "Test Apellido",
      Cedula: "66666666",
      FechaIngreso: "10/31/2025", // Formato MM/DD/AAAA (debería fallar)
      Email: "testmmdd@example.com",
    };

    try {
      const mmddResponse = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: mmddData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("❌ Inserción exitosa (no debería ser exitosa):");
      console.log(mmddResponse.data);
    } catch (mmddError) {
      console.log("✅ Error esperado con formato MM/DD/AAAA:");
      console.log("Status:", mmddError.response?.status);
      console.log("Error:", mmddError.response?.data);
    }

    // 5. Verificar registros insertados
    console.log("\n5. Verificando registros en la tabla...");
    const recordsResponse = await axios.get(
      "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records?limit=5",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Registros en la tabla:");
    const records = recordsResponse.data.data || recordsResponse.data;
    records.slice(0, 3).forEach((record, index) => {
      console.log(`Registro ${index + 1}:`);
      console.log(`  Nombre: ${record.Nombre}`);
      console.log(`  FechaIngreso: ${record.FechaIngreso}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

testDateFormatBackend();
