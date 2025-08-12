const axios = require("axios");

async function testFinalDates() {
  try {
    console.log("=== Prueba Final de Fechas ===\n");

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

    // 2. Probar inserción con fecha 01/01/2025 (DD/MM/AAAA)
    console.log("2. Probando inserción con fecha 01/01/2025 (DD/MM/AAAA)...");
    const insertData1 = {
      Nombre: "Test DD/MM 1",
      Apellido: "Test Apellido 1",
      Cedula: "99999991", // Cédula única
      FechaIngreso: "01/01/2025",
      Email: "testddmm1@example.com",
    };

    try {
      const insertResponse1 = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: insertData1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Inserción exitosa con fecha 01/01/2025:");
      console.log(insertResponse1.data);
    } catch (insertError1) {
      console.log("❌ Error en inserción 1:");
      console.log("Status:", insertError1.response?.status);
      console.log("Error:", insertError1.response?.data);
    }

    // 3. Probar inserción con fecha 31/10/2025 (DD/MM/AAAA)
    console.log("\n3. Probando inserción con fecha 31/10/2025 (DD/MM/AAAA)...");
    const insertData2 = {
      Nombre: "Test DD/MM 2",
      Apellido: "Test Apellido 2",
      Cedula: "99999992", // Cédula única
      FechaIngreso: "31/10/2025",
      Email: "testddmm2@example.com",
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

      console.log("✅ Inserción exitosa con fecha 31/10/2025:");
      console.log(insertResponse2.data);
    } catch (insertError2) {
      console.log("❌ Error en inserción 2:");
      console.log("Status:", insertError2.response?.status);
      console.log("Error:", insertError2.response?.data);
    }

    // 4. Probar con formato MM/DD/AAAA (debería fallar)
    console.log("\n4. Probando con formato MM/DD/AAAA (10/31/2025)...");
    const insertData3 = {
      Nombre: "Test MM/DD",
      Apellido: "Test Apellido 3",
      Cedula: "99999993", // Cédula única
      FechaIngreso: "10/31/2025", // Formato MM/DD/AAAA (debería fallar)
      Email: "testmmdd@example.com",
    };

    try {
      const insertResponse3 = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: insertData3,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("❌ Inserción exitosa (no debería ser exitosa):");
      console.log(insertResponse3.data);
    } catch (insertError3) {
      console.log("✅ Error esperado con formato MM/DD/AAAA:");
      console.log("Status:", insertError3.response?.status);
      console.log("Error:", insertError3.response?.data);
    }

    // 5. Probar con fecha inválida (debería fallar)
    console.log("\n5. Probando con fecha inválida (32/10/2025)...");
    const insertData4 = {
      Nombre: "Test Inválida",
      Apellido: "Test Apellido 4",
      Cedula: "99999994", // Cédula única
      FechaIngreso: "32/10/2025", // Fecha inválida (día 32)
      Email: "testinvalida@example.com",
    };

    try {
      const insertResponse4 = await axios.post(
        "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records",
        {
          record: insertData4,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("❌ Inserción exitosa (no debería ser exitosa):");
      console.log(insertResponse4.data);
    } catch (insertError4) {
      console.log("✅ Error esperado con fecha inválida:");
      console.log("Status:", insertError4.response?.status);
      console.log("Error:", insertError4.response?.data);
    }
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

testFinalDates();
