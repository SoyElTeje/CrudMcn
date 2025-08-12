const axios = require("axios");

async function testDateFormat() {
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

    // 2. Obtener usuarios para ver fechas de creación
    console.log("2. Obteniendo lista de usuarios...");
    const usersResponse = await axios.get(
      "http://localhost:3001/api/auth/users",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Usuarios encontrados:");
    usersResponse.data.forEach((user) => {
      console.log(`- Usuario: ${user.username}`);
      console.log(`  Fecha de creación: ${user.createdAt}`);
      console.log(`  Es admin: ${user.isAdmin}`);
      console.log("");
    });

    // 3. Obtener tablas activadas para ver fechas
    console.log("3. Obteniendo tablas activadas...");
    const activatedTablesResponse = await axios.get(
      "http://localhost:3001/api/activated-tables/activated",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Tablas activadas:");
    activatedTablesResponse.data.forEach((table) => {
      console.log(`- Tabla: ${table.DatabaseName}.${table.TableName}`);
      console.log(`  Fecha de creación: ${table.CreatedAt}`);
      console.log(`  Fecha de actualización: ${table.UpdatedAt}`);
      console.log(`  Estado: ${table.IsActive ? "Activa" : "Inactiva"}`);
      console.log("");
    });

    // 4. Obtener logs para ver fechas de timestamps
    console.log("4. Obteniendo logs del sistema...");
    const logsResponse = await axios.get(
      "http://localhost:3001/api/logs/all?limit=5",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Logs recientes:");
    const logs = logsResponse.data.data || logsResponse.data;
    logs.slice(0, 3).forEach((log) => {
      console.log(`- Acción: ${log.Action}`);
      console.log(`  Usuario: ${log.Username}`);
      console.log(`  Tabla: ${log.DatabaseName}.${log.TableName}`);
      console.log(`  Timestamp: ${log.Timestamp}`);
      console.log("");
    });

    console.log("=== Prueba completada ===");
    console.log(
      "\nNota: Las fechas se muestran en formato ISO desde el backend."
    );
    console.log(
      "El frontend debe convertirlas a formato DD/MM/AAAA usando las funciones de dateUtils."
    );
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

testDateFormat();
