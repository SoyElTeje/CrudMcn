const axios = require("axios");

async function testIdentityField() {
  try {
    console.log("=== Prueba de Campo Identity (Auto-increment) ===\n");

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

    // 2. Obtener estructura de una tabla con ID auto-increment
    console.log("2. Obteniendo estructura de tabla...");
    const structureResponse = await axios.get(
      "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/structure",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Estructura de la tabla:");
    structureResponse.data.columns.forEach((column) => {
      console.log(`- Columna: ${column.COLUMN_NAME}`);
      console.log(`  Tipo: ${column.DATA_TYPE}`);
      console.log(`  Nullable: ${column.IS_NULLABLE}`);
      console.log(`  Default: ${column.COLUMN_DEFAULT || "N/A"}`);
      console.log(`  Identity: ${column.IS_IDENTITY ? "SÍ" : "NO"}`);
      console.log("");
    });

    // 3. Intentar insertar un registro sin el campo ID
    console.log("3. Intentando insertar registro sin campo ID...");
    const insertData = {
      Nombre: "Test User Final",
      Apellido: "Test LastName Final",
      Cedula: "99999999",
      FechaIngreso: "2024-01-01",
      Email: "testfinal@example.com",
      // No incluir el campo ID (debe ser auto-generado)
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

    // 4. Verificar que el registro se insertó correctamente
    console.log("\n4. Verificando registros en la tabla...");
    const recordsResponse = await axios.get(
      "http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records?limit=5",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Registros en la tabla:");
    const records = recordsResponse.data.data || recordsResponse.data;
    records.slice(0, 3).forEach((record, index) => {
      console.log(`Registro ${index + 1}:`, record);
    });
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

testIdentityField();
