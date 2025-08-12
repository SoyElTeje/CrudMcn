const axios = require("axios");

async function debugTableConditions() {
  try {
    console.log("=== Debug: Condiciones de Tabla Funcionario ===\n");

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

    // 2. Obtener condiciones de la tabla
    console.log("2. Obteniendo condiciones de la tabla...");
    const conditionsResponse = await axios.get(
      "http://localhost:3001/api/activated-tables/conditions/BD_ABM1/Funcionario",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Condiciones configuradas:");
    conditionsResponse.data.forEach((condition) => {
      console.log(`- Columna: ${condition.ColumnName}`);
      console.log(`  Tipo: ${condition.DataType}`);
      console.log(`  Requerido: ${condition.IsRequired ? "SÍ" : "NO"}`);
      console.log(`  Tipo de condición: ${condition.ConditionType || "N/A"}`);
      console.log(`  Valor de condición: ${condition.ConditionValue || "N/A"}`);
      console.log("");
    });

    // 3. Verificar si hay alguna condición para un campo llamado 'ID'
    const idCondition = conditionsResponse.data.find(
      (c) =>
        c.ColumnName.toLowerCase() === "id" ||
        c.ColumnName.toLowerCase() === "idfuncionario"
    );

    if (idCondition) {
      console.log("⚠️  CONDICIÓN PROBLEMÁTICA ENCONTRADA:");
      console.log(`- Campo: ${idCondition.ColumnName}`);
      console.log(`- Requerido: ${idCondition.IsRequired}`);
      console.log(`- Tipo: ${idCondition.DataType}`);
      console.log("");
    }

    // 4. Verificar estructura de la tabla nuevamente
    console.log("3. Verificando estructura de la tabla...");
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
      console.log(`  Identity: ${column.IS_IDENTITY ? "SÍ" : "NO"}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

debugTableConditions();
