const axios = require("axios");

async function testDateTimeInsertion() {
  try {
    console.log("=== Prueba de Inserción con DateTime ===\n");

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

    // 2. Probar inserción con fecha y hora
    console.log("2. Probando inserción con fecha y hora...");
    const insertData = {
      Nombre: "Test DateTime",
      Apellido: "Test Apellido",
      Cedula: "66666666", // Cédula nueva
      FechaIngreso: "31/10/2025 14:30", // Formato datetime
      Email: "testdatetime@example.com",
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

      console.log("✅ Inserción exitosa con datetime:");
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

testDateTimeInsertion();
