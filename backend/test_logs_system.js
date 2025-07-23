const axios = require("axios");

const BASE_URL = "http://localhost:3001";
const TEST_DB = "TESTDB";
const TEST_TABLE = "TestTable";

// Datos de prueba
const testUsers = [
  { username: "admin", password: "admin123" },
  { username: "user2", password: "user123" },
];

async function loginUser(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password,
    });
    return response.data.token;
  } catch (error) {
    console.error(
      `❌ Error login ${username}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function testLogsSystem() {
  console.log("🚀 Iniciando pruebas del sistema de logs");
  console.log("=".repeat(50));

  // Probar login de admin
  console.log("1. Probando login de admin...");
  const adminToken = await loginUser("admin", "admin123");
  if (!adminToken) {
    console.log("❌ No se pudo obtener token de admin, abortando pruebas");
    return;
  }
  console.log("✅ Login de admin exitoso");

  // Configurar headers para admin
  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  // Probar login de user2
  console.log("\n2. Probando login de user2...");
  const user2Token = await loginUser("user2", "user123");
  if (!user2Token) {
    console.log("❌ No se pudo obtener token de user2");
  } else {
    console.log("✅ Login de user2 exitoso");
  }

  const user2Headers = {
    Authorization: `Bearer ${user2Token}`,
    "Content-Type": "application/json",
  };

  // 3. Probar inserción de registro (debe generar log)
  console.log("\n3. Probando inserción de registro...");
  try {
    const insertData = {
      record: {
        Name: "Test Log Record",
        Description: "Registro de prueba para logs",
        CreatedAt: new Date().toISOString(),
      },
    };

    const insertResponse = await axios.post(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/records`,
      insertData,
      { headers: adminHeaders }
    );

    console.log("✅ Inserción exitosa:", insertResponse.data);
  } catch (error) {
    console.log(
      "❌ Error en inserción:",
      error.response?.data || error.message
    );
  }

  // 4. Probar actualización de registro (debe generar log)
  console.log("\n4. Probando actualización de registro...");
  try {
    const updateData = {
      record: {
        Name: "Test Log Record Updated",
        Description: "Registro actualizado para logs",
      },
      primaryKeyValues: {
        Id: 1, // Asumiendo que existe un registro con ID 1
      },
    };

    const updateResponse = await axios.put(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/records`,
      updateData,
      { headers: adminHeaders }
    );

    console.log("✅ Actualización exitosa:", updateResponse.data);
  } catch (error) {
    console.log(
      "❌ Error en actualización:",
      error.response?.data || error.message
    );
  }

  // 5. Probar eliminación de registro (debe generar log)
  console.log("\n5. Probando eliminación de registro...");
  try {
    const deleteData = {
      primaryKeyValues: {
        Id: 1, // Asumiendo que existe un registro con ID 1
      },
    };

    const deleteResponse = await axios.delete(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/records`,
      {
        headers: adminHeaders,
        data: deleteData,
      }
    );

    console.log("✅ Eliminación exitosa:", deleteResponse.data);
  } catch (error) {
    console.log(
      "❌ Error en eliminación:",
      error.response?.data || error.message
    );
  }

  // 6. Probar exportación de Excel (debe generar log)
  console.log("\n6. Probando exportación de Excel...");
  try {
    const exportResponse = await axios.get(
      `${BASE_URL}/api/databases/${TEST_DB}/tables/${TEST_TABLE}/export-excel?exportType=all`,
      {
        headers: adminHeaders,
        responseType: "stream",
      }
    );

    console.log("✅ Exportación exitosa, archivo descargado");
  } catch (error) {
    console.log(
      "❌ Error en exportación:",
      error.response?.data || error.message
    );
  }

  // 7. Verificar logs generados
  console.log("\n7. Verificando logs generados...");
  try {
    const logsResponse = await axios.get(`${BASE_URL}/api/logs/all?limit=10`, {
      headers: adminHeaders,
    });

    console.log(`✅ Se encontraron ${logsResponse.data.length} logs:`);
    logsResponse.data.forEach((log, index) => {
      console.log(
        `   ${index + 1}. ${log.Action} en ${log.DatabaseName}.${
          log.TableName
        } por ${log.Username} - ${log.Timestamp}`
      );
    });
  } catch (error) {
    console.log(
      "❌ Error obteniendo logs:",
      error.response?.data || error.message
    );
  }

  // 8. Verificar estadísticas de logs
  console.log("\n8. Verificando estadísticas de logs...");
  try {
    const statsResponse = await axios.get(`${BASE_URL}/api/logs/stats`, {
      headers: adminHeaders,
    });

    console.log("✅ Estadísticas de logs:");
    statsResponse.data.forEach((stat) => {
      console.log(
        `   - ${stat.Action}: ${stat.Count} acciones, ${stat.UniqueUsers} usuarios únicos, ${stat.UniqueTables} tablas únicas`
      );
    });
  } catch (error) {
    console.log(
      "❌ Error obteniendo estadísticas:",
      error.response?.data || error.message
    );
  }

  // 9. Probar logs de usuario específico
  if (user2Token) {
    console.log("\n9. Probando logs de usuario específico...");
    try {
      const userLogsResponse = await axios.get(
        `${BASE_URL}/api/logs/my-logs?limit=5`,
        { headers: user2Headers }
      );

      console.log(`✅ User2 tiene ${userLogsResponse.data.length} logs`);
    } catch (error) {
      console.log(
        "❌ Error obteniendo logs de usuario:",
        error.response?.data || error.message
      );
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("🏁 Pruebas del sistema de logs completadas");
}

// Ejecutar pruebas
testLogsSystem().catch(console.error);
