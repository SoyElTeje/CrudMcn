const axios = require("axios");

async function testSingleDate() {
  try {
    console.log("=== Prueba de Fecha 31/10/2025 ===\n");

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

    // 2. Probar inserción con fecha 31/10/2025 (DD/MM/AAAA)
    console.log("2. Probando inserción con fecha 31/10/2025 (DD/MM/AAAA)...");
    const insertData = {
      Nombre: "Test Fecha 31/10",
      Apellido: "Test Apellido",
      Cedula: "55555555", // Cédula nueva
      FechaIngreso: "31/10/2025",
      Email: "test3110@example.com",
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

      console.log("✅ Inserción exitosa con fecha 31/10/2025:");
      console.log(insertResponse.data);
    } catch (insertError) {
      console.log("❌ Error en inserción:");
      console.log("Status:", insertError.response?.status);
      console.log("Error:", insertError.response?.data);
    }
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

testSingleDate();
